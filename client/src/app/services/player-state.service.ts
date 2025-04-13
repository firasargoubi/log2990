import { Injectable } from '@angular/core';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { LobbyService } from './lobby.service';
import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerStateService {
    constructor(
        private lobbyService: LobbyService,
        private notificationService: NotificationService,
    ) {}

    getCurrentPlayer(): Player | null {
        const currentPlayer = this.lobbyService.getCurrentPlayer();
        if (!currentPlayer) return null;

        const socketId = this.lobbyService.getSocketId();
        if (currentPlayer.id !== socketId) {
            currentPlayer.id = socketId;
        }

        return currentPlayer;
    }

    syncCurrentPlayerWithGameState(currentPlayer: Player, gameState: GameState): Player {
        const playerInGameState = gameState.players.find((p) => p.id === currentPlayer.id);
        if (!playerInGameState) return currentPlayer;

        if (JSON.stringify(playerInGameState) !== JSON.stringify(currentPlayer)) {
            this.lobbyService.setCurrentPlayer(playerInGameState);
            return playerInGameState;
        }

        return currentPlayer;
    }

    notifyPlayerTurn(currentPlayer: Player, gameState: GameState, playerId: string): void {
        if (currentPlayer && playerId === currentPlayer.id) {
            this.notificationService.showSuccess("C'est votre tour!");
        } else {
            const player = gameState?.players.find((p) => p.id === playerId);
            if (player) {
                this.notificationService.showInfo(`C'est le tour de ${player.name}`);
            }
        }
    }

    isCurrentPlayerTurn(currentPlayer: Player, gameState: GameState | null): boolean {
        return gameState?.currentPlayer === currentPlayer?.id;
    }

    getPlayerCount(gameState: GameState | null): number {
        return gameState?.players?.length || 0;
    }

    getPlayers(gameState: GameState | null): Player[] {
        return gameState?.players || [];
    }
}
