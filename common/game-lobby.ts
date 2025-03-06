import { Player } from './player';

export interface GameLobby {
    id: string;
    players: Player[];
    isLocked: boolean;
    maxPlayers: number;
    gameId: string;
}
