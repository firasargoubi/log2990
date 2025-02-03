import { Application } from '@app/app';
import { GameData, GameService } from '@app/services/game.service';
import * as http from 'http';
import mongoose from 'mongoose';
import { AddressInfo } from 'net';
import { Server as SocketIOServer } from 'socket.io';
import { Service } from 'typedi';

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    private static readonly baseDix: number = 10;
    private server: http.Server;
    private io: SocketIOServer;

    constructor(
        private readonly application: Application,
        private readonly gameService: GameService,
    ) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseDix) : val;
        return isNaN(port) ? val : port >= 0 ? port : false;
    }

    async init(): Promise<void> {
        this.application.app.set('port', Server.appPort);
        this.server = http.createServer(this.application.app);
        await this.connectToDatabase();
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        this.setupSocketListeners();
        this.server.listen(Server.appPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening());
    }
    private setupSocketListeners(): void {
        this.io.on('connection', (socket) => {
            socket.on('createGame', async (gameData: GameData) => {
                const newGame = await this.gameService.createGame(gameData);
                this.io.emit('gameCreated', newGame); // Diffusion à tous les clients
            });

            socket.on('getAllGames', async () => {
                const games = await this.gameService.getAllGames();
                socket.emit('gamesList', games); // Retourner les jeux au client demandeur
            });

            socket.on('editGame', async (gameData: GameData) => {
                const updatedGame = await this.gameService.editGame(gameData.id, gameData);
                this.io.emit('gameUpdated', updatedGame); // Diffusion de la mise à jour
            });

            socket.on('deleteGame', async (gameId: string) => {
                const deletedGame = await this.gameService.deleteGame(gameId);
                this.io.emit('gameDeleted', deletedGame); // Diffusion de la suppression
            });
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

    private onListening(): void {
        const addr = this.server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }

    private async connectToDatabase(): Promise<void> {
        const DATABASE_CONNECTION_STRING = 'mongodb+srv://admin:admin@log2990-209.ggs6k.mongodb.net/myDatabase?retryWrites=true&w=majority';
        try {
            await mongoose.connect(DATABASE_CONNECTION_STRING);
        } catch (error) {
            process.exit(1);
        }
    }
}
