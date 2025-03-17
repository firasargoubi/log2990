import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { GameSocketHandlerService } from './game-socket-handler.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';

@Service()
export class DisconnectHandlerService {
    private io: Server;

    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private gameSocketHandler: GameSocketHandlerService,
        private lobbySocketHandler: LobbySocketHandlerService,
        private boardService: BoardService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    handleDisconnect(socket: Socket) {
        for (const [lobbyId, lobby] of this.lobbies.entries()) {
            const playerIndex = lobby.players.findIndex((p) => p.id === socket.id);

            if (playerIndex !== -1) {
                const player = lobby.players[playerIndex];

                const isHost = player.isHost;

                lobby.players.splice(playerIndex, 1);
                socket.leave(lobbyId);

                this.io.to(lobbyId).emit('playerLeft', { lobbyId, playerName: player.name });

                if (isHost) {
                    this.lobbies.delete(lobbyId);
                    this.gameStates.delete(lobbyId);
                    this.io.to(lobbyId).emit('hostDisconnected');
                } else {
                    this.lobbySocketHandler.updateLobby(lobbyId);

                    if (lobby.players.length === 0) {
                        this.lobbies.delete(lobbyId);
                        this.gameStates.delete(lobbyId);
                    } else if (this.gameStates.has(lobbyId)) {
                        this.handlePlayerLeaveGame(lobbyId, socket.id);
                    }
                }
            }
        }
    }

    private handlePlayerLeaveGame(lobbyId: string, playerId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        if (gameState.currentPlayer === playerId) {
            const updatedGameState = this.boardService.handleEndTurn(gameState);
            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit('turnEnded', gameState);

            this.gameSocketHandler.startTurn(lobbyId);
        }
    }
}
