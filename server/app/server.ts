import { Application } from '@app/app';
import { SocketService } from '@app/services/socket.service';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import * as http from 'http';
import mongoose from 'mongoose';
import { AddressInfo } from 'net';
import { Service } from 'typedi';
import { BoardService } from './services/board.service';
import { DisconnectHandlerService } from './services/disconnect-handler.service';
import { GameSocketHandlerService } from './services/game-socket-handler.service';
import { GameService } from './services/game.service';
import { LobbySocketHandlerService } from './services/lobby-socket-handler.service';
import { PathfindingService } from './services/pathfinding.service';
import { ValidationSocketHandlerService } from './services/validation-socket-handler.service';
import { ItemService } from './services/item.service';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
const uri = 'mongodb+srv://admin:admin@log2990-perso.mf3fg.mongodb.net/?retryWrites=true&w=majority&appName=LOG2990-perso';
@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private static readonly baseDix: number = 10;
    socketManager: SocketService;
    server: http.Server;

    constructor(private readonly application: Application) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseDix) : val;
        return isNaN(port) ? val : port >= 0 ? port : false;
    }

    init(): void {
        this.application.app.set('port', Server.appPort);

        this.server = http.createServer(this.application.app);
        const gameService = new GameService();
        const pathfindingService = new PathfindingService();
        const itemService = new ItemService();
        const boardService = new BoardService(gameService, pathfindingService, itemService);
        const lobbyMap = new Map<string, GameLobby>();
        const gameStateMap = new Map<string, GameState>();
        const validationHandler = new ValidationSocketHandlerService(lobbyMap);
        const virtualService = new VirtualPlayerService();
        const lobbyHandler = new LobbySocketHandlerService(lobbyMap, validationHandler);
        const gameHandler = new GameSocketHandlerService(lobbyMap, gameStateMap, boardService, lobbyHandler, pathfindingService, virtualService);
        const disconnectHandler = new DisconnectHandlerService(lobbyMap, lobbyHandler);
        this.socketManager = new SocketService(this.server, lobbyHandler, gameHandler, validationHandler, disconnectHandler, boardService);
        this.socketManager.init();

        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());

        this.connectToDatabase()
            .then(() => {
                this.server.listen(Server.appPort);
            })
            .catch(() => {
                process.exit(1);
            });
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Se produit lorsque le serveur se met à écouter sur le port.
     */
    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }

    /**
     * Connecte le serveur à la base de données MongoDB.
     */
    private async connectToDatabase(): Promise<void> {
        const DATABASE_CONNECTION_STRING = uri;

        try {
            await mongoose.connect(DATABASE_CONNECTION_STRING);
        } catch (error) {
            process.exit(1);
        }
    }
}
