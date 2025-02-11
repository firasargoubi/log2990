export interface Game {
    id: string;
    name: string;
    mapSize: string;
    mode: string;
    previewImage: string;
    description: string;
    lastModified: Date;
    isVisible: boolean;
    board: number[][];
    objects: number[]; // Liste des identifiants d'objets (objectId * 1000 + x * 100 + y)
}
