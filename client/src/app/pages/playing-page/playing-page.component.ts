import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CountdownComponent } from '@app/components/countdown-timer/countdown-timer.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-playing-page',
    imports: [CommonModule, CountdownComponent, InventoryComponent, GameInfoComponent, MessagesComponent, GameBoardComponent],
    standalone: true,
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    lobbyId: string = '';
    gameState: GameState | null = null;
    currentPlayer: Player | null = null;
    debug: boolean = true;
    lobby: GameLobby;

    private lobbyService = inject(LobbyService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);
    private subscriptions: Subscription[] = [];

    ngOnInit() {
        this.route.params.subscribe((params) => {
            const lobbyId = params['id'];
            if (lobbyId) {
                this.lobbyId = lobbyId;
                this.setupGameListeners();

                this.getCurrentPlayer();
            } else {
                this.router.navigate(['/main']);
            }
        });
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    setupGameListeners() {
        this.subscriptions.push(
            this.lobbyService.onGameStarted().subscribe((data) => {
                this.gameState = data.gameState;
                this.getCurrentPlayer();
            }),

            this.lobbyService.onTurnStarted().subscribe((data) => {
                this.gameState = data.gameState;
                this.syncCurrentPlayerWithGameState();
                this.notifyPlayerTurn(data.currentPlayer);
            }),

            this.lobbyService.onTurnEnded().subscribe((data) => {
                this.gameState = data.gameState;
            }),

            this.lobbyService.onMovementProcessed().subscribe((data) => {
                this.gameState = data.gameState;
            }),

            this.lobbyService.onError().subscribe((error) => {
                console.error('Socket error received', error);
                this.notificationService.showError(error);
            }),
        );
    }

    getCurrentPlayer() {
        this.currentPlayer = this.lobbyService.getCurrentPlayer();

        if (this.currentPlayer) {
            const socketId = this.lobbyService.getSocketId();
            if (this.currentPlayer.id !== socketId) {
                this.currentPlayer.id = socketId;
            }

            return;
        }

        if (this.gameState) {
            const socketId = this.lobbyService.getSocketId();

            this.currentPlayer = this.gameState.players.find((player) => player.id === socketId) || null;

            if (this.currentPlayer) {
                this.lobbyService.setCurrentPlayer(this.currentPlayer);
            } else {
                console.error('Current player not found in game state', {
                    socketId,
                    players: this.gameState.players,
                });
            }
        } else {
            console.warn('Cannot get current player from game state: game state is not available');
        }
    }

    syncCurrentPlayerWithGameState() {
        if (!this.gameState || !this.currentPlayer) return;

        const playerInGameState = this.gameState.players.find((p) => p.id === this.currentPlayer?.id);

        if (playerInGameState) {
            if (JSON.stringify(playerInGameState) !== JSON.stringify(this.currentPlayer)) {
                console.log('Updating current player with game state data');
                this.currentPlayer = playerInGameState;
                this.lobbyService.setCurrentPlayer(this.currentPlayer);
            }
        }
    }

    notifyPlayerTurn(playerId: string) {
        if (this.currentPlayer && playerId === this.currentPlayer.id) {
            this.notificationService.showSuccess("C'est votre tour!");
        } else {
            const player = this.gameState?.players.find((p) => p.id === playerId);
            if (player) {
                this.notificationService.showInfo(`C'est le tour de ${player.name}`);
            }
        }
    }

    onMoveRequest(coordinate: Coordinates) {
        if (!this.gameState || !this.currentPlayer) {
            console.error('Cannot move: game state or current player is missing');
            return;
        }

        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            console.error('Cannot move: not your turn');
            return;
        }

        console.log(`Requesting movement to (${coordinate.x}, ${coordinate.y})`);
        this.lobbyService.requestMovement(this.lobbyId, coordinate);
    }

    onEndTurn() {
        if (!this.gameState || !this.currentPlayer) {
            console.error('Cannot end turn: game state or current player is missing');
            return;
        }

        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            console.error('Cannot end turn: not your turn');
            return;
        }

        console.log('Requesting end of turn');
        this.lobbyService.requestEndTurn(this.lobbyId);
    }

    getGameName(): string {
        return 'Forest Adventure';
    }

    getMapSize(): string {
        if (!this.gameState) return 'Unknown';
        const size = this.gameState.board.length;
        if (size <= 10) return 'Small';
        if (size <= 15) return 'Medium';
        return 'Large';
    }

    getPlayerCount(): number {
        return this.gameState?.players.length || 0;
    }

    getActivePlayer(): string {
        if (!this.gameState) return 'Unknown';
        const player = this.gameState.players.find((p) => p.id === this.gameState?.currentPlayer);
        return player?.name || 'Unknown';
    }

    getPlayers(): Player[] {
        return this.gameState?.players || [];
    }

    isCurrentPlayerTurn(): boolean {
        if (!this.gameState || !this.currentPlayer) {
            return false;
        }

        const result = this.gameState.currentPlayer === this.currentPlayer.id;
        console.log(`Is current player's turn? ${result} (Current: ${this.gameState.currentPlayer}, Player: ${this.currentPlayer.id})`);

        return result;
    }

    debugLogGameState() {
        console.log('================ GAME STATE DEBUG ================');
        if (!this.gameState) {
            console.log('Game state is null or undefined');
            return;
        }

        console.log('Game State ID:', this.gameState.id);
        console.log('Current Player in Game:', this.gameState.currentPlayer);
        console.log('Local Player ID:', this.currentPlayer);
        console.log('Socket ID:', this.lobbyService.getSocketId());
        console.log('Is Local Player Turn:', this.isCurrentPlayerTurn());
        console.log('Available Moves:', this.gameState.availableMoves);

        console.log('Player Positions:');
        if (this.gameState.playerPositions instanceof Map) {
            Array.from(this.gameState.playerPositions.entries()).forEach(([playerId, pos]) => {
                console.log(`Player ${playerId} at (${pos.x}, ${pos.y})`);
            });
        }

        console.log('Players:');
        this.gameState.players.forEach((player) => {
            console.log(`- ${player.name} (${player.id})`);
        });

        console.log('================ END DEBUG ================');
    }
    abandon() {
        // Vérifier que le lobby et le joueur actuel existent
        if (this.lobbyId && this.currentPlayer) {
            // Appeler la méthode `leaveLobby` du service pour quitter le lobby
            this.removePlayer(this.currentPlayer.id);

            // Naviguer vers la page d'accueil après avoir quitté le lobby
            this.router.navigate(['/home']);
        }
    }

    removePlayer(playerId: string): void {
        if (this.lobby) {
            const player = this.lobby.players.find((p) => p.id === playerId);
            if (player) {
                this.lobbyService.leaveLobby(this.lobby.id, player.name);
            }
        }
    }

    attack() {
        // Logique pour attaquer
    }

    defend() {
        // Logique pour se défendre
    }
}
