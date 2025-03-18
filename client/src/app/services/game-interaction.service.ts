import { Injectable } from '@angular/core';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { ActionService } from './action.service';
import { LobbyService } from './lobby.service';
import { NotificationService } from './notification.service';

export interface ActionRequestContext {
    gameState: GameState | null;
    currentPlayer: Player | undefined;
    tile: Tile;
    lobbyId: string;
    handleAction: () => void;
    updateBoard: (board: Tile[][]) => void;
    updateOpponent: (opponent: Player | null) => void;
    updateCombatState: (combatState: boolean) => void;
    actionService: ActionService;
    lobbyService: LobbyService;
    notificationService: NotificationService;
}

@Injectable({
    providedIn: 'root',
})
export class GameInteractionService {
    isInCombat: boolean = false;
    performActionRequest(context: ActionRequestContext): void {
        const {
            gameState,
            currentPlayer,
            tile,
            lobbyId,
            handleAction,
            updateBoard,
            updateOpponent,
            updateCombatState,
            actionService,
            lobbyService,
            notificationService,
        } = context;

        if (!gameState || !currentPlayer || gameState.currentPlayer !== currentPlayer.id) return;

        const action = actionService.getActionType(tile, gameState);
        handleAction();

        if (!action) return;

        if (action === 'battle') {
            const opponent = actionService.findOpponent(tile) || null;
            updateOpponent(opponent);

            if (opponent) {
                lobbyService.initializeBattle(currentPlayer, opponent, lobbyId);
                lobbyService.onInteraction().subscribe((data) => {
                    this.isInCombat = data.isInCombat;
                    updateCombatState(data.isInCombat);
                });
            }
        }

        lobbyService.executeAction(action, tile, lobbyId).subscribe({
            next: (data) => {
                if (data?.newGameBoard) {
                    updateBoard(data.newGameBoard.map((row) => row.map((value): Tile => value as unknown as Tile)));
                }
            },
            error: () => {
                notificationService.showError("Échec de l'action.");
            },
        });
    }

    handleAction(actionState: boolean): boolean {
        return !actionState;
    }
}
