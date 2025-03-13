import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { ChatMessage } from '@app/interfaces/chat-message';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';

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

    // Get socket ID
    getSocketId(): string {
        return this.socket.id ? this.socket.id : '';
    }

    // Disconnect socket
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    // Game lobby methods
    createLobby(game: any): void {
        this.socket.emit('createLobby', game);
    }

    onLobbyCreated(): Observable<{ lobbyId: string }> {
        return this.listenToEvent<{ lobbyId: string }>('lobbyCreated');
    }

    joinLobby(lobbyId: string, player: any): void {
        this.socket.emit('joinLobby', { lobbyId, player });
    }

    onPlayerJoined(): Observable<{ lobbyId: string; player: any }> {
        return this.listenToEvent<{ lobbyId: string; player: any }>('playerJoined');
    }

    leaveLobby(lobbyId: string, playerName: string): void {
        this.socket.emit('leaveLobby', { lobbyId, playerName });
    }

    onPlayerLeft(): Observable<{ lobbyId: string; playerName: string }> {
        return this.listenToEvent<{ lobbyId: string; playerName: string }>('playerLeft');
    }

    // Original methods
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

    // Game play methods - UPDATED to include lobbyId
    requestStart(lobbyId: string): void {
        this.socket.emit('requestStart', lobbyId);
    }

    requestMovement(lobbyId: string, coordinate: Coordinates): void {
        this.socket.emit('requestMovement', { lobbyId, coordinate });
    }

    requestEndTurn(lobbyId: string): void {
        this.socket.emit('endTurn', { lobbyId });
    }

    // Game state update events - UPDATED with proper types
    onGameStarted(): Observable<{ gameState: GameState }> {
        return this.listenToEvent<{ gameState: GameState }>('gameStarted');
    }

    onTurnStarted(): Observable<{ gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }> {
        return this.listenToEvent<{ gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }>('turnStarted');
    }

    onTurnEnded(): Observable<{ gameState: GameState; previousPlayer: string; currentPlayer: string }> {
        return this.listenToEvent<{ gameState: GameState; previousPlayer: string; currentPlayer: string }>('turnEnded');
    }

    onMovementProcessed(): Observable<{ gameState: GameState; playerMoved: string; newPosition: Coordinates }> {
        return this.listenToEvent<{ gameState: GameState; playerMoved: string; newPosition: Coordinates }>('movementProcessed');
    }

    onError(): Observable<string> {
        return this.listenToEvent<string>('error');
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
