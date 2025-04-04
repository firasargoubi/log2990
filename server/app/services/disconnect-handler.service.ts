import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { ItemService } from './item.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';

@Service()
export class DisconnectHandlerService {
    constructor(
        private lobbies: Map<string, GameLobby>,
        private lobbySocketHandler: LobbySocketHandlerService,
        private gameStates: Map<string, GameState>,
        private itemService: ItemService,
    ) {}

    handleDisconnect(socket: Socket) {
        for (const [lobbyId, lobby] of this.lobbies.entries()) {
            const playerIndex = lobby.players.findIndex((p) => p.id === socket.id);

            if (playerIndex !== -1) {
                const player = lobby.players[playerIndex];
                const gameState = this.gameStates.get(lobbyId);
                if (gameState) {
                    this.itemService.dropItems(playerIndex, gameState);
                }
                this.lobbySocketHandler.leaveGame(socket, lobbyId, player.name);
                this.lobbySocketHandler.leaveLobby(socket, lobbyId, player.name);
            }
        }
    }

    handleDisconnectFromRoom(socket: Socket, lobbyId?: string) {
        if (lobbyId) {
            socket.leave(lobbyId);
        }
    }
}
