/* eslint-disable max-lines */
import { GameState } from '@app/interface/game-state';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { Game, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Container, Service } from 'typedi';
import { BoardService } from './board.service';

@Service()
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
        this.boardService = Container.get(BoardService);
    }

    init(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log(`Client connected: ${socket.id}`);

            socket.on('createLobby', (game: Game) => {
                const lobbyId = this.createLobby(game);
                socket.emit('lobbyCreated', { lobbyId });
                console.log(`Lobby created: ${lobbyId} for game: ${game.id}`);
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

            socket.on('requestPath', (data: { lobbyId: string; destination: Coordinates }) => {
                this.handlePathRequest(socket, data.lobbyId, data.destination);
            });

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
                this.handleDisconnect(socket);
            });

            socket.on('startCombat', (data: { playerId: string; lobbyId: string }) => {
                this.startCombat(socket, data.lobbyId, data.playerId); // Call startCombat method
            });

            socket.on('closeDoor', (data: { tile: Tile; lobbyId: string }) => {
                console.log('closeDoor received on server');
                this.closeDoor(socket, data.tile, data.lobbyId);
            });

            socket.on('openDoor', (data: { tile: Tile; lobbyId: string }) => {
                console.log('openDoor received on server');
                this.openDoor(socket, data.tile, data.lobbyId);
            });

            socket.on('initializeBattle', (data: { currentPlayer: Player; opponent: Player; lobbyId: string }) => {
                this.initializeBattle(socket, data.currentPlayer, data.opponent);
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

    private handlePathRequest(socket: Socket, lobbyId: string, destination: Coordinates): void {
        console.log(`Path requested for lobby ${lobbyId} by ${socket.id} to (${destination.x}, ${destination.y})`);

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

            console.log(`Path calculation for ${socket.id} complete, valid: ${path !== null}`);
        } catch (error) {
            console.error(`Error calculating path for lobby ${lobbyId}:`, error);
            socket.emit('error', `Path calculation error: ${error.message}`);
        }
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

        console.log(`Player ${player.name} (${socket.id}) joined lobby ${lobbyId}`);
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
        socket.emit('lobbyUpdated', { lobbyId, lobby: JSON.parse(JSON.stringify(lobby)) });
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
        console.log(`Lobby ${lobbyId} locked`);
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
        const isLocked = lobby.maxPlayers === lobby.players.length || lobby.isLocked;
        if (isLocked) {
            callback({ exists: false, isLocked: true });
            socket.emit('error', 'Cette partie est verrouillée.');
            return;
        }

        callback({ exists: true, isLocked: false });
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
            this.updateLobby(lobbyId);

            const serializableGameState = this.serializeGameState(gameState);

            console.log(`Game started for lobby ${lobbyId}`);
            this.io.to(lobbyId).emit('gameStarted', { gameState: serializableGameState });

            this.startTurn(lobbyId);
        } catch (error) {
            console.error(`Error starting game for lobby ${lobbyId}:`, error);
            socket.emit('error', `Failed to start game: ${error.message}`);
        }
    }

    private startTurn(lobbyId: string) {
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

    private handleEndTurn(socket: Socket, lobbyId: string) {
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

    private handleRequestMovement(socket: Socket, lobbyId: string, coordinate: Coordinates) {
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

    private isValidMove(gameState: GameState, coordinate: Coordinates): boolean {
        return gameState.availableMoves.some((move) => move.x === coordinate.x && move.y === coordinate.y);
    }

    private handleDisconnect(socket: Socket) {
        for (const [lobbyId, lobby] of this.lobbies.entries()) {
            const playerIndex = lobby.players.findIndex((p) => p.id === socket.id);
            if (playerIndex !== -1) {
                const player = lobby.players[playerIndex];
                console.log(`Player ${player.id} (${socket.id}) disconnected from lobby ${lobbyId}`);

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

            this.startTurn(lobbyId);
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

    private closeDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }
        const newGameBoard = gameState.board.map((row) => [...row]);
        newGameBoard[tile.x][tile.y] = TileTypes.DoorClosed;
        const updatedGameState: GameState = {
            ...gameState,
            board: newGameBoard,
        };
        this.gameStates.set(lobbyId, updatedGameState);
        this.io.to(lobbyId).emit('tileUpdated', { newGameBoard });
    }

    private openDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }
        const newGameBoard = gameState.board.map((row) => [...row]);
        newGameBoard[tile.x][tile.y] = TileTypes.DoorOpen;
        const updatedGameState = {
            ...gameState,
            board: newGameBoard,
        };
        this.gameStates.set(lobbyId, updatedGameState);
        this.io.to(lobbyId).emit('tileUpdated', { newGameBoard });
    }

    private initializeBattle(socket: Socket, currentPlayer: Player, opponent: Player) {
        this.io.to(currentPlayer.id).to(opponent.id).emit('playersBattling', { isInCombat: true });
        console.log(`Sent to ${currentPlayer.id}, ${opponent.id}`);
    }
    // Start a combat for a specific player (emit to all players)
    private startCombat(socket: Socket, lobbyId: string, playerId: string): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game state not found.');
            return;
        }

        const combatEndTime = Date.now() + 30000; // 30 seconds from now
        gameState.combat = {
            playerId,
            endTime: combatEndTime,
            isActive: true,
        };

        this.gameStates.set(lobbyId, gameState);

        this.io.to(lobbyId).emit('combatStarted', { playerId, combatEndTime });

        // Start the countdown for the combat
        this.startCombatCountdown(lobbyId); // Ensure countdown starts when combat begins
    }

    // Handle when combat ends (either manually or by timer)
    private endCombat(socket: Socket, lobbyId: string): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState || !gameState.combat || !gameState.combat.isActive) {
            return; // No active combat
        }

        // Deactivate combat
        gameState.combat.isActive = false;
        this.gameStates.set(lobbyId, gameState);

        // Notify all clients that combat has ended
        this.io.to(lobbyId).emit('combatEnded');
    }

    // Handle combat countdown updates
    private handleCombatCountdown(lobbyId: string): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState || !gameState.combat || !gameState.combat.isActive) {
            return; // If no active combat, do nothing
        }

        const timeLeft = gameState.combat.endTime - Date.now();
        if (timeLeft <= 0) {
            this.endCombat(null, lobbyId); // End the combat if time is up
        } else {
            this.io.to(lobbyId).emit('combatUpdate', { timeLeft }); // Emit the remaining time to all clients
        }
    }

    // Emit a combat update when the countdown changes
    // socketService.ts

    private startCombatCountdown(lobbyId: string): void {
        setInterval(() => {
            this.handleCombatCountdown(lobbyId); // This updates the combat time every second
        }, 1000); // Update every second
    }
}
