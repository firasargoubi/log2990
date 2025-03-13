import { Player } from '@common/player';
import { Coordinates } from '@common/coordinates';

export interface GameState {
    id: string;                         // Unique ID for the game (same as the lobby ID)
    board: number[][];                  // Original game board configuration
    gameBoard: number[][];              // Current game board with any changes
    turnCounter: number;                // Track which turn we're on
    players: Player[];                  // List of players
    currentPlayer: string;              // ID of the player whose turn it is
    availableMoves: Coordinates[];      // Valid moves for the current player
    playerPositions: Map<string, Coordinates>; // Map of player IDs to their positions
    currentPlayerMovementPoints: number; // Movement points remaining for current player
}