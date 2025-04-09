import { Injectable } from '@angular/core';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { ObjectsTypes, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';

@Injectable({ providedIn: 'root' })
export class GameUtilsService {
    getItemDescription(itemId: number): string {
        const itemDescriptions: Record<number, { name: string; description: string }> = {
            [ObjectsTypes.SPAWN]: { name: 'Point de départ', description: 'Le point de départ du jeu' },
        };
        return itemDescriptions[itemId]?.name || 'Vide';
    }

    getActivePlayerName(gameState: GameState): string {
        if (!gameState || !gameState.players || !gameState.currentPlayer) return 'Unknown';
        const player = gameState.players.find((p) => p.id === gameState.currentPlayer);
        return player?.name || 'Unknown';
    }

    getPlayerCount(gameState: GameState): number {
        return gameState?.players.length || 0;
    }

    canPerformAction(currentPlayer: Player, gameState: GameState): boolean {
        if (gameState.currentPlayerActionPoints <= 0) return false;

        const playerIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id);
        const playerPosition = gameState.playerPositions[playerIndex];

        const adjacent: Coordinates[] = [
            { x: playerPosition.x, y: playerPosition.y - 1 },
            { x: playerPosition.x, y: playerPosition.y + 1 },
            { x: playerPosition.x - 1, y: playerPosition.y },
            { x: playerPosition.x + 1, y: playerPosition.y },
        ];

        return adjacent.some(({ x, y }) => {
            if (x < 0 || x >= gameState.board.length || y < 0 || y >= gameState.board[0].length) return false;
            const tileType = gameState.board[x][y] % TILE_DELIMITER;
            return (
                tileType === TileTypes.DoorClosed || tileType === TileTypes.DoorOpen || gameState.playerPositions.some((p) => p.x === x && p.y === y)
            );
        });
    }
}
