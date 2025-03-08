import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { Player } from '@common/player';
import { Game } from '@app/interfaces/game.model';
import { GameLobby } from '@common/game-lobby';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class LobbyService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.serverWebSocketUrl, {
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
}
