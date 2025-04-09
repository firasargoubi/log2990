import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrl } from '@app/consts/route-constants';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { ActionService } from './action.service';
import { LobbyService } from './lobby.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class GameInteractionService {
    constructor(
        private lobbyService: LobbyService,
        private actionService: ActionService,
        private notificationService: NotificationService,
    ) {}

    handleActionRequest(tile: Tile, currentPlayer: Player, gameState: GameState, lobbyId: string): void {
        if (gameState.currentPlayer !== currentPlayer?.id || gameState.animation) return;

        if (gameState.currentPlayerActionPoints <= 0) {
            this.notificationService.showError("Vous n'avez plus de points d'action.");
            return;
        }

        const action = this.actionService.getActionType(tile, gameState);
        if (!action) return;

        if (action === 'openDoor') {
            this.lobbyService.openDoor(lobbyId, tile);
            return;
        }
        if (action === 'closeDoor') {
            this.lobbyService.closeDoor(lobbyId, tile);
            return;
        }

        if (action === 'battle') {
            const opponent = this.actionService.findOpponent(tile);
            const isSameTeam = opponent ? this.isSameTeam(currentPlayer, opponent, gameState) : false;
            if (isSameTeam) {
                if (opponent) {
                    this.lobbyService.startCombat(lobbyId, currentPlayer, opponent);
                }
                return;
            }
            if (opponent) {
                this.lobbyService.startCombat(lobbyId, currentPlayer, opponent);
            }
        }
    }

    requestMovement(currentPlayer: Player, gameState: GameState, lobbyId: string, coordinates: Coordinates[]): void {
        if (gameState.currentPlayer === currentPlayer?.id) {
            this.lobbyService.requestMovement(lobbyId, coordinates);
        }
    }

    endTurn(currentPlayer: Player, gameState: GameState, lobbyId: string): void {
        if (!gameState || !currentPlayer) {
            return;
        }

        if (gameState.currentPlayer !== currentPlayer.id) {
            return;
        }

        this.lobbyService.requestEndTurn(lobbyId);
    }

    abandonGame(gameState: GameState | null, currentPlayer: Player | null, lobbyId: string, router: Router): void {
        if (!gameState || !currentPlayer) {
            router.navigate([PageUrl.Home], { replaceUrl: true });
            return;
        }
        const isAnimated = gameState?.animation || false;
        if (isAnimated) return;

        if (lobbyId && currentPlayer) {
            this.lobbyService.disconnect();
            router.navigate([PageUrl.Home], { replaceUrl: true });
        }
    }

    private isSameTeam(player1: Player, player2: Player, gameState: GameState): boolean {
        if (!gameState || !gameState.teams) {
            return false;
        }
        const { team1, team2 } = gameState.teams;
        return (
            (team1.some((player) => player.id === player1.id) && team1.some((player) => player.id === player2.id)) ||
            (team2.some((player) => player.id === player1.id) && team2.some((player) => player.id === player2.id))
        );
    }
}
