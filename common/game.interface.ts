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
    BOOTS = 1,
    SWORD = 2,
    POTION = 3,
    WAND = 4,
    CRYSTAL = 5,
    JUICE = 6,
    SPAWN = 7,
    RANDOM = 8,
    FLAG = 9,
    EMPTY = 0,
    WALL,
}

export enum TileTypes {
    Grass = 1,
    Water = 2,
    Ice = 3,
    DoorClosed = 4,
    DoorOpen = 5,
    Wall = 6,
    Floor = 0,
}

export interface Tile {
    x: number;
    y: number;
    type: TileTypes;
    object: ObjectsTypes;
}

export const TILE_DELIMITER = 10;

interface Effect {
    attack?: number;
    defense?: number;
    speed?: number;
    life?: number;
}

export const ITEM_EFFECTS: Partial<Record<ObjectsTypes, Effect>>  = {
    [ObjectsTypes.BOOTS]: { speed: 2, attack: -1 },
    [ObjectsTypes.SWORD]: { attack: 1, defense: -1 },
};


export const RANDOM_SPEED = 4;