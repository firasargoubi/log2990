import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CombatComponent } from '@app/components/combat/combat.component';
import { CountdownPlayerComponent } from '@app/components/countdown-player/countdown-player.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { ActionService } from '@app/services/action.service';

import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { PageUrl } from '@app/Consts/route-constants';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-playing-page',
    imports: [
        CommonModule,
        CountdownPlayerComponent,
        InventoryComponent,
        GameInfoComponent,
        MessagesComponent,
        GameBoardComponent,
        CombatComponent,
        PlayerListComponent,
    ],
    standalone: true,
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    @Output() action: boolean = false;
    @Output() currentPlayer: Player;
    @Output() lobbyId: string = '';
    @Output() opponent: Player | null = null;
    @Output() gameState: GameState | null = null;
    @Output() remove = new EventEmitter<string>();
    @Input() player!: Player;
    debug: boolean = true;
    isInCombat: boolean = false;
    remainingTime: number = 0;
    isPlayerTurn: boolean = false; // Indique si c'est le tour du joueur
    combatSubscription: Subscription | null = null;
    turnSubscription: Subscription | null = null;
    lobby: GameLobby;
    private interval: number | null = null;
    private lobbyService = inject(LobbyService);
    private actionService = inject(ActionService);
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
        this.lobbyService.onTileUpdate().subscribe({
            next: (data) => {
                if (this.gameState) {
                    this.gameState = {
                        ...this.gameState,
                        board: data.newGameBoard.map((row) => [...row]),
                    };
                }
            },
        });
        this.combatSubscription = this.lobbyService.onCombatUpdate().subscribe((data) => {
            if (data && data.timeLeft !== undefined) {
                this.remainingTime = data.timeLeft; // Mettez à jour le temps restant
            }
        });

        this.lobbyService.onInteraction().subscribe((data) => {
            this.isInCombat = data.isInCombat;
            console.log('combat?', this.isInCombat);
            this.lobbyService.updateCombatStatus(this.isInCombat);
        });
        if (this.gameState) {
            this.gameState.currentPlayerActionPoints = 1;
        }
    }
    onActionRequest(tile: Tile) {
        if (!this.gameState || !this.currentPlayer) {
            return;
        }
        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            return;
        }

        const action = this.actionService.getActionType(tile, this.gameState);
        this.handleAction();
        if (!action) {
            return;
        }

        if (action === 'battle') {
            this.opponent = this.actionService.findOpponent(tile) || null;
            if (this.opponent) {
                this.lobbyService.initializeBattle(this.currentPlayer, this.opponent, this.lobbyId);
                this.lobbyService.onInteraction().subscribe((data) => {
                    this.isInCombat = data.isInCombat;
                });
            }
        }
        this.lobbyService.executeAction(action, tile, this.lobbyId).subscribe({
            next: (data) => {
                if (this.gameState?.board) {
                    this.gameState = {
                        ...this.gameState,
                        board: data.newGameBoard.map((row) => [...row]),
                    };
                }
            },
        });
    }

    handleAction() {
        this.action = !this.action;
    }

    onAttackClick(playerId: string, lobbyId: string): void {
        this.lobbyService.startCombat(playerId, lobbyId);
        this.isInCombat = true;
        this.remainingTime = 30;
    }

    startTurnCountdown(): void {
        if (this.remainingTime > 0) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                    this.updateTimerForAllPlayers();
                } else {
                    if (this.interval !== null) {
                        clearInterval(this.interval);
                    }
                }
            }, 1000);
        }
    }

    updateTimerForAllPlayers(): void {
        if (this.currentPlayer) {
            this.lobbyService.updateCombatTime(this.remainingTime);
        }
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

            this.lobbyService.onLobbyUpdated().subscribe((data) => {
                if (data.lobby.id === this.lobbyId) {
                    this.lobby = data.lobby;
                    const currentPlayer = this.lobby.players.find((p) => p.id === this.currentPlayer.id);
                    if (!currentPlayer) {
                        this.lobbyService.disconnectFromRoom(this.lobbyId);
                        this.router.navigate([PageUrl.Home], { replaceUrl: true });
                        return;
                    }
                    this.lobbyService.updatePlayers(this.lobby.id, this.lobby.players);
                }
            }),

            this.lobbyService.onBoardChanged().subscribe((data) => {
                this.gameState = data.gameState;
            }),

            this.lobbyService.onFleeSuccess().subscribe((data) => {
                this.isInCombat = false;
                this.lobbyService.updateCombatStatus(this.isInCombat);
                this.currentPlayer.life = this.currentPlayer.maxLife;
                if (this.currentPlayer.name === data.fleeingPlayer.name) {
                    this.notificationService.showInfo('Vous avez fuit le combat.');
                    return;
                }
                this.notificationService.showInfo(`${data.fleeingPlayer.name} a fui le combat.`);
            }),

            this.lobbyService.onAttackEnd().subscribe((data) => {
                this.isInCombat = data.isInCombat;
                this.lobbyService.updateCombatStatus(this.isInCombat);
                this.currentPlayer.life = this.currentPlayer.maxLife;
                this.notificationService.showInfo(`${this.currentPlayer.name} a fini son combat`);
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
    abandon() {
        if (this.lobbyId && this.currentPlayer) {
            this.lobbyService.leaveLobby(this.lobbyId, this.currentPlayer.name);
            this.router.navigate(['/home']);
        }
    }
}
