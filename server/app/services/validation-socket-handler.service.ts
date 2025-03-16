import { GameLobby } from '@common/game-lobby';
import { Socket } from 'socket.io';

export class ValidationSocketHandlerService {
    constructor(private lobbies: Map<string, GameLobby>) {}

    verifyRoom(socket: Socket, lobbyId: string, callback: (response: { exists: boolean; isLocked?: boolean }) => void) {
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

    verifyAvatars(socket: Socket, lobbyId: string, callback: (data: { avatars: string[] }) => void) {
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
    verifyUsername(socket: Socket, lobbyId: string, callback: (data: { usernames: string[] }) => void) {
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
