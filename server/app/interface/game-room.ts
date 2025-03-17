import { Player } from '@app/interface/player';

export interface GameRoom {
    id: string;
    players: Player[];
    isStarted: boolean;
    messages: { playerName: string; message: string }[];
}
