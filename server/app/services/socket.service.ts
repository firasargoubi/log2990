import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { Game, Tile, TILE_DELIMITER } from '@common/game.interface';
import { Player } from '@common/player';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { DisconnectHandlerService } from './disconnect-handler.service';
import { GameSocketHandlerService } from './game-socket-handler.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';
import { ValidationSocketHandlerService } from './validation-socket-handler.service';

@Service()
export class SocketService {
    private io: Server;

    // eslint-disable-next-line max-params
    constructor(
        server: HttpServer,
        private lobbyHandler: LobbySocketHandlerService,
        private gameSocketHandlerService: GameSocketHandlerService,
        private validationSocketHandlerService: ValidationSocketHandlerService,
        private disconnectHandlerService: DisconnectHandlerService,
        private boardService: BoardService,
    ) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        this.lobbyHandler.setServer(this.io);
        this.gameSocketHandlerService.setServer(this.io);
    }

    init(): void {
        this.io.on('connection', this.onConnection.bind(this));
    }

    private onConnection(socket: Socket) {
        socket.on('createLobby', (game: Game) => this.handleCreateLobby(socket, game));
        socket.on('joinLobby', (data: { lobbyId: string; player: Player }) => this.handleJoinLobby(socket, data));
        socket.on('leaveLobby', (data: { lobbyId: string; playerName: string }) => this.handleLeaveLobby(socket, data));
        socket.on('leaveGame', (lobbyId: string, playerName: string) => this.handleLeaveGame(socket, lobbyId, playerName));
        socket.on('lockLobby', (lobbyId: string) => this.handleLockLobby(socket, lobbyId));
        socket.on('getLobby', (lobbyId: string, callback: (lobby: GameLobby | null) => void) => this.handleGetLobby(socket, lobbyId, callback));
        socket.on('getGameId', (lobbyId: string, callback: (gameId: string | null) => void) => this.handleGetGameId(socket, lobbyId, callback));
        socket.on('verifyRoom', (data: { gameId: string }, callback: (response: { exists: boolean; isLocked?: boolean }) => void) =>
            this.handleVerifyRoom(socket, data, callback),
        );
        socket.on('verifyAvatars', (data: { lobbyId: string }, callback: (response: { avatars: string[] }) => void) =>
            this.handleVerifyAvatars(socket, data, callback),
        );
        socket.on('verifyUsername', (data: { lobbyId: string }, callback: (response: { usernames: string[] }) => void) =>
            this.handleVerifyUsername(socket, data, callback),
        );

        socket.on('requestStart', (lobbyId: string) => this.handleRequestStart(socket, lobbyId));
        socket.on('endTurn', (data: { lobbyId: string }) => this.handleEndTurn(socket, data));
        socket.on('requestMovement', (data: { lobbyId: string; coordinates: Coordinates[] }) => this.handleRequestMovement(socket, data));
        socket.on('teleport', (data: { lobbyId: string; coordinates: Coordinates }) => this.handleTeleport(socket, data));
        socket.on('setDebug', (data: { lobbyId: string; debug: boolean }) => this.handleSetDebug(socket, data));
        socket.on('updatePlayers', (lobbyId: string, players: Player[]) => this.handlePlayersUpdate(socket, lobbyId, players));
        socket.on('openDoor', (data: { lobbyId: string; tile: Tile }) => this.handleOpenDoor(socket, data));
        socket.on('closeDoor', (data: { lobbyId: string; tile: Tile }) => this.handleCloseDoor(socket, data));
        socket.on('disconnect', () => this.handleDisconnect(socket));
        socket.on('disconnectFromRoom', (lobbyId: string) => this.handleDisconnectFromRoom(socket, lobbyId));

        socket.on('startBattle', (data: { lobbyId: string; currentPlayer: Player; opponent: Player }) =>
            this.handleStartBattle(data.lobbyId, data.currentPlayer, data.opponent),
        );

        socket.on('attack', (data: { lobbyId: string; attacker: Player; defender: Player }) => {
            this.handleAttackAction(data.lobbyId, data.attacker, data.defender);
        });

        socket.on('flee', (data: { lobbyId: string; player: Player }) => {
            this.handleFlee(data.lobbyId, data.player);
        });
        socket.on('resolveInventory', (data) => this.handleResolveInventory(socket, data));
        socket.on('cancelInventoryChoice', (data) => this.handleCancelInventoryChoice(socket, data));
    }

    private handleResolveInventory(socket: Socket, data: { lobbyId: string; oldItem: number; newItem: number }) {
        const gameState = this.gameSocketHandlerService.getGameStateOrEmitError(socket, data.lobbyId);
        if (!gameState) return;

        const playerIndex = gameState.players.findIndex((p) => p.id === socket.id);
        if (playerIndex === -1) return;

        const player = gameState.players[playerIndex];
        const playerPosition = gameState.playerPositions[playerIndex];

        if (player && player.items && playerPosition) {
            const index = player.items.findIndex((item) => item === data.oldItem);
            const tileValue = gameState.board[playerPosition.x][playerPosition.y] % TILE_DELIMITER;

            if (index !== -1) {
                player.items.splice(index, 1, data.newItem);

                gameState.board[playerPosition.x][playerPosition.y] = data.oldItem * TILE_DELIMITER + tileValue;
            }

            player.pendingItem = 0;
            gameState.availableMoves = this.boardService['findAllPaths'](gameState, playerPosition);
            gameState.shortestMoves = this.boardService['calculateShortestMoves'](gameState, playerPosition, gameState.availableMoves);

            this.io.to(data.lobbyId).emit('boardModified', { gameState });
        }
    }
    private handleCancelInventoryChoice(socket: Socket, data: { lobbyId: string }) {
        const gameState = this.gameSocketHandlerService.getGameStateOrEmitError(socket, data.lobbyId);
        if (!gameState) return;

        const playerIndex = gameState.players.findIndex((p) => p.id === socket.id);
        if (playerIndex === -1) return;

        const player = gameState.players[playerIndex];
        const playerPosition = gameState.playerPositions[playerIndex];

        player.pendingItem = 0;

        gameState.availableMoves = this.boardService['findAllPaths'](gameState, playerPosition);
        gameState.shortestMoves = this.boardService['calculateShortestMoves'](gameState, playerPosition, gameState.availableMoves);

        this.io.to(data.lobbyId).emit('boardModified', { gameState });
    }

    private handleCreateLobby(socket: Socket, game: Game): void {
        if (!game) {
            socket.emit('error', 'Invalid game data');
            return;
        }
        const lobby = this.lobbyHandler.createLobby(game);
        socket.emit('lobbyCreated', { lobby });
    }

    private handleJoinLobby(socket: Socket, data: { lobbyId: string; player: Player }): void {
        if (!data || !data.player) {
            socket.emit('error', 'Invalid player data');
            return;
        }
        this.lobbyHandler.handleJoinLobbyRequest(socket, data.lobbyId, data.player);
    }

    private handleLeaveLobby(socket: Socket, data: { lobbyId: string; playerName: string }): void {
        if (!data) {
            socket.emit('error', 'Invalid lobby or player data');
            return;
        }
        this.lobbyHandler.leaveLobby(socket, data.lobbyId, data.playerName);
    }

    private handleLeaveGame(socket: Socket, lobbyId: string, playerName: string): void {
        this.lobbyHandler.leaveGame(socket, lobbyId, playerName);
    }

    private handleLockLobby(socket: Socket, lobbyId: string): void {
        if (!lobbyId) {
            socket.emit('error', 'Invalid lobby ID');
            return;
        }
        this.lobbyHandler.lockLobby(socket, lobbyId);
    }

    private handleGetLobby(socket: Socket, lobbyId: string, callback: (lobby: GameLobby | null) => void): void {
        if (!lobbyId) {
            socket.emit('error', 'Invalid lobby ID');
            callback(null);
            return;
        }
        const lobby = this.lobbyHandler.getLobby(lobbyId);
        callback(lobby || null);
    }

    private handleGetGameId(socket: Socket, lobbyId: string, callback: (gameId: string | null) => void): void {
        if (!lobbyId) {
            socket.emit('error', 'Invalid lobby ID');
            callback(null);
            return;
        }
        const lobby = this.lobbyHandler.getLobby(lobbyId);
        callback(lobby?.gameId || null);
    }

    private handleVerifyRoom(socket: Socket, data: { gameId: string }, callback: (response: { exists: boolean; isLocked?: boolean }) => void): void {
        if (!data || !data.gameId) {
            socket.emit('error', 'Invalid game ID');
            callback({ exists: false });
            return;
        }
        this.validationSocketHandlerService.verifyRoom(socket, data.gameId, callback);
    }

    private handleVerifyAvatars(socket: Socket, data: { lobbyId: string }, callback: (response: { avatars: string[] }) => void): void {
        if (!data || !data.lobbyId) {
            socket.emit('error', 'Invalid lobby ID');
            callback({ avatars: [] });
            return;
        }
        this.validationSocketHandlerService.verifyAvatars(socket, data.lobbyId, callback);
    }

    private handleVerifyUsername(socket: Socket, data: { lobbyId: string }, callback: (response: { usernames: string[] }) => void): void {
        if (!data || !data.lobbyId) {
            socket.emit('error', 'Invalid lobby ID');
            callback({ usernames: [] });
            return;
        }
        this.validationSocketHandlerService.verifyUsername(socket, data.lobbyId, callback);
    }

    private handleRequestStart(socket: Socket, lobbyId: string): void {
        if (!lobbyId) {
            socket.emit('error', 'Invalid lobby ID');
            return;
        }
        this.gameSocketHandlerService.handleRequestStart(socket, lobbyId);
    }

    private handleEndTurn(socket: Socket, data: { lobbyId: string }): void {
        if (!data || !data.lobbyId) {
            socket.emit('error', 'Game not found.');
            return;
        }
        this.gameSocketHandlerService.handleEndTurn(socket, data.lobbyId);
    }

    private handleTeleport(socket: Socket, data: { lobbyId: string; coordinates: Coordinates }): void {
        this.gameSocketHandlerService.handleTeleport(socket, data.lobbyId, data.coordinates);
    }

    private handleRequestMovement(socket: Socket, data: { lobbyId: string; coordinates: Coordinates[] }): void {
        if (!data || !data.coordinates) {
            socket.emit('error', 'Invalid coordinates');
            return;
        }
        this.gameSocketHandlerService.handleRequestMovement(socket, data.lobbyId, data.coordinates);
    }

    private handleOpenDoor(socket: Socket, data: { lobbyId: string; tile: Tile }): void {
        if (!data) {
            socket.emit('error', 'Invalid door data');
            return;
        }
        if (!data.lobbyId) {
            socket.emit('error', 'Invalid lobby ID');
            return;
        }
        if (!data.tile) {
            socket.emit('error', 'Invalid tile data');
            return;
        }
        this.gameSocketHandlerService.openDoor(socket, data.tile, data.lobbyId);
    }

    private handleCloseDoor(socket: Socket, data: { lobbyId: string; tile: Tile }): void {
        if (!data) {
            socket.emit('error', 'Invalid door data');
            return;
        }
        if (!data.lobbyId) {
            socket.emit('error', 'Invalid lobby ID');
            return;
        }
        if (!data.tile) {
            socket.emit('error', 'Invalid tile data');
            return;
        }
        this.gameSocketHandlerService.closeDoor(socket, data.tile, data.lobbyId);
    }

    private handlePlayersUpdate(socket: Socket, lobbyId: string, players: Player[]): void {
        this.gameSocketHandlerService.handlePlayersUpdate(socket, lobbyId, players);
    }

    private handleDisconnect(socket: Socket): void {
        this.disconnectHandlerService.handleDisconnect(socket);
    }

    private handleSetDebug(socket: Socket, data: { lobbyId: string; debug: boolean }): void {
        this.gameSocketHandlerService.handleSetDebug(socket, data.lobbyId, data.debug);
    }

    private handleDisconnectFromRoom(socket: Socket, lobbyId: string): void {
        this.disconnectHandlerService.handleDisconnectFromRoom(socket, lobbyId);
    }

    private handleStartBattle(lobbyId: string, currentPlayer: Player, opponent: Player): void {
        this.gameSocketHandlerService.startBattle(lobbyId, currentPlayer, opponent);
    }

    private handleAttackAction(lobbyId: string, attacker: Player, defender: Player) {
        this.gameSocketHandlerService.handleAttackAction(lobbyId, attacker, defender);
    }

    private handleFlee(lobbyId: string, player: Player) {
        this.gameSocketHandlerService.handleFlee(lobbyId, player);
    }

    
}
