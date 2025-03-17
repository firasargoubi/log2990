import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CountdownComponent } from '@app/components/countdown-timer/countdown-timer.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
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
                console.log('Game started:', this.gameState);
                this.getCurrentPlayer();
            }),

            this.lobbyService.onTurnStarted().subscribe((data) => {
                this.gameState = data.gameState;
                console.log('Turn started:', this.gameState);
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

            this.lobbyService.onLobbyUpdated().subscribe((data) => {
                if (data.lobby.id === this.lobbyId) {
                    this.lobby = data.lobby;
                    const currentPlayer = this.lobby.players.find((p) => p.id === this.currentPlayer.id);
                    if (!currentPlayer) {
                        this.lobbyService.disconnectFromRoom(this.lobbyId);
                        this.router.navigate([PageUrl.Home], { replaceUrl: true });
                        return;
                    }
                    const host = this.lobby.players.find((p) => p.isHost);
                    if (!host) {
                        console.log('Placeholder for resetting debug');
                    }
                    console.log('Lobby updated:', this.lobby);
                    this.lobbyService.updatePlayers(this.lobby.id, this.lobby.players);
                }
            }),

            this.lobbyService.onBoardChanged().subscribe((data) => {
                this.gameState = data.gameState;
                console.log('Game state changed:', this.gameState);
            }),
        );
    }

    getCurrentPlayer() {
        const currentPlayer = this.lobbyService.getCurrentPlayer();

        if (!currentPlayer) {
            return;
        }
        this.currentPlayer = currentPlayer;
        const socketId = this.lobbyService.getSocketId();
        if (this.currentPlayer.id !== socketId) {
            this.currentPlayer.id = socketId;
        }

        return;
    }

    syncCurrentPlayerWithGameState() {
        if (!this.gameState || !this.currentPlayer) return;

        const playerInGameState = this.gameState.players.find((p) => p.id === this.currentPlayer?.id);

        if (playerInGameState) {
            if (JSON.stringify(playerInGameState) !== JSON.stringify(this.currentPlayer)) {
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

    onMoveRequest(coordinates: Coordinates[]) {
        if (!this.gameState || !this.currentPlayer) {
            return;
        }

        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            return;
        }

        this.lobbyService.requestMovement(this.lobbyId, coordinates);
    }

    onEndTurn() {
        if (!this.gameState || !this.currentPlayer) {
            return;
        }

        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            return;
        }

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

        return result;
    }

    onRemovePlayer(): void {
        this.remove.emit(this.player.id);
    }
    onAbandon(playerName: string): void {
        if (this.lobbyId && this.currentPlayer) {
            this.lobbyService.leaveGame(this.lobbyId, playerName);
        }
    }
    attack() {
        // Logique pour attaquer
    }

    defend() {
        // Logique pour se défendre
    }
}
