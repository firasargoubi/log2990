export interface Player {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    life: number;
    speed: number;
    attack: number;
    defense: number;
    amountEscape?: number;
    bonus?: {
        life?: number;
        speed?: number;
        attack?: 'D4' | 'D6';
        defense?: 'D4' | 'D6';
    };
    currentMP?: number;
}
