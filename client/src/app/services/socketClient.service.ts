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

    // Émission d'un message
    sendMessage(message: string): void {
        this.socket.emit('message', message);
    }

    // Écoute des messages
    receiveMessage(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on('message', (data: string) => observer.next(data));
        });
    }
}
