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