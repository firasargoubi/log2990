import { Player } from '@common/player';
import { Coordinates } from '@common/coordinates';

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
}