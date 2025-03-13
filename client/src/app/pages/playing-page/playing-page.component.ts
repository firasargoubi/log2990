import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/services/notification.service';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CountdownComponent } from '@app/components/countdown-timer/countdown-timer.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameState } from '@common/game-state';
import { Coordinates } from '@common/coordinates';
import { LobbyService } from '@app/services/lobby.service';

@Component({
    selector: 'app-playing-page',
    imports: [CommonModule, CountdownComponent, InventoryComponent, GameInfoComponent, MessagesComponent, GameBoardComponent],
    standalone: true,
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    private lobbyService = inject(LobbyService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);

    lobbyId: string = '';
    gameState: GameState | null = null;
    currentPlayer: Player | null = null;
    debug: boolean = true; // For debugging, set to false in production

    private subscriptions: Subscription[] = [];

    ngOnInit() {
        // Get lobby ID from route params
        this.route.params.subscribe((params) => {
            const lobbyId = params['id'];
            if (lobbyId) {
                this.lobbyId = lobbyId;
                this.setupGameListeners();

                // Get the current player from LobbyService immediately
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
        // Listen for game state updates
        this.subscriptions.push(
            this.lobbyService.onGameStarted().subscribe((data) => {
                console.log('Game started event received', data);
                this.gameState = data.gameState;
                // Ensure we have the current player
                this.getCurrentPlayer();
            }),

            this.lobbyService.onTurnStarted().subscribe((data) => {
                console.log('Turn started event received', data);
                this.gameState = data.gameState;
                // Update player if needed
                this.syncCurrentPlayerWithGameState();
                this.notifyPlayerTurn(data.currentPlayer);
            }),

            this.lobbyService.onTurnEnded().subscribe((data) => {
                console.log('Turn ended event received', data);
                this.gameState = data.gameState;
            }),

            this.lobbyService.onMovementProcessed().subscribe((data) => {
                console.log('Movement processed event received', data);
                this.gameState = data.gameState;
            }),

            this.lobbyService.onError().subscribe((error) => {
                console.error('Socket error received', error);
                this.notificationService.showError(error);
            }),
        );
    }

    getCurrentPlayer() {
        console.log('Getting current player...');

        // First try to get the player from the LobbyService
        this.currentPlayer = this.lobbyService.getCurrentPlayer();

        if (this.currentPlayer) {
            console.log('Current player from LobbyService:', this.currentPlayer);

            // Ensure the player ID matches the current socket ID
            const socketId = this.lobbyService.getSocketId();
            if (this.currentPlayer.id !== socketId) {
                console.log(`Updating player ID from ${this.currentPlayer.id} to ${socketId}`);
                this.currentPlayer.id = socketId;
            }

            return;
        }

        // If not found in LobbyService, try to find in game state
        if (this.gameState) {
            const socketId = this.lobbyService.getSocketId();
            console.log('Trying to find player in game state with socket ID:', socketId);

            this.currentPlayer = this.gameState.players.find((player) => player.id === socketId) || null;

            if (this.currentPlayer) {
                console.log('Found player in game state:', this.currentPlayer);
                // Save to LobbyService for future reference
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

    // Keep current player in sync with game state
    syncCurrentPlayerWithGameState() {
        if (!this.gameState || !this.currentPlayer) return;

        // Find the current player in the game state
        const playerInGameState = this.gameState.players.find((p) => p.id === this.currentPlayer?.id);

        if (playerInGameState) {
            // Update current player with game state data if needed
            if (JSON.stringify(playerInGameState) !== JSON.stringify(this.currentPlayer)) {
                console.log('Updating current player with game state data');
                this.currentPlayer = playerInGameState;
                // Also update in LobbyService
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

    // Game info helper methods for the template
    getGameName(): string {
        return 'Forest Adventure'; // Replace with actual game name from game state
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

    // Debug methods
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
}
