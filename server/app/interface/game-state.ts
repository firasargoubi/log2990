import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';

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
