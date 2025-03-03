import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.serverUrl, {
            transports: ['websocket', 'polling'],
        });
    }

    receiveError() {
        return new Observable<string>((observer) => {
            this.socket.on('error', (errorMessage: string) => {
                observer.next(errorMessage);
            });
        });
    }

    createGame(playerName: string) {
        this.socket.emit('createGame', { playerName });
    }

    receiveGameCreated(): Observable<{ gameId: string }> {
        return new Observable((observer) => {
            this.socket.on('gameCreated', (data: { gameId: string }) => observer.next(data));
        });
    }

    receivePlayerJoined(): Observable<{ gameId: string; playerId: string; playerName: string }> {
        return new Observable((observer) => {
            this.socket.on('playerJoined', (data: { gameId: string; playerId: string; playerName: string }) => observer.next(data));
        });
    }

    joinGame(gameId: string, playerName: string): void {
        this.socket.emit('joinGame', { gameId, playerName });
    }

    sendMessage(message: string): void {
        this.socket.emit('message', message);
    }

    receiveMessage(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on('message', (data: string) => observer.next(data));
        });
    }
}
