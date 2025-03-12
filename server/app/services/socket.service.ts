import { GameLobby } from '@common/game-lobby';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GameState } from '@app/interface/game-state';
import { Coordinates } from '@common/coordinates';
import { BoardService } from './board.service';

export class SocketService {
    private io: Server;
    private lobbies = new Map<string, GameLobby>();
    private gameStates = new Map<string, GameState>();
    private boardService: BoardService;

    constructor(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        this.boardService = new BoardService();
    }

    init(): void {
        this.io.on('connection', (socket: Socket) => {
            socket.on('createLobby', (game: Game) => {
                const lobbyId = this.createLobby(game);
                socket.emit('lobbyCreated', { lobbyId });
            });

            socket.on('joinLobby', (data: { lobbyId: string; player: Player }) => {
                this.handleJoinLobbyRequest(socket, data.lobbyId, data.player);
            });

            socket.on('leaveLobby', (data: { lobbyId: string; playerName: string }) => {
                this.leaveLobby(socket, data.lobbyId, data.playerName);
            });

            socket.on('lockLobby', (lobbyId: string) => {
                this.lockLobby(socket, lobbyId);
            });

            socket.on('getLobby', (lobbyId: string, callback: (lobby: GameLobby | null) => void) => {
                const lobby = this.lobbies.get(lobbyId);
                callback(lobby || null);
            });

            socket.on('getGameId', (lobbyId: string, callback: (gameId: string | null) => void) => {
                const lobby = this.lobbies.get(lobbyId);
                callback(lobby?.gameId || null);
            });

            socket.on('verifyRoom', (data: { gameId: string }, callback: (response: { exists: boolean; isLocked?: boolean }) => void) => {
                this.verifyRoom(socket, data.gameId, callback);
            });

            socket.on('verifyAvatars', (data: { lobbyId: string }, callback: (response: { avatars: string[] }) => void) => {
                this.verifyAvatars(socket, data.lobbyId, callback);
            });

            socket.on('verifyUsername', (data: { lobbyId: string }, callback: (response: { usernames: string[] }) => void) => {
                this.verifyUsername(socket, data.lobbyId, callback);
            });

            socket.on('requestStart', (lobbyId: string) => {
                this.handleRequestStart(socket, lobbyId);
            });

            socket.on('endTurn', (data: { lobbyId: string }) => {
                this.handleEndTurn(socket, data.lobbyId);
            });

            socket.on('requestMovement', (data: { lobbyId: string; coordinate: Coordinates }) => {
                this.handleRequestMovement(socket, data.lobbyId, data.coordinate);
            });
        });
    }

    private createLobby(game: Game): string {
        const maxPlayers = this.getMaxPlayers(game.mapSize);
        const lobbyId = this.generateId();

        const newLobby: GameLobby = {
            id: lobbyId,
            players: [],
            isLocked: false,
            maxPlayers,
            gameId: game.id,
        };

        this.lobbies.set(lobbyId, newLobby);
        this.updateLobby(lobbyId);
        return lobbyId;
    }

    private handleJoinLobbyRequest(socket: Socket, lobbyId: string, player: Player) {
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
        this.updateLobby(lobbyId);
    }

    private leaveLobby(socket: Socket, lobbyId: string, playerName: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        const playerIndex = lobby.players.findIndex((p) => p.name === playerName);
        if (playerIndex === -1) {
            socket.emit('error', 'Player not found in lobby.');
            return;
        }

        lobby.players.splice(playerIndex, 1);
        socket.leave(lobbyId);
        this.io.to(lobbyId).emit('playerLeft', { lobbyId, playerName });
        this.updateLobby(lobbyId);
    }

    private lockLobby(socket: Socket, lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        lobby.isLocked = true;
        this.io.to(lobbyId).emit('lobbyLocked', { lobbyId });
        this.updateLobby(lobbyId);
    }

    private getMaxPlayers(mapSize: string): number {
        switch (mapSize.toLowerCase()) {
            case 'small':
            case 'petite':
                return 2;
            case 'medium':
            case 'moyenne':
                return 4;
            case 'large':
            case 'grande':
                return 6;
            default:
                return 2;
        }
    }

