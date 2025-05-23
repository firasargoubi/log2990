export interface Player {
    pendingItem: number;
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    life: number;
    maxLife: number;
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
    currentAP?: number;
    winCount: number;
    items?: number[];
    virtualPlayerData?: {
        profile: 'aggressive' | 'defensive';
    };
}
