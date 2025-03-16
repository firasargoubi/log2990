import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CountdownComponent } from '@app/components/countdown-timer/countdown-timer.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { WAITING_PAGE_CONSTANTS } from '@app/Consts/app.constants';
import { PageUrl } from '@app/Consts/route-constants';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-playing-page',
    imports: [CommonModule, CountdownComponent, InventoryComponent, GameInfoComponent, MessagesComponent, GameBoardComponent, PlayerListComponent],
    standalone: true,
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    @Output() remove = new EventEmitter<string>();
    @Input() player!: Player;
    lobbyId: string = '';
    gameState: GameState;
    currentPlayer: Player;

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
                this.notificationService.showError(error);
            }),

            this.lobbyService.onPlayerLeft().subscribe((data) => {
                if (data.playerName === this.currentPlayer?.name) {
                    this.notificationService.showError('vous avez quitté la partie');
                    this.router.navigate([PageUrl.Home], { replaceUrl: true });
                }
            }),
            this.lobbyService.onHostDisconnected().subscribe(() => {
                this.notificationService.showError(WAITING_PAGE_CONSTANTS.lobbyCancelled);
                this.router.navigate([PageUrl.Home], { replaceUrl: true });
            }),
        );
    }

    getCurrentPlayer() {
        const currentPlayer = this.lobbyService.getCurrentPlayer();

        if (!currentPlayer) {
            return;
        }
        this.currentPlayer = currentPlayer;

        if (this.currentPlayer) {
            const socketId = this.lobbyService.getSocketId();
            if (this.currentPlayer.id !== socketId) {
                this.currentPlayer.id = socketId;
            }

            return;
        }

        if (this.gameState) {
            const socketId = this.lobbyService.getSocketId();

            const currentPlayerinGameState = this.gameState.players.find((player) => player.id === socketId);

            if (!currentPlayerinGameState) {
                return;
            }

            this.currentPlayer = currentPlayerinGameState;

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

    onRemovePlayer(): void {
        this.remove.emit(this.player.id);
    }
    onAbandon(playerName: string): void {
        if (this.lobbyId && this.currentPlayer) {
            this.lobbyService.leaveLobby(this.lobbyId, playerName);
        }
    }
    attack() {
        // Logique pour attaquer
    }

    defend() {
        // Logique pour se défendre
    }
}
