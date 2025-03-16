import { GameState } from '@app/interface/game-state';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { Player } from '@common/player';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';

@Service()
export class GameSocketHandlerService {
    private io: Server;
    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
        private lobbySocketHandlerService: LobbySocketHandlerService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    async handleRequestStart(socket: Socket, lobbyId: string) {
        console.log(`Request to start game for lobby ${lobbyId} by ${socket.id}`);

        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        const player = lobby.players.find((p) => p.id === socket.id);
        if (!player || !player.isHost) {
            socket.emit('error', 'Only the host can start the game.');
            return;
        }

        try {
            console.log(`Initializing game state for lobby ${lobbyId}`);
            const gameState = await this.boardService.initializeGameState(lobby);

            this.gameStates.set(lobbyId, gameState);

            lobby.isLocked = true;
            this.lobbySocketHandlerService.updateLobby(lobbyId);

            const serializableGameState = this.serializeGameState(gameState);

            console.log(`Game started for lobby ${lobbyId}`);
            this.io.to(lobbyId).emit('gameStarted', { gameState: serializableGameState });

            this.startTurn(lobbyId);
        } catch (error) {
            console.error(`Error starting game for lobby ${lobbyId}:`, error);
            socket.emit('error', `Failed to start game: ${error.message}`);
        }
    }

    handleEndTurn(socket: Socket, lobbyId: string) {
        console.log(`End turn requested for lobby ${lobbyId} by ${socket.id}`);

        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            console.error(`Game state not found for lobby ${lobbyId}`);
            socket.emit('error', 'Game not found.');
            return;
        }

        if (socket.id !== gameState.currentPlayer) {
            socket.emit('error', "It's not your turn.");
            return;
        }

        try {
            const currentPlayerId = gameState.currentPlayer;

            const updatedGameState = this.boardService.handleEndTurn(gameState);

            this.gameStates.set(lobbyId, updatedGameState);

            const serializableGameState = this.serializeGameState(updatedGameState);

            this.io.to(lobbyId).emit('turnEnded', {
                gameState: serializableGameState,
                previousPlayer: currentPlayerId,
                currentPlayer: updatedGameState.currentPlayer,
            });

            console.log(`Turn ended for player ${currentPlayerId}, next player: ${updatedGameState.currentPlayer}`);

            this.startTurn(lobbyId);
        } catch (error) {
            console.error(`Error ending turn for lobby ${lobbyId}:`, error);
            socket.emit('error', `Failed to end turn: ${error.message}`);
        }
    }

    handleRequestMovement(socket: Socket, lobbyId: string, coordinate: Coordinates) {
        console.log(`Movement requested for lobby ${lobbyId} by ${socket.id} to (${coordinate.x}, ${coordinate.y})`);

        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }

        if (socket.id !== gameState.currentPlayer) {
            socket.emit('error', "It's not your turn.");
            return;
        }

        if (!this.isValidMove(gameState, coordinate)) {
            socket.emit('error', 'Invalid move.');
            return;
        }

        try {
            const updatedGameState = this.boardService.handleMovement(gameState, coordinate);

            this.gameStates.set(lobbyId, updatedGameState);

            const serializableGameState = this.serializeGameState(updatedGameState);

            this.io.to(lobbyId).emit('movementProcessed', {
                gameState: serializableGameState,
                playerMoved: gameState.currentPlayer,
                newPosition: coordinate,
            });

            console.log(`Player ${gameState.currentPlayer} moved to (${coordinate.x}, ${coordinate.y})`);

            if (updatedGameState.availableMoves.length === 0) {
                console.log(`No more moves available for player ${gameState.currentPlayer}, ending turn`);
                this.handleEndTurn(socket, lobbyId);
            }
        } catch (error) {
            console.error(`Error processing movement for lobby ${lobbyId}:`, error);
            socket.emit('error', `Movement error: ${error.message}`);
        }
    }
    handlePathRequest(socket: Socket, lobbyId: string, destination: Coordinates): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }

        if (socket.id !== gameState.currentPlayer) {
            socket.emit('error', "It's not your turn.");
            return;
        }

        const playerPosition = gameState.playerPositions.get(socket.id);
        if (!playerPosition) {
            socket.emit('error', 'Player position not found.');
            return;
        }

        const isValidDestination = gameState.availableMoves.some((move) => move.x === destination.x && move.y === destination.y);

        if (!isValidDestination) {
            socket.emit('pathCalculated', {
                destination,
                path: null,
                valid: false,
            });
            return;
        }

        try {
            const path = this.boardService.findShortestPath(gameState, playerPosition, destination);

            socket.emit('pathCalculated', {
                destination,
                path,
                valid: path !== null,
            });
        } catch (error) {
            socket.emit('error', `Path calculation error: ${error.message}`);
        }
    }

    handleJoinLobbyRequest(socket: Socket, lobbyId: string, player: Player) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        if (lobby.isLocked || lobby.players.length >= lobby.maxPlayers) {
            socket.emit('error', 'Lobby is locked or full.');
            return;
        }

        player.id = socket.id;
        player.isHost = lobby.players.length === 0;
        lobby.players.push(player);

        socket.join(lobbyId);
        this.io.to(lobbyId).emit('playerJoined', { lobbyId, player });
        this.lobbySocketHandlerService.updateLobby(lobbyId);
    }

    startTurn(lobbyId: string) {
        console.log(`Starting turn for lobby ${lobbyId}`);

        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            console.error(`Game state not found for lobby ${lobbyId}`);
            return;
        }

        try {
            const updatedGameState = this.boardService.handleTurn(gameState);

            console.log(`------- TURN START DEBUG INFO: Lobby ${lobbyId} -------`);
            console.log(`Current Player: ${updatedGameState.currentPlayer}`);
            console.log(`Available Moves Count: ${updatedGameState.availableMoves?.length || 0}`);
            console.log(`Available Moves: ${JSON.stringify(updatedGameState.availableMoves || [])}`);
            console.log(`Player Positions: ${JSON.stringify(Array.from(updatedGameState.playerPositions.entries()))}`);
            console.log(`Current Player Movement Points: ${updatedGameState.currentPlayerMovementPoints}`);
            console.log('------- END DEBUG INFO -------');

            this.gameStates.set(lobbyId, updatedGameState);

            if (!updatedGameState.availableMoves) {
                updatedGameState.availableMoves = [];
                console.warn('availableMoves was undefined in updatedGameState, set to empty array');
            }

            const serializableGameState = this.serializeGameState(updatedGameState);

            this.io.to(lobbyId).emit('turnStarted', {
                gameState: serializableGameState,
                currentPlayer: updatedGameState.currentPlayer,
                availableMoves: [...updatedGameState.availableMoves],
            });

            console.log(`Turn started for player ${updatedGameState.currentPlayer} in lobby ${lobbyId}`);
        } catch (error) {
            console.error(`Error starting turn for lobby ${lobbyId}:`, error);
            this.io.to(lobbyId).emit('error', `Turn error: ${error.message}`);
        }
    }

    serializeGameState(gameState: GameState): unknown {
        if (!gameState.availableMoves) gameState.availableMoves = [];

        return {
            ...gameState,
            playerPositions: Object.fromEntries(gameState.playerPositions),
            availableMoves: [...gameState.availableMoves],
        };
    }
    handleEndTurnInternally(gameState: GameState): GameState {
        return this.boardService.handleEndTurn(gameState);
    }
    isValidMove(gameState: GameState, coordinate: Coordinates): boolean {
        return gameState.availableMoves.some((move) => move.x === coordinate.x && move.y === coordinate.y);
    }
}
