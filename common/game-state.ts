import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';

export interface GameState {
    id: string;
    board: number[][];
    turnCounter: number;
    players: Player[];
    currentPlayer: string;
    availableMoves: Coordinates[];
    shortestMoves: Coordinates[][];
    playerPositions: Coordinates[];
    spawnPoints: Coordinates[];
    currentPlayerMovementPoints: number;
    combat?: {
        playerId: string;
        isActive: boolean;
        endTime: Date;
    };
}
