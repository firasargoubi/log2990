import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { Game, Tile } from '@common/game.interface';
import { Player } from '@common/player';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { DisconnectHandlerService } from './disconnect-handler.service';
import { GameSocketHandlerService } from './game-socket-handler.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';
import { ValidationSocketHandlerService } from './validation-socket-handler.service';

@Service()
export class SocketService {
    private io: Server;

    constructor(
        server: HttpServer,
        private lobbyHandler: LobbySocketHandlerService,
        private gameSocketHandlerService: GameSocketHandlerService,
        private validationSocketHandlerService: ValidationSocketHandlerService,
        private disconnectHandlerService: DisconnectHandlerService,
    ) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        this.lobbyHandler.setServer(this.io);
        this.gameSocketHandlerService.setServer(this.io);
        this.disconnectHandlerService.setServer(this.io);
    }

    init(): void {
        this.io.on('connection', this.onConnection.bind(this));
    }

    private onConnection(socket: Socket) {
        socket.on('createLobby', (game: Game) => this.handleCreateLobby(socket, game));
        socket.on('joinLobby', (data: { lobbyId: string; player: Player }) => this.handleJoinLobby(socket, data));
        socket.on('leaveLobby', (data: { lobbyId: string; playerName: string }) => this.handleLeaveLobby(socket, data));
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
        socket.on('openDoor', (data: { lobbyId: string; tile: Tile }) => this.handleOpenDoor(socket, data));
        socket.on('closeDoor', (data: { lobbyId: string; tile: Tile }) => this.handleCloseDoor(socket, data));
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }

    private handleCreateLobby(socket: Socket, game: Game): void {
        if (!game) {
            socket.emit('error', 'Invalid game data');
            return;
        }
        const lobbyId = this.lobbyHandler.createLobby(game);
        socket.emit('lobbyCreated', { lobbyId });
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

    private handleDisconnect(socket: Socket): void {
        this.disconnectHandlerService.handleDisconnect(socket);
    }
}
