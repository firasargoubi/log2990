import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface Player {
    id: string;
    name: string;
}
interface GameRoom {
    id: string;
    players: Player[];
    isStarted: boolean;
}

export class SocketService {
    private io: Server;
    private rooms: Record<string, GameRoom> = {};
    constructor(server: HttpServer) {
        console.log('Initialisation du serveur WebSocket...');
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
    }
    init(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log(`User connected: ${socket.id}`);

            socket.on('createGame', (data: { gameId: string; playerName: string }) => {
                const gameId = data.gameId.trim().toLowerCase();
                const playerName = data.playerName.trim();
                // console.log('Checking gameId:', gameId);
                // console.log('Current rooms:', JSON.stringify(this.rooms, null, 2));
                // console.log('Existing room:', JSON.stringify(this.rooms[gameId], null, 2));
                if (this.rooms[gameId]) {
                    // console.log('Hey');
                    socket.emit('error', 'Cette partie existe déjà.');
                    return;
                }
                this.rooms[gameId] = { id: gameId, players: [], isStarted: false };
                this.joinGame(socket, gameId, playerName);
            });

            socket.on('message', (data) => {
                console.log(`Message reçu: ${data}`);
                this.io.emit('message', data);
            });

            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.id}`);
            });
        });
    }

    private joinGame(socket: Socket, gameId: string, playerName: string) {
        console.log('joinGame', gameId, playerName);
        const game = this.rooms[gameId];
        if (game.players.some((p) => p.id === socket.id)) {
            socket.emit('error', 'Vous êtes déjà dans cette partie.');
            return;
        }
        const player: Player = {
            id: socket.id,
            name: playerName,
        };
        game.players.push(player);
        socket.join(gameId);
        this.io.to(gameId).emit('playerJoined', game.players);
    }
}
