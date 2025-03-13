import { Injectable } from '@angular/core';
import { Game } from '@common/game.interface';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';

@Injectable({
    providedIn: 'root',
})
export class LobbyService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.serverUrl, {
            transports: ['websocket', 'polling'],
        });
    }

    // Get socket ID
    getSocketId(): string {
        return this.socket.id || '';
    }

    // Socket connection management
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

    // Lobby management
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

    // Game play methods
    requestStartGame(lobbyId: string): void {
        this.socket.emit('requestStart', lobbyId);
    }

    onGameStarted(): Observable<{ gameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on('gameStarted', (data: { gameState: GameState }) => {
                // Convert the playerPositions from object to Map
                data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);
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
                // Convert the playerPositions from object to Map
                data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);
                observer.next(data);
            });
        });
    }

    requestEndTurn(lobbyId: string): void {
        this.socket.emit('endTurn', { lobbyId });
    }

    onTurnStarted(): Observable<{ gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }> {
        return new Observable((observer) => {
            this.socket.on('turnStarted', (data: { gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }) => {
                // Convert the playerPositions from object to Map
                data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);
                observer.next(data);
            });
        });
    }

    onTurnEnded(): Observable<{ gameState: GameState; previousPlayer: string; currentPlayer: string }> {
        return new Observable((observer) => {
            this.socket.on('turnEnded', (data: { gameState: GameState; previousPlayer: string; currentPlayer: string }) => {
                // Convert the playerPositions from object to Map
                data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);
                observer.next(data);
            });
        });
    }

    // Request a specific path calculation
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

    // Generic error handling
    onError(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on('error', (error: string) => {
                observer.next(error);
            });
        });
    }

    // Helper function to convert playerPositions from object to Map
    private convertPlayerPositionsToMap(playerPositions: any): Map<string, Coordinates> {
        const positionsMap = new Map<string, Coordinates>();

        if (playerPositions) {
            // If it's already a Map, return it
            if (playerPositions instanceof Map) {
                return playerPositions;
            }

            // If it's an object, convert it to a Map
            if (typeof playerPositions === 'object' && !Array.isArray(playerPositions)) {
                Object.entries(playerPositions).forEach(([playerId, position]) => {
                    positionsMap.set(playerId, position as Coordinates);
                });
            }
        }

        return positionsMap;
    }
}
