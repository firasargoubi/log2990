import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    private socket: Socket;

    constructor() {
        this.socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
        });
    }

    createGame(gameId: string, playerName: string) {
        console.log(gameId, playerName);
        this.socket.emit('createGame', { gameId, playerName });
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
