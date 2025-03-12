import { Player } from './player';
import { Coordinates } from './coordinates';

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
