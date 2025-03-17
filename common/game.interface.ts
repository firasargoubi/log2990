export enum GameType {
    classic = 'classic',
    capture = 'capture',
}

export enum GameSize {
    small = 'small',
    medium = 'medium',
    large = 'large',
}

export interface GameObjectPlacement {
    id: number;
    x: number;
    y: number;
}

export interface Game {
    id: string;
    name: string;
    mapSize: GameSize;
    mode: GameType;
    previewImage: string;
    description: string;
    lastModified: Date;
    isVisible: boolean;
    board: number[][];
    objects: GameObjectPlacement[];
}

export enum ObjectsTypes {
    BOOTS = 0,
    SWORD = 1,
    POTION = 2,
    WAND = 3,
    CRYSTAL = 4,
    JUICE = 5,
    SPAWN = 6,
    RANDOM = 7,
}

export enum TileTypes {
    Grass = 1,
    Water = 2,
    Ice = 3,
    DoorClosed = 4,
    DoorOpen = 5,
    Wall = 6,
    Floor,
}

export interface Tile {
    x: number;
    y: number;
    type: TileTypes;
    object: ObjectsTypes;
}

export const TILE_DELIMITER = 10;