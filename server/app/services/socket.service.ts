import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { Game } from '@common/game.interface';
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
        this.io.on('connection', (socket: Socket) => {
            socket.on('createLobby', (game: Game) => {
                const lobbyId = this.lobbyHandler.createLobby(socket, game);
                socket.emit('lobbyCreated', { lobbyId });
            });

            socket.on('joinLobby', (data: { lobbyId: string; player: Player }) => {
                this.lobbyHandler.handleJoinLobbyRequest(socket, data.lobbyId, data.player);
            });

            socket.on('leaveLobby', (data: { lobbyId: string; playerName: string }) => {
                this.lobbyHandler.leaveLobby(socket, data.lobbyId, data.playerName);
            });

            socket.on('lockLobby', (lobbyId: string) => {
                this.lobbyHandler.lockLobby(socket, lobbyId);
            });

            socket.on('getLobby', (lobbyId: string, callback: (lobby: GameLobby | null) => void) => {
                const lobby = this.lobbyHandler.getLobby(lobbyId);
                callback(lobby || null);
            });

            socket.on('getGameId', (lobbyId: string, callback: (gameId: string | null) => void) => {
                const lobby = this.lobbyHandler.getLobby(lobbyId);
                callback(lobby?.gameId || null);
            });

            socket.on('verifyRoom', (data: { gameId: string }, callback: (response: { exists: boolean; isLocked?: boolean }) => void) => {
                this.validationSocketHandlerService.verifyRoom(socket, data.gameId, callback);
            });

            socket.on('verifyAvatars', (data: { lobbyId: string }, callback: (response: { avatars: string[] }) => void) => {
                this.validationSocketHandlerService.verifyAvatars(socket, data.lobbyId, callback);
            });

            socket.on('verifyUsername', (data: { lobbyId: string }, callback: (response: { usernames: string[] }) => void) => {
                this.validationSocketHandlerService.verifyUsername(socket, data.lobbyId, callback);
            });

            socket.on('requestStart', (lobbyId: string) => {
                this.gameSocketHandlerService.handleRequestStart(socket, lobbyId);
            });
            socket.on('endTurn', (data: { lobbyId: string }) => {
                this.gameSocketHandlerService.handleEndTurn(socket, data.lobbyId);
            });

            socket.on('requestMovement', (data: { lobbyId: string; coordinate: Coordinates }) => {
                this.gameSocketHandlerService.handleRequestMovement(socket, data.lobbyId, data.coordinate);
            });

            socket.on('requestPath', (data: { lobbyId: string; destination: Coordinates }) => {
                this.gameSocketHandlerService.handlePathRequest(socket, data.lobbyId, data.destination);
            });

            socket.on('disconnect', () => {
                this.disconnectHandlerService.handleDisconnect(socket);
            });
        });
    }
}
