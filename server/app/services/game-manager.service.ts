import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Service } from 'typedi';

@Service()
export class GameManagerService {
    isPlayerOnIceTile(gameState: GameState, player: Player): boolean {
        const playerIndex = gameState.players.findIndex((p) => p.id === player.id);
        const position = gameState.playerPositions[playerIndex];
        if (!position) return false;

        const tile = gameState.board[position.x][position.y];
        return tile === TileTypes.Ice;
    }

    isTileValid(tile: Coordinates, gameState: GameState, occupiedPositions: Set<string>): boolean {
        const isOccupiedByPlayer = occupiedPositions.has(JSON.stringify(tile));
        const isGrassTile = gameState.board[tile.x]?.[tile.y] === 0;
        return !isOccupiedByPlayer && isGrassTile;
    }

    isWithinBounds(tile: Coordinates, board: number[][]): boolean {
        if (tile.y < 0 || tile.y >= board.length) return false;
        const row = board[tile.y];
        return tile.x >= 0 && tile.x < row.length;
    }
}
