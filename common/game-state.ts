import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';
import { Tile } from './game.interface';

export interface GameState {
    id: string;
    board: number[][];
    turnCounter: number;
    players: Player[];
    deletedPlayers?: Player[];
    currentPlayer: string;
    availableMoves: Coordinates[];
    shortestMoves: Coordinates[][];
    playerPositions: Coordinates[];
    spawnPoints: Coordinates[];
    currentPlayerMovementPoints: number;
    currentPlayerActionPoints: number;
    combat?: {
        playerId?: string;
        isActive?: boolean;
        endTime?: Date;
    };
    debug: boolean;
    gameMode: string;
    animation?: boolean;
    flagPickedCounter?: number;
    doorCounter?: number;
    percentageDoorHandled?: number;
    amountDoors?: number;
    doorHandled?: Tile[];
    teams?: {
        team1: Player[];        
        team2: Player[];
    };
    startDate: Date | string;
    endDate?: Date | string;
}
