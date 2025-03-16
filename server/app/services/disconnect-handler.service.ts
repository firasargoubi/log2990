import { GameState } from '@app/interface/game-state';
import { GameLobby } from '@common/game-lobby';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { GameSocketHandlerService } from './game-socket-handler.service';

@Service()
export class DisconnectHandlerService {
    private io: Server;

    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private gameSocketHandler: GameSocketHandlerService,
        private boardService: BoardService, // Add this line
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    handleDisconnect(socket: Socket) {
        for (const [lobbyId, lobby] of this.lobbies.entries()) {
            const playerIndex = lobby.players.findIndex((p) => p.id === socket.id);
            if (playerIndex !== -1) {
                const player = lobby.players[playerIndex];
                console.log(`Player ${player.name} (${socket.id}) disconnected from lobby ${lobbyId}`);

                lobby.players.splice(playerIndex, 1);
                socket.leave(lobbyId);

                this.io.to(lobbyId).emit('playerLeft', { lobbyId, playerName: player.name });

                this.updateLobby(lobbyId);

                if (lobby.players.length === 0) {
                    console.log(`Removing empty lobby ${lobbyId}`);
                    this.lobbies.delete(lobbyId);
                    this.gameStates.delete(lobbyId);
                } else if (this.gameStates.has(lobbyId)) {
                    this.handlePlayerLeaveGame(lobbyId, socket.id);
                }
            }
        }
    }

    private handlePlayerLeaveGame(lobbyId: string, playerId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        console.log(`Handling player ${playerId} leaving game in lobby ${lobbyId}`);

        if (gameState.currentPlayer === playerId) {
            const updatedGameState = this.boardService.handleEndTurn(gameState);
            this.gameStates.set(lobbyId, updatedGameState);

            const serializableGameState = this.serializeGameState(updatedGameState);
            this.io.to(lobbyId).emit('turnEnded', {
                gameState: serializableGameState,
                previousPlayer: playerId,
                currentPlayer: updatedGameState.currentPlayer,
            });

            this.gameSocketHandler.startTurn(lobbyId);
        }
    }
    private serializeGameState(gameState: GameState): unknown {
        if (!gameState.availableMoves) {
            gameState.availableMoves = [];
            console.warn('availableMoves was undefined in gameState, set to empty array before serialization');
        }

        const stateCopy = {
            ...gameState,
            playerPositions: Object.fromEntries(gameState.playerPositions),
            availableMoves: [...gameState.availableMoves],
        };

        console.log(`Serialized game state successfully. Available moves count: ${stateCopy.availableMoves.length}`);
        console.log(`Current player: ${stateCopy.currentPlayer}`);
        console.log(`Player positions: ${JSON.stringify(Object.keys(stateCopy.playerPositions))}`);

        return stateCopy;
    }
    private updateLobby(lobbyId: string): void {
        const lobby = this.lobbies.get(lobbyId);
        if (lobby) {
            const lobbyCopy = JSON.parse(JSON.stringify(lobby));
            this.io.to(lobbyId).emit('lobbyUpdated', { lobbyId, lobby: lobbyCopy });
        }
    }
}
