import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';

export interface GameState {
    id: string;
    board: number[][];
    gameBoard: number[][];
    turnCounter: number;
    players: Player[];
    currentPlayer: string;
    availableMoves: Coordinates[];
    playerPositions: Map<string, Coordinates>;
    currentPlayerMovementPoints: number;
    combat?: {
        playerId: string;
    };
}
