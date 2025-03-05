import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { ChatMessage } from '@app/interfaces/chat-message';

@Injectable({
    providedIn: 'root',
})
export class SocketClientService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.serverWebSocketUrl, {
            transports: ['websocket', 'polling'],
        });
    }

    receiveError() {
        return this.receiveEvent<string>('error');
    }

    createGame(playerName: string) {
        this.socket.emit('createGame', { playerName });
    }

    receiveGameCreated(): Observable<{ gameId: string }> {
        return this.listenToEvent<{ gameId: string }>('gameCreated');
    }

    receivePlayerJoined(): Observable<{ gameId: string; playerId: string; playerName: string }> {
        return this.listenToEvent<{ gameId: string; playerId: string; playerName: string }>('playerJoined');
    }

    joinGame(gameId: string, playerName: string): void {
        this.socket.emit('joinGame', { gameId, playerName });
    }

    sendMessage(gameId: string, message: string, playerName: string): void {
        this.socket.emit('message', { gameId, message, playerName });
    }

    endGame(gameId: string): void {
        this.socket.emit('endGame', { gameId });
    }

    leaveGame(gameId: string, playerName: string): void {
        this.socket.emit('leaveGame', { gameId, playerName });
    }

    receiveMessage(): Observable<{ gameId: string; playerName: string; message: string }> {
        return this.listenToEvent<{ gameId: string; playerName: string; message: string }>('message');
    }

    receivePreviousMessages(): Observable<{ gameId: string; messages: { playerName: string; message: string }[] }> {
        return this.listenToEvent<{ gameId: string; messages: { playerName: string; message: string }[] }>('previousMessages');
    }

    receiveGameEnded(): Observable<{ gameId: string }> {
        return this.receiveEvent<{ gameId: string }>('gameEnded');
    }

    receivePlayerListUpdated(): Observable<{ gameId: string; players: { name: string }[] }> {
        return this.listenToEvent<{ gameId: string; players: { name: string }[] }>('playerListUpdated');
    }

    receiveChatCreated(): Observable<{ gameId: string; messages: ChatMessage[] }> {
        return this.listenToEvent<{ gameId: string; messages: ChatMessage[] }>('chatCreated');
    }

    private listenToEvent<T>(event: string): Observable<T> {
        return new Observable((observer) => {
            this.socket.on(event, (data: T) => observer.next(data));

            return () => {
                this.socket.off(event);
            };
        });
    }

    private receiveEvent<T>(event: string): Observable<T> {
        return new Observable((observer) => {
            this.socket.on(event, (data: T) => observer.next(data));
        });
    }
}