    private generateId(): string {
        let id: string;
        do {
            id = Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, '0');
        } while (this.lobbies.has(id));
        return id;
    }

    private updateLobby(lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (lobby) {
            const lobbyCopy = JSON.parse(JSON.stringify(lobby));
            this.io.to(lobbyId).emit('lobbyUpdated', { lobbyId, lobby: lobbyCopy });
        }
    }

    private verifyRoom(socket: Socket, lobbyId: string, callback: (response: { exists: boolean; isLocked?: boolean }) => void) {
        const lobby = this.lobbies.get(lobbyId);

        if (!lobby) {
            callback({ exists: false });
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }

        if (lobby.isLocked) {
            callback({ exists: false, isLocked: true });
            socket.emit('error', 'Cette partie est verrouillée.');
            return;
        }

        callback({ exists: true });
    }

    private verifyAvatars(socket: Socket, lobbyId: string, callback: (data: { avatars: string[] }) => void) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }
        if (lobby.isLocked) {
            socket.emit('error', 'Cette partie est verrouillée.');
            return;
        }

        const usedAvatars = lobby.players.map((player) => player.avatar);
        callback({ avatars: usedAvatars });
    }

    private verifyUsername(socket: Socket, lobbyId: string, callback: (data: { usernames: string[] }) => void) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }
        if (lobby.isLocked) {
            socket.emit('error', 'Cette partie est verrouillée.');
            return;
        }

        const usedUsernames = lobby.players.map((player) => player.name);
        callback({ usernames: usedUsernames });
    }

    private async handleRequestStart(socket: Socket, lobbyId: string) {
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

        const gameState = await this.boardService.initializeGameState(lobby);
        this.gameStates.set(lobbyId, gameState);

        lobby.isLocked = true;
        this.updateLobby(lobbyId);

        this.io.to(lobbyId).emit('gameStarted', { gameState });

        this.startTurn(lobbyId);
    }

    private startTurn(lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        // Calculate available moves for the current player
        const updatedGameState = this.boardService.handleTurn(gameState);

        // Store the updated game state
        this.gameStates.set(lobbyId, updatedGameState);

        // Notify all clients that a new turn has started
        this.io.to(lobbyId).emit('turnStarted', {
            gameState: updatedGameState,
            currentPlayer: updatedGameState.currentPlayer,
            availableMoves: updatedGameState.availableMoves,
        });
    }

    private handleEndTurn(socket: Socket, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }

        const currentPlayer = gameState.players.find((p: Player) => p.id === gameState.currentPlayer);
        if (!currentPlayer || socket.id !== currentPlayer.id) {
            socket.emit('error', "It's not your turn.");
            return;
        }

        // Process end turn and get updated state with next player ready
        const updatedGameState = this.boardService.handleEndTurn(gameState);

        // Store the updated game state
        this.gameStates.set(lobbyId, updatedGameState);

        // Notify all clients about the turn ending
        this.io.to(lobbyId).emit('turnEnded', {
            gameState: updatedGameState,
            previousPlayer: currentPlayer.id,
            currentPlayer: updatedGameState.currentPlayer,
        });

        // Start the next turn
        this.startTurn(lobbyId);
    }

    private handleRequestMovement(socket: Socket, lobbyId: string, coordinate: Coordinates) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }

        // Find the current player by ID
        const currentPlayer = gameState.players.find((p: Player) => p.id === gameState.currentPlayer);
        if (!currentPlayer || socket.id !== currentPlayer.id) {
            socket.emit('error', "It's not your turn.");
            return;
        }

        // Check if the move is valid
        if (!this.isValidMove(gameState, coordinate)) {
            socket.emit('error', 'Invalid move.');
            return;
        }

        // Process the movement and get updated state
        const updatedGameState = this.boardService.handleMovement(gameState, coordinate);

        // Store the updated game state
        this.gameStates.set(lobbyId, updatedGameState);

        // Send the updated state to all clients in the room
        this.io.to(lobbyId).emit('movementProcessed', {
            gameState: updatedGameState,
            playerMoved: gameState.currentPlayer,
            newPosition: coordinate,
        });

        // Check if the player has no more moves available
        if (updatedGameState.availableMoves.length === 0) {
            // End the turn if no more moves available
            this.handleEndTurn(socket, lobbyId);
        }
    }

    private isValidMove(gameState: GameState, coordinate: Coordinates): boolean {
        return gameState.availableMoves.some((move: Coordinates) => move.x === coordinate.x && move.y === coordinate.y);
    }
}
