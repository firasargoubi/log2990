import { Injectable } from '@angular/core';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class LobbyService {
    private socket: Socket;
    private currentPlayer: Player | null = null;

    constructor() {
        this.socket = io(environment.serverUrl, {
            transports: ['websocket', 'polling'],
        });
    }

    setCurrentPlayer(player: Player): void {
        this.currentPlayer = player;
    }

    getCurrentPlayer(): Player | null {
        return this.currentPlayer;
    }

    getSocketId(): string {
        return this.socket.id || '';
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    reconnect(): void {
        if (this.socket && !this.socket.connected) {
            this.socket.connect();
        }
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

    requestStartGame(lobbyId: string): void {
        this.socket.emit('requestStart', lobbyId);
    }

    onGameStarted(): Observable<{ gameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on('gameStarted', (data: { gameState: GameState }) => {
                if (!data.gameState.availableMoves) {
                    data.gameState.availableMoves = [];
                }

                observer.next(data);
            });
        });
    }

    onTurnStarted(): Observable<{ gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }> {
        return new Observable((observer) => {
            this.socket.on('turnStarted', (data: { gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }) => {
                if (!data.availableMoves) {
                    data.availableMoves = [];
                }

                data.gameState.availableMoves = [...data.availableMoves];

                observer.next(data);
            });
        });
    }

    requestMovement(lobbyId: string, coordinate: Coordinates): void {
        this.socket.emit('requestMovement', { lobbyId, coordinate });
    }

    onMovementProcessed(): Observable<{ gameState: GameState; playerMoved: string; newPosition: Coordinates }> {
        return new Observable((observer) => {
            this.socket.on('movementProcessed', (data: { gameState: GameState; playerMoved: string; newPosition: Coordinates }) => {
                if (!data.gameState.availableMoves) {
                    data.gameState.availableMoves = [];
                }

                observer.next(data);
            });
        });
    }

    requestEndTurn(lobbyId: string): void {
        this.socket.emit('endTurn', { lobbyId });
    }

    onTurnEnded(): Observable<{ gameState: GameState; previousPlayer: string; currentPlayer: string }> {
        return new Observable((observer) => {
            this.socket.on('turnEnded', (data: { gameState: GameState; previousPlayer: string; currentPlayer: string }) => {
                if (!data.gameState.availableMoves) {
                    data.gameState.availableMoves = [];
                }

                observer.next(data);
            });
        });
    }

    requestPath(lobbyId: string, destination: Coordinates): void {
        this.socket.emit('requestPath', { lobbyId, destination });
    }

    onPathCalculated(): Observable<{ destination: Coordinates; path: Coordinates[]; valid: boolean }> {
        return new Observable((observer) => {
            this.socket.on('pathCalculated', (data: { destination: Coordinates; path: Coordinates[]; valid: boolean }) => {
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

    verifyRoom(gameId: string): Observable<{ exists: boolean; isLocked?: boolean }> {
        return new Observable((observer) => {
            this.socket.emit('verifyRoom', { gameId }, (response: { exists: boolean; isLocked?: boolean }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }

    verifyAvatars(lobbyId: string): Observable<{ avatars: string[] }> {
        return new Observable((observer) => {
            this.socket.emit('verifyAvatars', { lobbyId }, (response: { avatars: string[] }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }

    verifyUsername(lobbyId: string): Observable<{ usernames: string[] }> {
        return new Observable((observer) => {
            this.socket.emit('verifyUsername', { lobbyId }, (response: { usernames: string[] }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }

    onHostDisconnected(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on('hostDisconnected', () => {
                observer.next();
            });
        });
    }
}
