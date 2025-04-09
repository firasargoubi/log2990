import { VIRTUAL_PLAYER_NAMES } from '@app/consts/virtual-player-names';
import { AVATARS } from '@common/avatars';
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

    getAvailableAvatar(lobbyId: string): string {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return AVATARS.fawn;

        const usedAvatars = new Set(lobby.players.map((player) => player.avatar));
        const availableAvatars = Object.values(AVATARS).filter((avatarPath) => !usedAvatars.has(avatarPath));

        if (availableAvatars.length === 0) return AVATARS.fawn;
        const randomIndex = Math.floor(Math.random() * availableAvatars.length);
        return availableAvatars[randomIndex];
    }

    getAvailableVirtualPlayerName(lobbyId: string): string {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return VIRTUAL_PLAYER_NAMES[0];

        const usedNames = new Set(lobby.players.map((player) => player.name));
        const availableNames = VIRTUAL_PLAYER_NAMES.filter((name) => !usedNames.has(name));

        if (availableNames.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableNames.length);
            return availableNames[randomIndex];
        }

        const randomName = VIRTUAL_PLAYER_NAMES[Math.floor(Math.random() * VIRTUAL_PLAYER_NAMES.length)];
        let botName = `${randomName}Bot`;
        let counter = 1;

        while (usedNames.has(botName)) {
            botName = `${randomName}Bot${counter}`;
            counter++;
        }

        return botName;
    }
}
