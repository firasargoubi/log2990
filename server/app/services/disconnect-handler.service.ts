import { GameState } from '@app/interface/game-state';
import { GameLobby } from '@common/game-lobby';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { GameSocketHandlerService } from './game-socket-handler.service';

@Service()
export class DisconnectHandlerService {
    private io: Server;
    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private gameSocketHandler: GameSocketHandlerService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    handleDisconnect(socket: Socket): void {
        for (const [lobbyId, lobby] of this.lobbies.entries()) {
            const playerIndex = lobby.players.findIndex((p) => p.id === socket.id);
            if (playerIndex !== -1) {
                const player = lobby.players[playerIndex];
                lobby.players.splice(playerIndex, 1);
                socket.leave(lobbyId);

                this.io.to(lobbyId).emit('playerLeft', { lobbyId, playerName: player.name });
                this.updateLobby(lobbyId);

                if (lobby.players.length === 0) {
                    this.lobbies.delete(lobbyId);
                    this.gameStates.delete(lobbyId);
                } else if (this.gameStates.has(lobbyId)) {
                    this.handlePlayerLeaveGame(lobbyId, socket.id);
                }
            }
        }
    }

    private handlePlayerLeaveGame(lobbyId: string, playerId: string): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        if (gameState.currentPlayer === playerId) {
            const updatedGameState = this.gameSocketHandler.handleEndTurnInternally(gameState);
            this.gameStates.set(lobbyId, updatedGameState);

            const serializableGameState = this.gameSocketHandler['serializeGameState'](updatedGameState);
            this.io.to(lobbyId).emit('turnEnded', {
                gameState: serializableGameState,
                previousPlayer: playerId,
                currentPlayer: updatedGameState.currentPlayer,
            });

            this.gameSocketHandler.startTurn(lobbyId);
        }
    }

    private updateLobby(lobbyId: string): void {
        const lobby = this.lobbies.get(lobbyId);
        if (lobby) {
            const lobbyCopy = JSON.parse(JSON.stringify(lobby));
            this.io.to(lobbyId).emit('lobbyUpdated', { lobbyId, lobby: lobbyCopy });
        }
    }
}
