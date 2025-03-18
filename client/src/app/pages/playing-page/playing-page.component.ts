import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CombatComponent } from '@app/components/combat/combat.component';
import { CountdownPlayerComponent } from '@app/components/countdown-player/countdown-player.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { PageUrl } from '@app/Consts/route-constants';
import { ActionService } from '@app/services/action.service';
import { GameInteractionService } from '@app/services/game-interaction.service';
import { GameListenerService } from '@app/services/game-listener.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { TurnTimerService } from '@app/services/turn-timer.service';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-playing-page',
    standalone: true,
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
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    @Output() remove = new EventEmitter<string>();
    @Input() player!: Player;
    action: boolean = false;
    currentPlayer: Player;
    lobbyId: string = '';
    opponent: Player | null = null;
    gameState: GameState | null = null;

    debug: boolean = true;
    isInCombat: boolean = false;
    remainingTime: number = 0;
    isPlayerTurn: boolean = false; // Indique si c'est le tour du joueur
    combatSubscription: Subscription | null = null;
    turnSubscription: Subscription | null = null;
    lobby: GameLobby;

    subscriptions: Subscription[] = [];
    private actionService = inject(ActionService);
    private readonly smallMapThreshold = 10;
    private readonly mediumMapThreshold = 15;
    private lobbyService = inject(LobbyService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);
    private interactionService = inject(GameInteractionService);
    private gameListenerService = inject(GameListenerService);
    private turnTimerService = inject(TurnTimerService);

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            const lobbyId = params['id'];
            if (lobbyId) {
                this.lobbyId = lobbyId;
                this.setupGameListeners();
                this.getCurrentPlayer();
            } else {
                this.router.navigate(['/home'], { replaceUrl: true });
            }
        });

        this.subscriptions.push(
            this.lobbyService.onTileUpdate().subscribe((data) => {
                if (this.gameState) {
                    this.gameState = {
                        ...this.gameState,
                        board: data.newGameBoard.map((row) => [...row]),
                    };
                }
            }),

            this.lobbyService.onCombatUpdate().subscribe((data) => {
                if (data && data.timeLeft !== undefined) {
                    this.remainingTime = data.timeLeft;
                }
            }),

            this.lobbyService.onInteraction().subscribe((data) => {
                this.isInCombat = data.isInCombat;
                this.lobbyService.updateCombatStatus(this.isInCombat);
            }),
        );

        if (this.gameState) {
            this.gameState.currentPlayerActionPoints = 1;
        }
    }

    onActionRequest(tile: Tile): void {
        this.interactionService.performActionRequest({
            gameState: this.gameState,
            currentPlayer: this.currentPlayer,
            tile,
            lobbyId: this.lobbyId,
            handleAction: this.handleAction.bind(this),
            updateBoard: (board: Tile[][]) => {
                if (this.gameState) {
                    this.gameState = { ...this.gameState, board: board as unknown as number[][] };
                }
            },
            updateOpponent: (opponent) => {
                this.opponent = opponent;
            },
            updateCombatState: (combatState) => {
                this.isInCombat = combatState;
            },
            actionService: this.actionService,
            lobbyService: this.lobbyService,
            notificationService: this.notificationService,
        });
    }

    handleAction() {
        this.action = !this.action;
    }

    onAttackClick(playerId: string, lobbyId: string): void {
        this.lobbyService.startCombat(playerId, lobbyId);
        this.isInCombat = true;
        this.remainingTime = 30;
        this.turnTimerService.startCountdown(this.remainingTime, this.currentPlayer.id, (time) => (this.remainingTime = time));
    }
    onMoveRequest(coordinates: Coordinates[]): void {
        if (this.gameState?.currentPlayer === this.currentPlayer?.id) {
            this.lobbyService.requestMovement(this.lobbyId, coordinates);
        }
    }

    onEndTurn(): void {
        if (this.gameState?.currentPlayer === this.currentPlayer?.id) {
            this.lobbyService.requestEndTurn(this.lobbyId);
        }
    }

    getCurrentPlayer(): void {
        const current = this.lobbyService.getCurrentPlayer();
        if (current) {
            this.currentPlayer = current;
            const socketId = this.lobbyService.getSocketId();
            if (this.currentPlayer.id !== socketId) {
                this.currentPlayer.id = socketId;
            }
        }
    }

    getGameName(): string {
        return 'Forest Adventure';
    }

    getMapSize(): string {
        if (!this.gameState) return 'Unknown';
        const size = this.gameState.board.length;
        return size <= this.smallMapThreshold ? 'Small' : size <= this.mediumMapThreshold ? 'Medium' : 'Large';
    }

    getPlayerCount(): number {
        return this.gameState?.players.length || 0;
    }

    getActivePlayer(): string {
        if (!this.gameState) return 'Unknown';
        const player = this.gameState?.players.find((p) => p.id === this.gameState?.currentPlayer);
        return player?.name || 'Unknown';
    }

    getPlayers(): Player[] {
        return this.gameState?.players || [];
    }

    isCurrentPlayerTurn(): boolean {
        return this.gameState?.currentPlayer === this.currentPlayer?.id;
    }

    onRemovePlayer(): void {
        this.remove.emit(this.player.id);
    }

    abandon(): void {
        if (this.lobbyId && this.currentPlayer) {
            this.lobbyService.leaveLobby(this.lobbyId, this.currentPlayer.name);
            this.router.navigate(['/home']);
        }
    }

    setupGameListeners(): void {
        this.subscriptions.push(
            ...this.gameListenerService.setupListeners({
                lobbyId: this.lobbyId,
                currentPlayer: this.currentPlayer,
                gameState: this.gameState,
                lobby: this.lobby,
                updateState: (gameState: GameState) => (this.gameState = gameState),
                updateLobby: (lobby: GameLobby) => (this.lobby = lobby),
                setCurrentPlayer: (player: Player) => (this.currentPlayer = player),
                onPlayerRemoved: async () => this.router.navigate([PageUrl.Home], { replaceUrl: true }),
                onPlayerTurn: (playerId: string) => this.notifyPlayerTurn(playerId),
                onCombatStateChange: (isInCombat: boolean) => (this.isInCombat = isInCombat),
                showInfo: (msg: string) => this.notificationService.showInfo(msg),
                showError: (err: string) => this.notificationService.showError(err),
                showSuccess: (msg: string) => this.notificationService.showSuccess(msg),
            }),
        );
    }
    notifyPlayerTurn(playerId: string): void {
        if (this.currentPlayer && playerId === this.currentPlayer.id) {
            this.notificationService.showSuccess("C'est votre tour!");
        } else {
            const player = this.gameState?.players.find((p) => p.id === playerId);
            const name = player?.name || 'Un joueur';
            this.notificationService.showInfo(`C'est le tour de ${name}`);
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.turnTimerService.clearCountdown();
    }
}
