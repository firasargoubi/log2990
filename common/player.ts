export interface Player {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    life: number;
    speed: number;
    attack: number;
    defense: number;
    bonus?: {
        life?: number;
        speed?: number;
        attack?: number;
        defense?: number;
    };
}
