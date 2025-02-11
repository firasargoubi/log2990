export interface Tile {
    type: number;
    x: number;
    y: number;
    id: string;
    object?: number; // L'objet placé sur la tuile
    seen?: boolean;
    selected?: boolean;
}
