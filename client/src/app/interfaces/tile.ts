export interface Tile {
    type: number;
    x: number;
    y: number;
    id: string;
    seen?: boolean;
    selected?: boolean;
}
