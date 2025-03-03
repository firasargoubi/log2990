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
    messages: { playerName: string; message: string }[];
}

export class SocketService {
    private io: Server;
    private rooms: Record<string, GameRoom> = {};
    constructor(server: HttpServer) {
        // console.log('Initialisation du serveur WebSocket...');
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
    }

    init(): void {
        this.io.on('connection', (socket: Socket) => {
            // console.log(`User connected: ${socket.id}`);
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
                const game = this.rooms[gameId];
                const isPlayerInGame = game.players.some((player) => player.name === playerName);
                if (!isPlayerInGame) {
                    socket.emit('error', 'Vous ne pouvez pas écrire dans ce chat.');
                    return;
                }
                game.messages.push({ playerName, message });
                // console.log(`Message reçu de ${playerName} dans la partie ${gameId}: ${message}`);

                this.io.to(gameId).emit('message', { gameId, playerName, message });
            });
        });
    }
    private createGame(socket: Socket, playerName: string) {
        const gameId = this.generateUniqueGameId();
        // console.log(`Partie créée avec le code : ${gameId}`);
        if (!this.rooms[gameId]) {
            this.rooms[gameId] = { id: gameId, players: [], isStarted: false, messages: [] };
        }
        this.joinGame(socket, gameId, playerName);

        if (!socket.rooms.has(gameId)) {
            // console.log("Envoi de l'événement gameCreated pour", gameId);
            socket.emit('gameCreated', { gameId });
        }
        this.io.to(gameId).emit('chatCreated', { gameId, messages: [] });
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
    // maybe mauvaise a revoir
    private generateUniqueGameId(): string {
        let gameId: string;
        do {
            gameId = Math.floor(1000 + Math.random() * 9000).toString();
        } while (this.rooms[gameId]);

        return gameId;
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
        this.io.to(gameId).emit('playerListUpdated', {
            gameId,
            players: game.players.map((player) => ({ name: player.name })),
        });

        socket.emit('previousMessages', {
            gameId,
            messages: game.messages,
        });
    }
}
