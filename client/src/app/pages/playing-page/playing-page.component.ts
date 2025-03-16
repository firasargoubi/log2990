import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CombatComponent } from '@app/components/combat/combat.component';
import { CountdownComponent } from '@app/components/countdown-timer/countdown-timer.component';
import { GameBoardComponent } from '@app/components/game-board/game-board.component';
import { GameInfoComponent } from '@app/components/game-info/game-info.component';
import { InventoryComponent } from '@app/components/inventory/inventory.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { ActionService } from '@app/services/action.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-playing-page',
    imports: [CommonModule, CountdownComponent, InventoryComponent, GameInfoComponent, MessagesComponent, GameBoardComponent, CombatComponent],
    standalone: true,
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    @Output() action: boolean = false;
    @Output() currentPlayer: Player | null = null;
    @Output() lobbyId: string = '';
    @Output() opponent: Player | null = null;
    @Output() gameState: GameState | null = null;
    debug: boolean = true;
    isInCombat: boolean = false;
    remainingTime: number = 0;
    isPlayerTurn: boolean = false; // Indique si c'est le tour du joueur
    combatSubscription: Subscription | null = null;
    turnSubscription: Subscription | null = null;
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
                console.log('Mise à jour reçue pour une tuile:', data.newGameBoard);

                if (this.gameState) {
                    this.gameState = {
                        ...this.gameState,
                        board: data.newGameBoard.map((row) => [...row]),
                    };
                }
            },
            error: (err) => console.error('Erreur réception mise à jour tuile:', err),
        });
        this.combatSubscription = this.lobbyService.onCombatUpdate().subscribe((data) => {
            if (data && data.timeLeft !== undefined) {
                this.remainingTime = data.timeLeft; // Mettez à jour le temps restant
            }
        });

        this.lobbyService.onInteraction().subscribe((data) => {
            console.log(data);
            this.isInCombat = data.isInCombat;
            console.log(this.isInCombat);
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
                this.isPlayerTurn = data.currentPlayer === this.currentPlayer?.id;
                this.remainingTime = 30; // Réinitialiser à 30 secondes pour chaque tour
                // this.currentPlayer = data.currentPlayer;
                this.startTurnCountdown(); // Démarrer le compte à rebours du tour
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

            this.lobbyService.onBoardChanged().subscribe((data) => {
                this.gameState = data.gameState;
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
            console.error('Cannot move: game state or current player is missing');
            return;
        }

        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            console.error('Cannot move: not your turn');
            return;
        }

        this.lobbyService.requestMovement(this.lobbyId, coordinates);
    }

    onActionRequest(tile: Tile) {

        console.log('Action request:', tile);
        if (!this.gameState || !this.currentPlayer) {
            console.error('Cannot perform action: game state or current player is missing');
            return;
        }
        if (this.gameState.currentPlayer !== this.currentPlayer.id) {
            console.error('Cannot perform action: not your turn');
            return;
        }

        const action = this.actionService.getActionType(tile, this.gameState);
        if (!action) {
            return;
        }
        console.log("Action effectuée:", action);

        if (action === 'battle') {
            this.opponent = this.actionService.findOpponent(tile) || null;
            console.log(this.opponent);
            if (this.opponent) {
                this.lobbyService.initializeBattle(this.currentPlayer, this.opponent, this.lobbyId);
                this.lobbyService.onInteraction().subscribe((data) => {
                    this.isInCombat = data.isInCombat;
                });
            } else {
                console.error('Opponent not found for battle initialization');
            }
        }
        console.log("Action effectuée:", action);
        this.lobbyService.executeAction(action, tile, this.lobbyId).subscribe({
            next: (data) => {
                if (this.gameState?.board) {
                    console.log('Mise à jour du gameBoard reçue:', data.newGameBoard);

                    this.gameState = {
                        ...this.gameState,
                        board: data.newGameBoard.map((row) => [...row]),
                    };
                }
            },
            error: (err) => console.error('Error processing tile update:', err),
        });
        this.action = false;
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

    abandon() {
        // Vérifier que le lobby et le joueur actuel existent
        if (this.lobbyId && this.currentPlayer) {
            // Appeler la méthode `leaveLobby` du service pour quitter le lobby
            this.lobbyService.leaveLobby(this.lobbyId, this.currentPlayer.name);
            this.router.navigate(['/home']);
        }
    }

    handleAction() {
        console.log('Bouton action cliqué');
        this.action = !this.action;
    }

    // Gestion du combat pour réinitialiser à 30 secondes
    onAttackClick(playerId: string, lobbyId: string): void {
        this.lobbyService.startCombat(playerId, lobbyId); // Démarre le combat
        this.isInCombat = true; // Le joueur est en combat
        this.remainingTime = 30; // Réinitialiser à 30 secondes pour le combat
    }

    // Vérifier si le joueur courant est impliqué dans le combat
    isCurrentPlayerInCombat(): boolean {
        return this.gameState?.combat?.playerId === this.currentPlayer?.id;
    }

    startTurnCountdown(): void {
        if (this.remainingTime > 0) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                    this.updateTimerForAllPlayers(); // Envoyer la mise à jour à tous les joueurs
                } else {
                    if (this.interval !== null) {
                        clearInterval(this.interval); // Arrêter le compte à rebours quand il atteint zéro
                    }
                }
            }, 1000); // 1 seconde
        }
    }

    updateTimerForAllPlayers(): void {
        if (this.currentPlayer) {
            this.lobbyService.updateCombatTime(this.remainingTime);
        }
    }
}
