import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/services/notification.service';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';
import { CountdownComponent } from 'src/app/components/countdown-timer/countdown-timer.component';
import { GameInfoComponent } from 'src/app/components/game-info/game-info.component';
import { InventoryComponent } from 'src/app/components/inventory/inventory.component';
import { MessagesComponent } from 'src/app/components/messages/messages.component';
import { GameBoardComponent } from 'src/app/components/game-board/game-board.component';
import { GameState } from '@common/game-state';
import { Coordinates } from '@common/coordinates';
import { CommonModule } from '@angular/common';
import { SocketClientService } from '@app/services/socket-client.service';

@Component({
    selector: 'app-playing-page',
    imports: [CommonModule, CountdownComponent, InventoryComponent, GameInfoComponent, MessagesComponent, GameBoardComponent],
    standalone: true,
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    private socketService = inject(SocketClientService);
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
                this.setupSocketListeners();
            } else {
                this.router.navigate(['/main']);
            }
        });
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.socketService.disconnect();
    }

    setupSocketListeners() {
        // Listen for game state updates
        this.subscriptions.push(
            this.socketService.onGameStarted().subscribe((data) => {
                this.gameState = data.gameState;
                this.getCurrentPlayer();
            }),

            this.socketService.onTurnStarted().subscribe((data) => {
                this.gameState = data.gameState;
                this.notifyPlayerTurn(data.currentPlayer);
            }),

            this.socketService.onTurnEnded().subscribe((data) => {
                this.gameState = data.gameState;
            }),

            this.socketService.onMovementProcessed().subscribe((data) => {
                this.gameState = data.gameState;
            }),

            this.socketService.onError().subscribe((error) => {
                this.notificationService.showError(error);
            }),
        );
    }

    getCurrentPlayer() {
        if (this.gameState) {
            this.currentPlayer = this.gameState.players.find((player) => player.id === this.socketService.getSocketId()) || null;
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
        if (this.gameState && this.currentPlayer && this.gameState.currentPlayer === this.currentPlayer.id) {
            this.socketService.requestMovement(this.lobbyId, coordinate);
        }
    }

    onEndTurn() {
        if (this.gameState && this.currentPlayer && this.gameState.currentPlayer === this.currentPlayer.id) {
            this.socketService.requestEndTurn(this.lobbyId);
        }
    }
}
