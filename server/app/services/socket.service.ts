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

            socket.on('createGame', (data: { playerName: string }) => {
                this.createGame(socket, data.playerName);
            });

            socket.on('joinGame', (data: { gameId: string; playerName: string }) => {
                this.joinGameRequest(socket, data);
            });

            socket.on('message', (data: { gameId: string; message: string; playerName: string }) => {
                const { gameId, message, playerName } = data;
                if (!this.rooms[gameId]) {
                    socket.emit('error', "La partie n'existe pas.");
                    return;
                }
                console.log(`Message reçu de ${playerName} dans la partie ${gameId}: ${message}`);
                this.io.to(gameId).emit('message', { playerName, message });
            });

            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }
    private createGame(socket: Socket, playerName: string) {
        const gameId = this.generateUniqueGameId();

        console.log(`Partie créée avec le code : ${gameId}`);

        this.rooms[gameId] = { id: gameId, players: [], isStarted: false };
        this.joinGame(socket, gameId, playerName);

        socket.emit('gameCreated', { gameId });
    }

    private joinGame(socket: Socket, gameId: string, playerName: string) {
        const game = this.rooms[gameId];

        if (game.players.some((p) => p.name === playerName)) {
            socket.emit('error', 'Ce nom est déjà pris dans cette partie.');
            return;
        }

        const player: Player = { id: socket.id, name: playerName };
        game.players.push(player);
        socket.join(gameId);

        this.io.to(gameId).emit('playerJoined', { gameId, playerName });
    }

    private generateUniqueGameId(): string {
        let gameId: string;
        do {
            gameId = Math.floor(1000 + Math.random() * 9000).toString(); // Code 4 chiffres
        } while (this.rooms[gameId]); // Vérifie unicité dans `this.rooms`

        return gameId;
    }

    private handleDisconnect(socket: Socket) {
        console.log(`User disconnected: ${socket.id}`);

        for (const [gameId, game] of Object.entries(this.rooms)) {
            const playerIndex = game.players.findIndex((p) => p.id === socket.id);

            if (playerIndex !== -1) {
                game.players.splice(playerIndex, 1);
                this.io.to(gameId).emit('playerLeft', game.players);

                if (game.players.length === 0) {
                    delete this.rooms[gameId];
                    console.log(`Salle ${gameId} supprimée car vide.`);
                }
                break;
            }
        }
    }

    private joinGameRequest(socket: Socket, data: { gameId: string; playerName: string }) {
        const gameId = data.gameId.trim();
        const playerName = data.playerName.trim();

        if (!this.rooms[gameId]) {
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }

        const game = this.rooms[gameId];

        if (game.players.length >= 4) {
            socket.emit('error', 'La partie est pleine.');
            return;
        }

        if (game.players.some((p) => p.id === socket.id && p.name === playerName)) {
            socket.emit('error', 'Vous êtes déjà dans cette partie.');
            return;
        }

        this.joinGame(socket, gameId, playerName);
    }
}
