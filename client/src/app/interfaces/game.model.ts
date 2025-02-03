export interface Game {
    id: string;
    name: string;
    mapSize: string;
    mode: string;
    description: string;
    lastModified: Date;
    isVisible: boolean;
    board: number[][];
}
