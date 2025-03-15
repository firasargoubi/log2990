export interface Tile {
    type: number;
    x: number;
    y: number;
    id: string;
    object: number;
    seen?: boolean;
    selected?: boolean;
}
