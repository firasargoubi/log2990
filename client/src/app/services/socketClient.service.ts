import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environement } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    private socket: Socket;

    constructor() {
        this.socket = io(environement.serverUrl, {
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

    createGame(gameId: string, playerName: string) {
        this.socket.emit('createGame', { gameId, playerName });
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
