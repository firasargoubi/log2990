import { GameLobby } from '@common/game-lobby';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export class SocketService {
    private io: Server;
    private lobbies = new Map<string, GameLobby>();

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
            socket.on('createLobby', (game: Game) => {
                const lobbyId = this.createLobby(game);
                socket.emit('lobbyCreated', { lobbyId });
            });

            socket.on('joinLobby', (data: { lobbyId: string; player: Player }) => {
                this.handleJoinLobbyRequest(socket, data.lobbyId, data.player);
            });

            socket.on('leaveLobby', (data: { lobbyId: string; playerName: string }) => {
                this.leaveLobby(socket, data.lobbyId, data.playerName);
            });

            socket.on('lockLobby', (lobbyId: string) => {
                this.lockLobby(socket, lobbyId);
            });

            socket.on('getLobby', (lobbyId: string, callback: (lobby: GameLobby | null) => void) => {
                const lobby = this.lobbies.get(lobbyId);
                callback(lobby || null);
            });

            socket.on('getGameId', (lobbyId: string, callback: (gameId: string | null) => void) => {
                const lobby = this.lobbies.get(lobbyId);
                callback(lobby?.gameId || null);
            });

            socket.on('verifyRoom', (data: { gameId: string }, callback: (response: { exists: boolean; isLocked?: boolean }) => void) => {
                this.verifyRoom(socket, data.gameId, callback);
            });

            socket.on('verifyAvatars', (data: { lobbyId: string }, callback: (response: { avatars: string[] }) => void) => {
                this.verifyAvatars(socket, data.lobbyId, callback);
            });

            socket.on('verifyUsername', (data: { lobbyId: string }, callback: (response: { usernames: string[] }) => void) => {
                this.verifyUsername(socket, data.lobbyId, callback);
            });
        });
    }

    private createLobby(game: Game): string {
        const maxPlayers = this.getMaxPlayers(game.mapSize);
        const lobbyId = this.generateId();

        const newLobby: GameLobby = {
            id: lobbyId,
            players: [],
            isLocked: false,
            maxPlayers,
            gameId: game.id,
        };

        this.lobbies.set(lobbyId, newLobby);
        this.updateLobby(lobbyId);
        return lobbyId;
    }

    private handleJoinLobbyRequest(socket: Socket, lobbyId: string, player: Player) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }
        if (lobby.isLocked || lobby.players.length >= lobby.maxPlayers) {
            socket.emit('error', 'Lobby is locked or full.');
            return;
        }

        player.isHost = lobby.players.length === 0;
        lobby.players.push(player);
        socket.join(lobbyId);
        this.io.to(lobbyId).emit('playerJoined', { lobbyId, player });
        this.updateLobby(lobbyId);
    }

    private leaveLobby(socket: Socket, lobbyId: string, playerName: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        const playerIndex = lobby.players.findIndex((p) => p.name === playerName);
        if (playerIndex === -1) {
            socket.emit('error', 'Player not found in lobby.');
            return;
        }

        lobby.players.splice(playerIndex, 1);
        socket.leave(lobbyId);
        this.io.to(lobbyId).emit('playerLeft', { lobbyId, playerName });
        this.updateLobby(lobbyId);
    }

    private lockLobby(socket: Socket, lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        lobby.isLocked = true;
        this.io.to(lobbyId).emit('lobbyLocked', { lobbyId });
        this.updateLobby(lobbyId);
    }

    private getMaxPlayers(mapSize: string): number {
        switch (mapSize.toLowerCase()) {
            case 'small':
            case 'petite':
                return 2;
            case 'medium':
            case 'moyenne':
                return 4;
            case 'large':
            case 'grande':
                return 6;
            default:
                return 2;
        }
    }

    private generateId(): string {
        let id: string;
        do {
            id = Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, '0');
        } while (this.lobbies.has(id));
        return id;
    }

    private updateLobby(lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (lobby) {
            this.io.to(lobbyId).emit('lobbyUpdated', { lobbyId, lobby });
        }
    }

    private verifyRoom(socket: Socket, lobbyId: string, callback: (response: { exists: boolean; isLocked?: boolean }) => void) {
        const lobby = this.lobbies.get(lobbyId);

        if (!lobby) {
            callback({ exists: false });
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }

        if (lobby.isLocked) {
            callback({ exists: false, isLocked: true });
            socket.emit('error', 'Cette partie est verrouillée.');
            return;
        }

        callback({ exists: true });
    }

    private verifyAvatars(socket: Socket, lobbyId: string, callback: (data: { avatars: string[] }) => void) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }
        if (lobby.isLocked) {
            socket.emit('error', 'Cette partie est verrouillée.');
            return;
        }

        const usedAvatars = lobby.players.map((player) => player.avatar);
        callback({ avatars: usedAvatars });
    }

    private verifyUsername(socket: Socket, lobbyId: string, callback: (data: { usernames: string[] }) => void) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', "Cette partie n'existe pas.");
            return;
        }
        if (lobby.isLocked) {
            socket.emit('error', 'Cette partie est verrouillée.');
            return;
        }

        const usedUsernames = lobby.players.map((player) => player.name);
        callback({ usernames: usedUsernames });
    }
}
