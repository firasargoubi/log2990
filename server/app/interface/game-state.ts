import { Player } from '@common/player';
import { Coordinates } from '@common/coordinates';

export interface GameState {
    id: string;
    board: number[][];
    turnCounter: number;
    players: Player[];
    currentPlayer: string;
    availableMoves: Coordinates[];
    gameBoard: number[][];
    playerPositions: Map<string, Coordinates>;
    currentPlayerMovementPoints: number;
}
