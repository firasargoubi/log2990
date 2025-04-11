import { Tile } from "./game.interface";

export interface Player {
    pendingItem: number;
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    life: number;
    maxLife: number;
    speed: number;
    attack: number;
    defense: number;
    amountEscape?: number;
    bonus?: {
        life?: number;
        speed?: number;
        attack?: 'D4' | 'D6';
        defense?: 'D4' | 'D6';
    };
    currentMP?: number;
    currentAP?: number;
    fightCount?: number;
    winCount: number;
    loseCount: number;
    items?: number[];
    fleeCount?: number;
    damageReceived?: number;
    damageDealt?: number;
    itemsPicked?: number[];
    tileVisited?: Tile[];
    virtualPlayerData?: {
        profile: 'aggressive' | 'defensive';
    };
}
