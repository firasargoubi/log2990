import { GameState } from '@app/interface/game-state';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';

@Service()
export class GameSocketHandlerService {
    private io: Server;
    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    async handleRequestStart(socket: Socket, lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        const player = lobby.players.find((p: { id: string }) => p.id === socket.id);
        if (!player || !player.isHost) {
            socket.emit('error', 'Only the host can start the game.');
            return;
        }

        try {
            const gameState = await this.boardService.initializeGameState(lobby);
            this.gameStates.set(lobby.id, gameState);
            lobby.isLocked = true;

            const serializableGameState = this.serializeGameState(gameState);
            this.io.to(lobby.id).emit('gameStarted', { gameState: serializableGameState });

            this.startTurn(lobby.id);
        } catch (error) {
            socket.emit('error', `Failed to start game: ${error.message}`);
        }
    }

    handleEndTurn(socket: Socket, lobbyId: string): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
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

            this.startTurn(lobbyId);
        } catch (error) {
            socket.emit('error', `Failed to end turn: ${error.message}`);
        }
    }

    handleRequestMovement(socket: Socket, lobbyId: string, coordinate: Coordinates): void {
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

            if (updatedGameState.availableMoves.length === 0) {
                this.handleEndTurn(socket, lobbyId);
            }
        } catch (error) {
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
            socket.emit('pathCalculated', { destination, path: null, valid: false });
            return;
        }

        try {
            const path = this.boardService.findShortestPath(gameState, playerPosition, destination);
            socket.emit('pathCalculated', { destination, path, valid: path !== null });
        } catch (error) {
            socket.emit('error', `Path calculation error: ${error.message}`);
        }
    }

    startTurn(lobbyId: string): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        try {
            const updatedGameState = this.boardService.handleTurn(gameState);
            this.gameStates.set(lobbyId, updatedGameState);

            if (!updatedGameState.availableMoves) updatedGameState.availableMoves = [];

            const serializableGameState = this.serializeGameState(updatedGameState);
            this.io.to(lobbyId).emit('turnStarted', {
                gameState: serializableGameState,
                currentPlayer: updatedGameState.currentPlayer,
                availableMoves: [...updatedGameState.availableMoves],
            });
        } catch (error) {
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
    private isValidMove(gameState: GameState, coordinate: Coordinates): boolean {
        return gameState.availableMoves.some((move) => move.x === coordinate.x && move.y === coordinate.y);
    }
}
