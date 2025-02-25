import { io, Socket } from 'socket.io-client';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    socket: Socket;
    connect() {
        this.socket = io(environment.serverUrl, { transports: ['websocket'] });
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
