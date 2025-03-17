/* eslint-disable @typescript-eslint/no-magic-numbers */
import { GameLobby } from '@common/game-lobby';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';

@Service()
export class LobbySocketHandlerService {
    private io: Server;
    constructor(private lobbies: Map<string, GameLobby>) {}
    setServer(server: Server) {
        this.io = server;
    }

    createLobby(game: Game): string {
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

    handleJoinLobbyRequest(socket: Socket, lobbyId: string, player: Player): void {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        if (lobby.isLocked || lobby.players.length >= lobby.maxPlayers) {
            socket.emit('error', 'Lobby is locked or full.');
            return;
        }

        player.id = socket.id;
        player.isHost = lobby.players.length === 0;
        lobby.players.push(player);

        socket.join(lobbyId);
        this.io.to(lobbyId).emit('playerJoined', { lobbyId, player });
        this.updateLobby(lobbyId);
    }

    leaveLobby(socket: Socket, lobbyId: string, playerName: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return;

        const playerIndex = lobby.players.findIndex((p) => p.name === playerName);
        if (playerIndex === -1) return;

        const player = lobby.players[playerIndex];
        if (player.isHost) {
            this.lobbies.delete(lobbyId);
            this.io.to(lobbyId).emit('hostDisconnected');
            return;
        }

        lobby.players.splice(playerIndex, 1);
        socket.leave(lobbyId);

        this.io.to(lobbyId).emit('playerLeft', { lobbyId, playerName });

        socket.emit('playerLeft', { lobbyId, playerName });

        this.updateLobby(lobbyId);
    }

    lockLobby(socket: Socket, lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        lobby.isLocked = !lobby.isLocked;
        this.io.to(lobbyId).emit('lobbyLocked', { lobbyId });
        this.updateLobby(lobbyId);
    }

    updateLobby(lobbyId: string): void {
        const lobby = this.lobbies.get(lobbyId);
        if (lobby) {
            const lobbyCopy = JSON.parse(JSON.stringify(lobby));
            this.io.to(lobbyId).emit('lobbyUpdated', { lobbyId, lobby: lobbyCopy });
        }
    }
    getLobby(lobbyId: string): GameLobby | undefined {
        return this.lobbies.get(lobbyId);
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
}
