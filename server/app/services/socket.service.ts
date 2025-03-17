/* eslint-disable max-lines */
import { GameState } from '@common/game-state';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { Game, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Server as HttpServer } from 'http';
import { Subject } from 'rxjs';
import { Server, Socket } from 'socket.io';
import { Container, Service } from 'typedi';
import { BoardService } from './board.service';

@Service()
export class SocketService {
    private io: Server;
    private lobbies = new Map<string, GameLobby>();
    private gameStates = new Map<string, GameState>();
    private boardService: BoardService;
    private countdownSubject = new Subject<number>();
    countdown$ = this.countdownSubject.asObservable();

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

            socket.on('requestMovement', (data: { lobbyId: string; coordinates: Coordinates[] }) => {
                this.handleRequestMovement(socket, data.lobbyId, data.coordinates);
            });

            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });

            socket.on('startCombat', (data: { playerId: string; lobbyId: string }) => {
                this.startCombat(socket, data.lobbyId, data.playerId);
            });

            socket.on('closeDoor', (data: { tile: Tile; lobbyId: string }) => {
                this.closeDoor(socket, data.tile, data.lobbyId);
            });

            socket.on('openDoor', (data: { tile: Tile; lobbyId: string }) => {
                this.openDoor(socket, data.tile, data.lobbyId);
            });

            socket.on('initializeBattle', (data: { currentPlayer: Player; opponent: Player; lobbyId: string }) => {
                this.initializeBattle(socket, data.currentPlayer, data.opponent);
            });

            socket.on('startBattle', (data: { currentPlayer: Player; opponent: Player; gameState: GameState }) => {
                this.startBattle(socket, data.currentPlayer, data.opponent, data.gameState);
            });

            socket.on('changeTurnEndTimer', (data: { currentPlayer: Player; opponent: Player; playerTurn: string; gameState: GameState }) => {
                this.changeTurnEnd(data.currentPlayer, data.opponent, data.playerTurn, data.gameState);
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
            console.log('Starting game...');
            const gameState = await this.boardService.initializeGameState(lobby);

            this.gameStates.set(lobbyId, gameState);

            lobby.isLocked = true;
            this.updateLobby(lobbyId);

            this.io.to(lobbyId).emit('gameStarted', { gameState });
            console.log('Game started.');
            this.startTurn(lobbyId);
        } catch (error) {
            socket.emit('error', `Failed to start game: ${error.message}`);
        }
    }

    private startTurn(lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            return;
        }

        try {
            const updatedGameState = this.boardService.handleTurn(gameState);

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit('turnStarted', { gameState });
            console.log('Turn started.');
        } catch (error) {
            this.io.to(lobbyId).emit('error', `Turn error: ${error.message}`);
        }
    }

    private handleEndTurn(socket: Socket, lobbyId: string) {
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
            const updatedGameState = this.boardService.handleEndTurn(gameState);

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit('turnEnded', { gameState });

            this.startTurn(lobbyId);
        } catch (error) {
            socket.emit('error', `Failed to end turn: ${error.message}`);
        }
    }

    private handleRequestMovement(socket: Socket, lobbyId: string, coordinates: Coordinates[]) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }

        try {
            let updatedGameState = gameState;
            console.log(coordinates);
            for (const coordinate of coordinates) {
                updatedGameState = this.boardService.handleMovement(gameState, coordinate);
                this.io.to(lobbyId).emit('movementProcessed', { gameState });
                setTimeout(() => {}, 5000);
            }

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit('movementProcessed', { gameState });

            if (updatedGameState.availableMoves.length === 0) {
                this.handleEndTurn(socket, lobbyId);
            }
        } catch (error) {
            socket.emit('error', `Movement error: ${error.message}`);
        }
    }

    private handleDisconnect(socket: Socket) {
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

    private handlePlayerLeaveGame(lobbyId: string, playerId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        if (gameState.currentPlayer === playerId) {
            const updatedGameState = this.boardService.handleEndTurn(gameState);
            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit('turnEnded', gameState);

            this.startTurn(lobbyId);
        }
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
        const newGameState = this.boardService.handleBoardChange(updatedGameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit('boardModified', { gameState: newGameState });
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

    private startCombatCountdown(lobbyId: string): void {
        setInterval(() => {
            this.handleCombatCountdown(lobbyId);
        }, 1000);
    }

    private startBattle(socket: Socket, currentPlayer: Player, opponent: Player, gameState: GameState) {
        const currentIndex = gameState.players.findIndex((player) => player.id === currentPlayer.id);
        const opponentIndex = gameState.players.findIndex((player) => player.id === opponent.id);
        const playerTurn = currentIndex < opponentIndex ? currentPlayer.id : opponent.id;
        const player = gameState.players.find((p) => p.id === playerTurn);
        const countDown = player.amountEscape === 2 ? 3 : 5;
        this.io.to(currentPlayer.id).to(opponent.id).emit('PlayerTurn', { playerTurn, countDown });
    }

    private changeTurnEnd(currentPlayer: Player, opponent: Player, playerTurn: string, gameState: GameState) {
        console.log(gameState);
        const player = gameState.players.find((p) => p.id === playerTurn);
        const newPlayerTurn = player.id === currentPlayer.id ? opponent.id : currentPlayer.id;
        const newPlayer = gameState.players.find((p) => p.id === newPlayerTurn);
        const countDown = newPlayer.amountEscape === 2 ? 3 : 5;
        this.io.to(currentPlayer.id).to(opponent.id).emit('PlayerSwitch', { newPlayerTurn, countDown });
        console.log('old player turn', playerTurn);
        console.log('new Player', newPlayerTurn);
    }
}
