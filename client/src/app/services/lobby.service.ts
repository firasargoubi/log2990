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
    private currentPlayer: Player | null = null;

    constructor() {
        this.socket = io(environment.serverUrl, {
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('Socket connected with ID:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    setCurrentPlayer(player: Player): void {
        console.log('Setting current player in LobbyService:', player);
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
        console.log('Creating lobby for game:', game);
        this.socket.emit('createLobby', game);
    }

    onLobbyCreated(): Observable<{ lobbyId: string }> {
        return new Observable((observer) => {
            this.socket.on('lobbyCreated', (data: { lobbyId: string }) => {
                console.log('Lobby created:', data);
                observer.next(data);
            });
        });
    }

    joinLobby(lobbyId: string, player: Player): void {
        console.log('Joining lobby:', lobbyId, 'as player:', player);
        this.socket.emit('joinLobby', { lobbyId, player });
    }

    onPlayerJoined(): Observable<{ lobbyId: string; player: Player }> {
        return new Observable((observer) => {
            this.socket.on('playerJoined', (data: { lobbyId: string; player: Player }) => {
                console.log('Player joined:', data);
                observer.next(data);
            });
        });
    }

    leaveLobby(lobbyId: string, playerName: string): void {
        console.log('Leaving lobby:', lobbyId, 'player:', playerName);
        this.socket.emit('leaveLobby', { lobbyId, playerName });
    }

    onPlayerLeft(): Observable<{ lobbyId: string; playerName: string }> {
        return new Observable((observer) => {
            this.socket.on('playerLeft', (data: { lobbyId: string; playerName: string }) => {
                console.log('Player left:', data);
                observer.next(data);
            });
        });
    }

    lockLobby(lobbyId: string): void {
        console.log('Locking lobby:', lobbyId);
        this.socket.emit('lockLobby', lobbyId);
    }

    onLobbyLocked(): Observable<{ lobbyId: string }> {
        return new Observable((observer) => {
            this.socket.on('lobbyLocked', (data: { lobbyId: string }) => {
                console.log('Lobby locked:', data);
                observer.next(data);
            });
        });
    }

    requestStartGame(lobbyId: string): void {
        console.log('Requesting game start for lobby:', lobbyId);
        this.socket.emit('requestStart', lobbyId);
    }

    onGameStarted(): Observable<{ gameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on('gameStarted', (data: { gameState: GameState }) => {
                console.log('Game started event received:', data);

                try {
                    data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);

                    if (!data.gameState.availableMoves) {
                        data.gameState.availableMoves = [];
                        console.warn('availableMoves was undefined in gameState, set to empty array');
                    }

                    console.log('Processed game state:', {
                        currentPlayer: data.gameState.currentPlayer,
                        availableMoves: data.gameState.availableMoves,
                        playerPositions: Array.from(data.gameState.playerPositions.entries()),
                    });

                    observer.next(data);
                } catch (error) {
                    console.error('Error processing game state:', error);
                }
            });
        });
    }

    onTurnStarted(): Observable<{ gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }> {
        return new Observable((observer) => {
            this.socket.on('turnStarted', (data: { gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }) => {
                console.log('Turn started event received in service:', data);

                try {
                    data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);

                    if (!data.availableMoves) {
                        data.availableMoves = [];
                        console.warn('availableMoves was undefined in turn data, set to empty array');
                    }

                    data.gameState.availableMoves = [...data.availableMoves];

                    console.log('Processed turn data:', {
                        currentPlayer: data.currentPlayer,
                        availableMoves: data.availableMoves,
                        gameStateAvailableMoves: data.gameState.availableMoves,
                    });

                    observer.next(data);
                } catch (error) {
                    console.error('Error processing turn started event:', error);
                }
            });
        });
    }

    requestMovement(lobbyId: string, coordinate: Coordinates): void {
        console.log('Requesting movement in lobby:', lobbyId, 'to coordinate:', coordinate);
        this.socket.emit('requestMovement', { lobbyId, coordinate });
    }

    onMovementProcessed(): Observable<{ gameState: GameState; playerMoved: string; newPosition: Coordinates }> {
        return new Observable((observer) => {
            this.socket.on('movementProcessed', (data: { gameState: GameState; playerMoved: string; newPosition: Coordinates }) => {
                console.log('Movement processed event received:', data);

                try {
                    data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);

                    if (!data.gameState.availableMoves) {
                        data.gameState.availableMoves = [];
                        console.warn('availableMoves was undefined in movement data, set to empty array');
                    }

                    console.log('Processed movement data:', {
                        playerMoved: data.playerMoved,
                        newPosition: data.newPosition,
                        availableMoves: data.gameState.availableMoves,
                    });

                    observer.next(data);
                } catch (error) {
                    console.error('Error processing movement event:', error);
                }
            });
        });
    }

    requestEndTurn(lobbyId: string): void {
        console.log('Requesting end turn for lobby:', lobbyId);
        this.socket.emit('endTurn', { lobbyId });
    }

    onTurnEnded(): Observable<{ gameState: GameState; previousPlayer: string; currentPlayer: string }> {
        return new Observable((observer) => {
            this.socket.on('turnEnded', (data: { gameState: GameState; previousPlayer: string; currentPlayer: string }) => {
                console.log('Turn ended event received:', data);

                try {
                    data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);

                    if (!data.gameState.availableMoves) {
                        data.gameState.availableMoves = [];
                        console.warn('availableMoves was undefined in turn ended data, set to empty array');
                    }

                    console.log('Processed turn ended data:', {
                        previousPlayer: data.previousPlayer,
                        currentPlayer: data.currentPlayer,
                        availableMoves: data.gameState.availableMoves,
                    });

                    observer.next(data);
                } catch (error) {
                    console.error('Error processing turn ended event:', error);
                }
            });
        });
    }

    requestPath(lobbyId: string, destination: Coordinates): void {
        console.log('Requesting path calculation in lobby:', lobbyId, 'to destination:', destination);
        this.socket.emit('requestPath', { lobbyId, destination });
    }

    onPathCalculated(): Observable<{ destination: Coordinates; path: Coordinates[]; valid: boolean }> {
        return new Observable((observer) => {
            this.socket.on('pathCalculated', (data: { destination: Coordinates; path: Coordinates[]; valid: boolean }) => {
                console.log('Path calculation received:', data);
                observer.next(data);
            });
        });
    }

    onError(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on('error', (error: string) => {
                console.error('Socket error:', error);
                observer.next(error);
            });
        });
    }

    private convertPlayerPositionsToMap(playerPositions: any): Map<string, Coordinates> {
        const positionsMap = new Map<string, Coordinates>();

        try {
            if (playerPositions) {
                if (playerPositions instanceof Map) {
                    return playerPositions;
                }

                if (typeof playerPositions === 'object' && !Array.isArray(playerPositions)) {
                    Object.entries(playerPositions).forEach(([playerId, position]) => {
                        positionsMap.set(playerId, position as Coordinates);
                    });
                    console.log('Converted player positions to Map:', Array.from(positionsMap.entries()));
                } else {
                    console.warn('playerPositions is not an object:', playerPositions);
                }
            } else {
                console.warn('playerPositions is undefined or null');
            }
        } catch (error) {
            console.error('Error converting playerPositions to Map:', error);
        }

        return positionsMap;
    }

    getLobby(lobbyId: string): Observable<GameLobby> {
        return new Observable((observer) => {
            this.socket.emit('getLobby', lobbyId, (lobby: GameLobby) => {
                console.log('Got lobby data:', lobby);
                observer.next(lobby);
            });
        });
    }

    getGameId(lobbyId: string): Observable<string> {
        return new Observable((observer) => {
            this.socket.emit('getGameId', lobbyId, (gameId: string) => {
                console.log('Got game ID:', gameId);
                observer.next(gameId);
            });
        });
    }

    onLobbyUpdated(): Observable<{ lobbyId: string; lobby: GameLobby }> {
        return new Observable((observer) => {
            this.socket.on('lobbyUpdated', (data: { lobbyId: string; lobby: GameLobby }) => {
                console.log('Lobby updated:', data);
                observer.next(data);
            });
        });
    }

    verifyRoom(gameId: string): Observable<{ exists: boolean; isLocked?: boolean }> {
        return new Observable((observer) => {
            this.socket.emit('verifyRoom', { gameId }, (response: { exists: boolean; isLocked?: boolean }) => {
                console.log('Room verification result:', response);
                observer.next(response);
                observer.complete();
            });
        });
    }

    verifyAvatars(lobbyId: string): Observable<{ avatars: string[] }> {
        return new Observable((observer) => {
            this.socket.emit('verifyAvatars', { lobbyId }, (response: { avatars: string[] }) => {
                console.log('Avatars verification result:', response);
                observer.next(response);
                observer.complete();
            });
        });
    }

    verifyUsername(lobbyId: string): Observable<{ usernames: string[] }> {
        return new Observable((observer) => {
            this.socket.emit('verifyUsername', { lobbyId }, (response: { usernames: string[] }) => {
                console.log('Username verification result:', response);
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
