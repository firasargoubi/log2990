import { Coordinates } from './coordinates';
import { Tile } from './game.interface';
import { Player } from './player';

// Action payloads
export interface MoveActionPayload {
    coordinates: Coordinates[];
}

export interface DoorActionPayload {
    tile: Tile;
}

export interface TeleportActionPayload {
    coordinates: Coordinates;
}

export interface ActionResult {
    success: boolean;
    message?: string;
}

// For game updates
export interface GameUpdateData {
    eventType: 'turnEnded' | 'movementProcessed' | 'doorOpened' | 'doorClosed' | 'teleported' | 'boardModified';
    previousPlayer?: string;
    currentPlayer?: string;
    actionResult?: ActionResult;
    playerMoved?: string;
    coordinates?: Coordinates[];
    tile?: Tile;
    actionId: string;
    newPosition?: Coordinates;
}

// For combat results
export interface AttackResult {
    attackDice: number;
    defenseDice: number;
    attackValue: number;
    defenseValue: number;
    damage: number;
    attackerHP: number;
    defenderHP: number;
    actionId: string;
}

export interface FleeResult {
    success: boolean;
    fleeingPlayer: Player;
    actionId: string;
}

export interface CombatEndResult {
    isInCombat: boolean;
    winner?: Player;
    loser?: Player;
    actionId: string;
}

// For client acknowledgment
export interface ClientAcknowledgment {
    playerId: string;
    actionId: string;
    status: 'received' | 'processing' | 'completed' | 'error';
}