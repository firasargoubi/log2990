import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';

@Injectable({
    providedIn: 'root',
})
export class LobbyService {
    private lobbies = new Map<string, BehaviorSubject<GameLobby>>();

    createLobby(host: Player, maxPlayers: number): string {
        const lobbyId = this.generateId();
        const newLobby: GameLobby = {
            id: lobbyId,
            players: [host],
            isLocked: false,
            maxPlayers,
        };
        this.lobbies.set(lobbyId, new BehaviorSubject<GameLobby>(newLobby));
        return lobbyId;
    }

    getLobby(lobbyId: string) {
        return this.lobbies.get(lobbyId)?.asObservable();
    }

    addPlayerToLobby(lobbyId: string, player: Player) {
        const lobbySubject = this.lobbies.get(lobbyId);
        if (lobbySubject) {
            const lobby = lobbySubject.value;
            if (!lobby.isLocked && lobby.players.length < lobby.maxPlayers) {
                lobby.players.push(player);
                lobbySubject.next({ ...lobby });
            }
        }
    }

    private generateId(): string {
        const code = Math.floor(Math.random() * 10000);
        return code.toString().padStart(4, '0');
    }
}
