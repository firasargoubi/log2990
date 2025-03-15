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
    combat: CombatState;
}

interface CombatState {
    playerId: string; // The ID of the player involved in the combat
    endTime: number; // The timestamp when the combat ends
    isActive: boolean; // Whether the combat is currently active
}
