import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
interface ChatMessage {
    playerName: string;
    message: string;
}
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

    sendMessage(gameId: string, message: string, playerName: string): void {
        this.socket.emit('message', { gameId, message, playerName });
    }

    receiveMessage(): Observable<{ gameId: string; playerName: string; message: string }> {
        return new Observable((observer) => {
            this.socket.on('message', (data: { gameId: string; playerName: string; message: string }) => {
                observer.next(data);
            });

            return () => {
                this.socket.off('message');
            };
        });
    }

    receivePreviousMessages(): Observable<{ gameId: string; messages: { playerName: string; message: string }[] }> {
        return new Observable((observer) => {
            this.socket.on('previousMessages', (data: { gameId: string; messages: { playerName: string; message: string }[] }) => {
                observer.next(data);
            });

            return () => {
                this.socket.off('previousMessages');
            };
        });
    }

    receivePlayerListUpdated(): Observable<{ gameId: string; players: { name: string }[] }> {
        return new Observable((observer) => {
            this.socket.on('playerListUpdated', (data: { gameId: string; players: { name: string }[] }) => {
                observer.next(data);
            });

            return () => {
                this.socket.off('playerListUpdated');
            };
        });
    }
    receiveChatCreated(): Observable<{ gameId: string; messages: ChatMessage[] }> {
        return new Observable((observer) => {
            this.socket.on('chatCreated', (data: { gameId: string; messages: ChatMessage[] }) => {
                observer.next(data);
            });

            return () => {
                this.socket.off('chatCreated');
            };
        });
    }
}
