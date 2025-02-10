import { Object } from './object';

export interface Tile {
    type: number;
    x: number;
    y: number;
    id: string;
    object?: Object; // L'objet placé sur la tuile
    seen?: boolean;
    selected?: boolean;
}
