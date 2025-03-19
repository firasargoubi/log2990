import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CombatComponent } from '@app/components/combat/combat.component';
import { CountdownPlayerComponent } from '@app/components/countdown-player/countdown-player.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { DELAY_COUNTDOWN, MAP_SIZES, MapSize, PLAYING_PAGE, PLAYING_PAGE_DESCRIPTION } from '@app/Consts/app.constants';
import { PageUrl } from '@app/Consts/route-constants';
import { ActionService } from '@app/services/action.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { ObjectsTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-playing-page',
    imports: [CommonModule, CountdownPlayerComponent, InventoryComponent, GameInfoComponent, MessagesComponent, GameBoardComponent, CombatComponent],
    standalone: true,
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    @Output() action: boolean = false;
    @Output() currentPlayer: Player;
    @Output() lobbyId: string = '';
    @Output() opponent: Player | null = null;
    @Output() gameState: GameState;
    @Output() remove = new EventEmitter<string>();
    @Output() deletedPlayers: Player[] = [];
    @Input() player!: Player;
    @Input() tileInfo: Tile;
    isInCombat: boolean = false;
    isPlayerTurn: boolean = false;
    combatSubscription: Subscription | null = null;
    lobby: GameLobby;
    interval: number | null = null;
    remainingTime: number = 0;
    private debug: boolean = false;
    private lobbyService = inject(LobbyService);
    private actionService = inject(ActionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);
    private subscriptions: Subscription[] = [];

    get isAnimated(): boolean {
        return this.gameState.animation || false;
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === PLAYING_PAGE.debugKey && this.currentPlayer.isHost) {
            this.setDebugMode();
        }
    }

    ngOnInit() {
        this.route.params.subscribe((params) => {
            const lobbyId = params['id'];
            if (lobbyId) {
                this.lobbyId = lobbyId;
                this.setupGameListeners();

                this.getCurrentPlayer();
            } else {
                this.router.navigate([PageUrl.Home, { replaceUrl: true }]);
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
                this.remainingTime = data.timeLeft;
            }
        });

        this.lobbyService.onInteraction().subscribe((data) => {
            this.isInCombat = data.isInCombat;
            this.lobbyService.updateCombatStatus(this.isInCombat);
        });

        this.lobbyService.onCombatEnded().subscribe(() => {
            this.isInCombat = false;
            this.lobbyService.updateCombatStatus(this.isInCombat);
        });

        if (this.gameState) {
            this.gameState.currentPlayerActionPoints = 1;
        }
    }

    onActionRequest(tile: Tile) {
        const isInvalidState = !this.gameState || !this.currentPlayer;
        const isNotCurrentPlayerTurn = this.gameState.currentPlayer !== this.currentPlayer.id;
        const isAnimationActive = this.gameState.animation;

        if (isInvalidState || isNotCurrentPlayerTurn || isAnimationActive) {
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

    startTurnCountdown(): void {
        if (this.remainingTime > 0) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    if (this.interval !== null) {
                        clearInterval(this.interval);
                    }
                }
            }, DELAY_COUNTDOWN);
        }
    }

    ngOnDestroy() {
        this.abandon();
        this.subscriptions.forEach((sub) => sub.unsubscribe());
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
        return PLAYING_PAGE_DESCRIPTION.gameName;
    }

    getMapSize(): string {
        if (!this.gameState) return 'Unknown';
        const size = this.gameState.board.length;
        if (size === MapSize.SMALL) return MAP_SIZES.small;
        if (size === MapSize.MEDIUM) return MAP_SIZES.medium;
        return MAP_SIZES.large;
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
        if (!this.gameState || !this.currentPlayer) {
            this.router.navigate([PageUrl.Home], { replaceUrl: true });
            return;
        }
        const isAnimated = this.gameState.animation || false;
        if (isAnimated) {
            return;
        }
        if (this.lobbyId && this.currentPlayer) {
            this.lobbyService.disconnect();
            this.router.navigate([PageUrl.Home], { replaceUrl: true });
        }
    }

    onInfoSent(details: string) {
        if (!details) {
            this.notificationService.showError('Aucune information disponible pour cette tuile.');
            return;
        }

        const lines = details.split('\n');
        let info = '';

        lines.forEach((line) => {
            if (line.startsWith('Player:')) {
                const playerName = line.replace('Player: ', '').trim();
                info += `Joueur: ${playerName}\n`;
            } else if (line.startsWith('Item:')) {
                const itemId = parseInt(line.replace('Item: ', '').trim(), 10);
                const itemDescription = this.getItemDescription(itemId);
                info += itemDescription ? `Objet: ${itemDescription}\n` : `Objet inconnu (ID: ${itemId})\n`;
            } else if (line.startsWith('Tile Type:')) {
                const tileTypeId = parseInt(line.replace('Tile Type: ', '').trim(), 10);
                info += `Type de tuile: ${tileTypeId}\n`;
            }
        });

        if (!info) {
            info = 'Aucune information pertinente pour cette tuile.';
        }

        this.notificationService.showInfo(info);
    }

    getCurrentPlayer() {
        const currentPlayer = this.lobbyService.getCurrentPlayer();

        if (!currentPlayer) {
            this.router.navigate(['/home'], { replaceUrl: true });
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

    getDeletedPlayers(): Player[] {
        return this.gameState?.deletedPlayers || [];
    }

    private setupGameListeners() {
        this.subscriptions.push(
            this.lobbyService.onGameStarted().subscribe((data) => {
                this.gameState = data.gameState;
                this.getCurrentPlayer();
            }),

            this.lobbyService.onStartCombat().subscribe((data) => {
                this.isInCombat = true;
                this.isPlayerTurn = data.firstPlayer.id === this.currentPlayer.id;
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
                this.currentPlayer = data.gameState.players.find((p) => p.id === this.currentPlayer.id) || this.currentPlayer;
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
                this.currentPlayer = data.gameState.players.find((p) => p.id === this.currentPlayer.id) || this.currentPlayer;
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

            this.lobbyService.onGameOver().subscribe((data) => {
                this.abandon();
                this.notificationService.showInfo(`${data.winner} est vraiment le goat my god.`);
            }),
        );
    }

    private setDebugMode() {
        this.debug = !this.debug;
        this.lobbyService.setDebug(this.lobbyId, this.debug);
    }

    private notifyPlayerTurn(playerId: string) {
        if (this.currentPlayer && playerId === this.currentPlayer.id) {
            this.notificationService.showSuccess(PLAYING_PAGE_DESCRIPTION.yourTurn);
        } else {
            const player = this.gameState?.players.find((p) => p.id === playerId);
            if (player) {
                this.notificationService.showInfo(`${PLAYING_PAGE_DESCRIPTION.turnOff} ${player.name}`);
            }
        }
    }

    private getItemDescription(itemId: number): string | null {
        const itemDescriptions: Record<number, { name: string; description: string }> = {
            [ObjectsTypes.SPAWN]: { name: 'Point de départ', description: 'Le point de départ du jeu' },
        };

        return itemDescriptions[itemId]?.name || 'Vide';
    }
}
