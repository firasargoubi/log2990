import { GameLobby } from '@common/game-lobby';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';

@Service()
export class DisconnectHandlerService {
    constructor(
        private lobbies: Map<string, GameLobby>,
        private lobbySocketHandler: LobbySocketHandlerService,
    ) {}

    handleDisconnect(socket: Socket) {
        for (const [lobbyId, lobby] of this.lobbies.entries()) {
            const playerIndex = lobby.players.findIndex((p) => p.id === socket.id);

            if (playerIndex !== -1) {
                const player = lobby.players[playerIndex];
                this.lobbySocketHandler.leaveGame(socket, lobbyId, player.name);
                this.lobbySocketHandler.leaveLobby(socket, lobbyId, player.name);
            }
        }
    }

    handleDisconnectFromRoom(socket: Socket, lobbyId: string) {
        socket.leave(lobbyId);
    }
}
