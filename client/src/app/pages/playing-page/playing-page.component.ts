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

    private subscriptions: Subscription[] = [];

    ngOnInit() {
        // Get lobby ID from route params
        this.route.params.subscribe((params) => {
            const lobbyId = params['id'];
            if (lobbyId) {
                this.lobbyId = lobbyId;
                this.setupGameListeners();
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
                this.getCurrentPlayer();
            }),

            this.lobbyService.onTurnStarted().subscribe((data) => {
                console.log('Turn started event received', data);
                this.gameState = data.gameState;
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
        if (this.gameState) {
            const socketId = this.lobbyService.getSocketId();
            this.currentPlayer = this.gameState.players.find((player) => player.id === socketId) || null;

            if (this.currentPlayer) {
                console.log('Current player found', this.currentPlayer);
            } else {
                console.error('Current player not found in game state', {
                    socketId,
                    players: this.gameState.players,
                });
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
        return this.gameState?.currentPlayer === this.currentPlayer?.id;
    }
}
