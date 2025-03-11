import { Injectable } from '@angular/core';
import { Game } from '@common/game.interface';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class LobbyService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.serverUrl, {
            transports: ['websocket', 'polling'],
        });
    }
    createLobby(game: Game): void {
        this.socket.emit('createLobby', game);
    }

    onLobbyCreated(): Observable<{ lobbyId: string }> {
        return new Observable((observer) => {
            this.socket.on('lobbyCreated', (data: { lobbyId: string }) => {
                observer.next(data);
            });
        });
    }

    joinLobby(lobbyId: string, player: Player): void {
        this.socket.emit('joinLobby', { lobbyId, player });
    }

    onPlayerJoined(): Observable<{ lobbyId: string; player: Player }> {
        return new Observable((observer) => {
            this.socket.on('playerJoined', (data: { lobbyId: string; player: Player }) => {
                observer.next(data);
            });
        });
    }

    leaveLobby(lobbyId: string, playerName: string): void {
        this.socket.emit('leaveLobby', { lobbyId, playerName });
    }

    onPlayerLeft(): Observable<{ lobbyId: string; playerName: string }> {
        return new Observable((observer) => {
            this.socket.on('playerLeft', (data: { lobbyId: string; playerName: string }) => {
                observer.next(data);
            });
        });
    }

    lockLobby(lobbyId: string): void {
        this.socket.emit('lockLobby', lobbyId);
    }

    onLobbyLocked(): Observable<{ lobbyId: string }> {
        return new Observable((observer) => {
            this.socket.on('lobbyLocked', (data: { lobbyId: string }) => {
                observer.next(data);
            });
        });
    }

    getLobby(lobbyId: string): Observable<GameLobby> {
        return new Observable((observer) => {
            this.socket.emit('getLobby', lobbyId, (lobby: GameLobby) => {
                observer.next(lobby);
            });
        });
    }

    getGameId(lobbyId: string): Observable<string> {
        return new Observable((observer) => {
            this.socket.emit('getGameId', lobbyId, (gameId: string) => {
                observer.next(gameId);
            });
        });
    }

    onLobbyUpdated(): Observable<{ lobbyId: string; lobby: GameLobby }> {
        return new Observable((observer) => {
            this.socket.on('lobbyUpdated', (data: { lobbyId: string; lobby: GameLobby }) => {
                observer.next(data);
            });
        });
    }

    onError(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on('error', (error: string) => {
                observer.next(error);
            });
        });
    }

    verifyRoom(gameId: string): Observable<{ exists: boolean; isLocked?: boolean }> {
        return new Observable((observer) => {
            this.socket.emit('verifyRoom', { gameId }, (response: { exists: boolean; isLocked?: boolean }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }

    verifyAvatars(lobbyId: string): Observable<{ avatars: string[] }> {
        return new Observable((observer) => {
            this.socket.emit('verifyAvatars', { lobbyId }, (response: { avatars: string[] }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }

    verifyUsername(lobbyId: string): Observable<{ usernames: string[] }> {
        return new Observable((observer) => {
            this.socket.emit('verifyUsername', { lobbyId }, (response: { usernames: string[] }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }
}
