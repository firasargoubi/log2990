export enum GameType {
    Classic = 'classic',
    Capture = 'capture',
}

export enum GameSize {
    Small = 'small',
    Medium = 'medium',
    Large = 'large',
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
    Boots = 1,
    Sword = 2,
    Potion = 3,
    Wand = 4,
    Crystal = 5,
    Juice = 6,
    Spawn = 7,
    Random = 8,
    Flag = 9,
    Empty = 0,
    Wall,
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
    [ObjectsTypes.Boots]: { speed: 2, attack: -1 },
    [ObjectsTypes.Sword]: { attack: 1, defense: -1 },
};


export const RANDOM_SPEED = 4;