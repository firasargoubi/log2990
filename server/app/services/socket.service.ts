import { Server as HttpServer } from 'http';
import { Server, Socket, io } from 'socket.io';
import { Service } from 'typedi';
interface Player {
    id: string;
    name: string;
}
interface GameRoom {
    id: string;
    players: Player[];
    isStarted: boolean;
}

@Service()
export class SocketService {
    private io: Server;
    private rooms: Record<string, GameRoom> = {}; // pour stocker les parties et joueurs

    constructor(server: HttpServer) {
        console.log('Initialisation du serveur WebSocket...');
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        server.listen(3000, () => {
            console.log('✅ Serveur WebSocket démarré sur http://localhost:3000');
        });

        this.io.on('connection', (socket) => {
            console.log(`Connexion WebSocket reçue : ${socket.id}`);
            socket.on('createGame', (gameId: string, playerName: string) => {
                if (this.rooms[gameId]) {
                    socket.emit('error', 'Cette partie existe déjà.');
                    return;
                }
                this.rooms[gameId] = { id: gameId, players: [], isStarted: false };
                this.joinGame(socket, gameId, playerName);
            });
            socket.on('joinGame', (gameId: string, playerName: string) => {
                if (!this.rooms[gameId]) {
                    socket.emit('error', 'Partie inexistante.');
                    return;
                }
                if (this.rooms[gameId].isStarted) {
                    socket.emit('error', 'La partie a déjà commencé. Impossible de rejoindre.');
                    return;
                }
                socket.join(gameId);
                this.io.to(gameId).emit('playerJoined', { id: socket.id, name: playerName });
            });
            socket.on('message', (gameId: string, message: string) => {
                this.io.to(gameId).emit('chatMessage', { playerId: socket.id, message });
            });
            socket.on('startGame', (gameId: string) => {
                if (!this.rooms[gameId]) {
                    socket.emit('error', 'Partie inexistante.');
                    return;
                }
                if (this.rooms[gameId].isStarted) {
                    socket.emit('error', 'La partie est déjà en cours.');
                    return;
                }
                this.rooms[gameId].isStarted = true; // Marquer la partie comme démarrée
                this.io.to(gameId).emit('gameStarted', { gameId });
            });
            socket.on('leaveGame', (gameId: string) => {
                this.leaveGame(socket, gameId);
            });
            socket.on('getPlayers', (gameId: string) => {
                if (!this.rooms[gameId]) {
                    socket.emit('error', 'Partie inexistante.');
                    return;
                }
                socket.emit('playersList', this.rooms[gameId].players);
            });
            socket.on('disconnect', () => {
                // this.removePlayerFromAllGames(socket);
            });
        });
    }
    private joinGame(socket: Socket, gameId: string, playerName: string) {
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
    private leaveGame(socket: Socket, gameId: string) {
        if (!this.rooms[gameId]) return;

        this.rooms[gameId].players = this.rooms[gameId].players.filter((p) => p.id !== socket.id);
        socket.leave(gameId);
        this.io.to(gameId).emit('playerLeft', socket.id);

        // Si la partie est vide = Supprimer partie
        if (this.rooms[gameId].players.length === 0) {
            delete this.rooms[gameId];
        }
    }
}
