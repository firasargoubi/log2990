// client/src/app/interfaces/game.model.ts
import { GameSize, GameType } from '@app/Consts/app.constants';

export interface Game {
    id: string;
    name: string;
    mapSize: GameSize;
    mode: GameType;
    previewImage: string;
    description: string;
    lastModified: Date;
    isVisible: boolean;
    board: number[][]; // Board data with tile and object information
    objects: GameObjectPlacement[]; // Object placements using proper structure
}

export interface GameObjectPlacement {
    id: number; // Object ID
    x: number; // X coordinate
    y: number; // Y coordinate
}
