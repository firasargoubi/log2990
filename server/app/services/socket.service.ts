import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { RANDOM_NUMBER_GENERATOR } from '@app/constants/constants-compute';
import { AMOUNT_PLAYERS } from '@app/constants/constants-game';
import { Player } from '@app/interface/player';
import { GameRoom } from '@app/interface/game-room';
export class SocketService {
    private io: Server;
    private rooms: Record<string, GameRoom> = {};
    constructor(server: HttpServer) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
    }

    init(): void {
        this.io.on('connection', (socket: Socket) => {
            socket.on('createGame', (data: { playerName: string }) => {
                this.createGame(socket, data.playerName);
            });

            socket.on('joinGame', (data: { gameId: string; playerName: string }) => {
                this.handleJoinGameRequest(socket, data);
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
                this.io.to(gameId).emit('message', { gameId, playerName, message });
            });

            socket.on('endGame', (data: { gameId: string }) => {
                this.endGame(socket, data.gameId);
            });

            socket.on('leaveGame', (data: { gameId: string; playerName: string }) => {
                this.leaveGame(socket, data.gameId, data.playerName);
            });
        });
    }
    private createGame(socket: Socket, playerName: string) {
        const gameId = this.generateUniqueGameId();
        if (!this.rooms[gameId]) {
            this.rooms[gameId] = { id: gameId, players: [], isStarted: false, messages: [] };
        }
        this.joinGame(socket, gameId, playerName);

        if (!socket.rooms.has(gameId)) {
            socket.emit('gameCreated', { gameId });
        }
        this.io.to(gameId).emit('chatCreated', { gameId, messages: [] });
    }

    private joinGame(socket: Socket, gameId: string, playerName: string) {
        const game = this.rooms[gameId];
        const isNameTaken = game.players.some((p) => p.name === playerName);
        if (isNameTaken) {
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
            gameId = Math.floor(RANDOM_NUMBER_GENERATOR.randomAdder + Math.random() * RANDOM_NUMBER_GENERATOR.randomMultiplier).toString();
        } while (this.rooms[gameId]);
        return gameId;
    }

    private handleJoinGameRequest(socket: Socket, data: { gameId: string; playerName: string }) {
        const gameId = data.gameId.trim();
        const playerName = data.playerName.trim();
        const game = this.rooms[gameId];
        const isPlayerAlreadyInGame = game.players.some((p) => p.id === socket.id && p.name === playerName);
        if (!this.rooms[gameId]) {
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }
        if (game.players.length >= AMOUNT_PLAYERS.maxPlayers) {
            socket.emit('error', 'La partie est pleine.');
            return;
        }
        if (isPlayerAlreadyInGame) {
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

    private leaveGame(socket: Socket, gameId: string, playerName: string) {
        const game = this.rooms[gameId];
        if (!game) {
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }
        const playerIndex = game.players.findIndex((p) => p.name === playerName);
        if (playerIndex === -1) {
            socket.emit('error', "Vous n'êtes pas dans cette partie.");
            return;
        }
        game.players.splice(playerIndex, 1);
        socket.leave(gameId);
    }

    private endGame(socket: Socket, gameId: string) {
        const game = this.rooms[gameId];
        const isHost = game.players.length === 0 || game.players[0].id !== socket.id;
        if (!game) {
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }
        if (isHost) {
            socket.emit('error', "Vous devez être l'hôte de la partie pour la terminer.");
            return;
        }
        this.io.to(gameId).emit('gameEnded', { gameId });
        delete this.rooms[gameId];
        this.io.socketsLeave(gameId);
    }
}
