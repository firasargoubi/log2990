export interface Game {
    id: string;
    name: string;
    mapSize: 'small' | 'medium' | 'large';
    mode: 'normal' | 'capture';
    previewImage: string;
    description: string;
    lastModified: Date;
    isVisible: boolean;
    board: number[][];
    objects: number[]; // Liste des identifiants d'objets (objectId * 1000 + x * 100 + y)
}
