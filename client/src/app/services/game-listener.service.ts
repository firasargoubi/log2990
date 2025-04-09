import { Injectable } from '@angular/core';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';
import { LobbyService } from './lobby.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class GameListenerService {
    constructor(
        private lobbyService: LobbyService,
        private notificationService: NotificationService,
    ) {}

    setupGameListeners({
        lobbyId,
        currentPlayer,
        updateState,
        abandon,
        syncPlayer,
        notifyTurn,
        getGameState,
    }: {
        lobbyId: string;
        currentPlayer: Player;
        updateState: (state: GameState) => void;
        abandon: () => void;
        syncPlayer: () => void;
        notifyTurn: (id: string) => void;
        getGameState: () => GameState;
    }): Subscription[] {
        return [
            this.lobbyService.onStartCombat().subscribe(() => {
                this.notificationService.showInfo('Combat engagé.');
            }),
            this.lobbyService.onCombatEnded().subscribe((data) => {
                currentPlayer.amountEscape = 0;
                this.notificationService.showInfo(`Le combat est terminée! ${data.loser.name} a perdu !`);
            }),

            this.lobbyService.onTurnStarted().subscribe((data) => {
                updateState(data.gameState);
                if (data.gameState.gameMode === 'CTF') {
                    if (!data.gameState.teams) {
                        this.lobbyService.createTeams(lobbyId, data.gameState.players);
                    }
                }
                syncPlayer();
                notifyTurn(data.currentPlayer);
            }),

            this.lobbyService.onMovementProcessed().subscribe((data) => {
                updateState(data.gameState);

                const state = getGameState();

                const isCurrentPlayer = state.currentPlayer === currentPlayer.id;
                const hasNoMoves = !state.availableMoves.length;
                const hasNoActions = state.currentPlayerActionPoints <= 0;
                const isAnimated = state.animation || false;
                const hasPendingItem = !!currentPlayer.pendingItem;

                if (isCurrentPlayer && hasNoMoves && hasNoActions && !isAnimated && !hasPendingItem) {
                    this.lobbyService.requestEndTurn(lobbyId);
                }
            }),

            this.lobbyService.onError().subscribe((error) => {
                this.notificationService.showError(error);
            }),

            this.lobbyService.onLobbyUpdated().subscribe((data) => {
                if (data.lobby.id === lobbyId) {
                    const updatedPlayer = data.lobby.players.find((p) => p.id === currentPlayer.id);
                    if (!updatedPlayer) {
                        this.lobbyService.disconnectFromRoom(lobbyId);
                        abandon();
                        return;
                    }
                    this.lobbyService.updatePlayers(data.lobby.id, data.lobby.players);
                }
            }),

            this.lobbyService.onBoardChanged().subscribe((data) => {
                updateState(data.gameState);

                const state = getGameState();
                const isCurrentPlayer = state.currentPlayer === currentPlayer.id;
                const hasNoMovementPoints = state.currentPlayerMovementPoints <= 0;
                const hasNoActions = state.currentPlayerActionPoints <= 0;
                const isAnimated = state.animation || false;
                const hasPendingItem = !!currentPlayer.pendingItem;
                console.log('[BoardChanged] Analyse auto-endTurn:', {
                    isCurrentPlayer,
                    hasNoMovementPoints,
                    hasNoActions,
                    isAnimated,
                    hasPendingItem,
                });

                if (isCurrentPlayer && hasNoMovementPoints && hasNoActions && !isAnimated && !hasPendingItem) {
                    console.log('[BoardChanged] 🎯 Fin de tour déclenchée automatiquement !');
                    this.lobbyService.requestEndTurn(lobbyId);
                }
            }),

            this.lobbyService.onFleeSuccess().subscribe((data) => {
                if (currentPlayer.name === data.fleeingPlayer.name) {
                    this.notificationService.showInfo('Vous avez fuit le combat.');
                    return;
                }
                this.notificationService.showInfo(`${data.fleeingPlayer.name} a fui le combat.`);
            }),

            this.lobbyService.onGameOver().subscribe((data) => {
                abandon();
                this.notificationService.showInfo(`${data.winner} gagne(ent), La partie est terminée.`);
            }),

            this.lobbyService.teamCreated().subscribe((data) => {
                if (data) {
                    const state = getGameState();
                    updateState({
                        ...state,
                        teams: {
                            team1: data.team1Server,
                            team2: data.team2Server,
                        },
                    });
                }
            }),
        ];
    }
}
