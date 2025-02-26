import { Socket, io } from 'socket.io-client';
import { Injectable } from '@angular/core';
@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    socket: Socket;
    connect() {
        this.socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
        });
        console.log('Connexion au serveur WebSocket sur http://localhost:3000');
    }

    disconnect() {
        this.socket.disconnect();
    }
    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }
    send<T>(event: string, data?: T, callback?: Function): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
