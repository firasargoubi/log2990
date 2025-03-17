import { Injectable } from '@angular/core';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Observable } from 'rxjs';
import { shareReplay as rxjsShareReplay } from 'rxjs/operators';
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

        this.socket.on('connect', () => {
            console.log('Socket connected with ID:', this.socket.id);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected: ', reason);
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

                try {
                    data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);

                    if (!data.gameState.availableMoves) {
                        data.gameState.availableMoves = [];
                        console.warn('availableMoves was undefined in gameState, set to empty array');
                    }

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

                try {
                    data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);

                    if (!data.availableMoves) {
                        data.availableMoves = [];
                        console.warn('availableMoves was undefined in turn data, set to empty array');
                    }

                    data.gameState.availableMoves = [...data.availableMoves];

                    observer.next(data);
                } catch (error) {
                    console.error('Error processing turn started event:', error);
                }
            });
        });
    }

    requestMovement(lobbyId: string, coordinate: Coordinates): void {
        this.socket.emit('requestMovement', { lobbyId, coordinate });
    }

    onMovementProcessed(): Observable<{ gameState: GameState; playerMoved: string; newPosition: Coordinates }> {
        return new Observable((observer) => {
            this.socket.on('movementProcessed', (data: { gameState: GameState; playerMoved: string; newPosition: Coordinates }) => {

                try {
                    data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);

                    if (!data.gameState.availableMoves) {
                        data.gameState.availableMoves = [];
                        console.warn('availableMoves was undefined in movement data, set to empty array');
                    }

                    observer.next(data);
                } catch (error) {
                    console.error('Error processing movement event:', error);
                }
            });
        });
    }

    requestEndTurn(lobbyId: string): void {
        this.socket.emit('endTurn', { lobbyId });
    }

    onTurnEnded(): Observable<{ gameState: GameState; previousPlayer: string; currentPlayer: string }> {
        return new Observable((observer) => {
            this.socket.on('turnEnded', (data: { gameState: GameState; previousPlayer: string; currentPlayer: string }) => {

                try {
                    data.gameState.playerPositions = this.convertPlayerPositionsToMap(data.gameState.playerPositions);

                    if (!data.gameState.availableMoves) {
                        data.gameState.availableMoves = [];
                        console.warn('availableMoves was undefined in turn ended data, set to empty array');
                    }


                    observer.next(data);
                } catch (error) {
                    console.error('Error processing turn ended event:', error);
                }
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
                console.error('Socket error:', error);
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

    executeAction(action: string, tile: Tile, lobbyId: string): Observable<{ newGameBoard: number[][] }> {
        return new Observable<{ newGameBoard: number[][] }>((observer) => {
            // Attente de la mise à jour de la tuile
            this.socket.once('tileUpdated', (data: { newGameBoard: number[][] }) => {
                observer.next(data);
                observer.complete();
            });

            // Émission de l'action au serveur
            this.socket.emit(action, { tile, lobbyId });
        });
    }

    initializeBattle(currentPlayer: Player, opponent: Player, lobbyId: string) {
        this.socket.emit('initializeBattle', { currentPlayer, opponent, lobbyId });
    }

    onInteraction(): Observable<{ isInCombat: boolean }> {
        return new Observable<{ isInCombat: boolean }>((observer) => {
            this.socket.on('playersBattling', (data: { isInCombat: boolean }) => {
                observer.next(data);
                observer.complete();
            });
        }).pipe(shareReplay(1));
    }

    getPlayerTurn(): Observable<{ playerTurn: string; countDown: number }> {
        return new Observable<{ playerTurn: string; countDown: number }>((observer) => {
            this.socket.on('PlayerTurn', (data: { playerTurn: string; countDown: number }) => {
                observer.next(data);
                observer.complete();
            });
        });
    }

    getPlayerSwitch(): Observable<{ newPlayerTurn: string; countDown: number }> {
        return new Observable<{ newPlayerTurn: string; countDown: number }>((observer) => {
            this.socket.on('PlayerSwitch', (data: { newPlayerTurn: string; countDown: number }) => {
                observer.next(data);
                observer.complete();
            });
        });
    }

    changeTurnEnd(currentPlayer: Player, opponent: Player, playerTurn: string, gameState: GameState) {
        this.socket.emit('changeTurnEndTimer', { currentPlayer, opponent, playerTurn, gameState });
    }

    handleAttack(currentPlayer: Player, opponent: Player, lobbyId: string, gameState: GameState) {
        this.socket.emit('startBattle', { currentPlayer, opponent, lobbyId, gameState });
    }

    onTileUpdate(): Observable<{ newGameBoard: number[][] }> {
        return new Observable<{ newGameBoard: number[][] }>((observer) => {
            this.socket.on('tileUpdated', (data: { newGameBoard: number[][] }) => {
                observer.next(data);
            });
        });
    }

    private convertPlayerPositionsToMap(playerPositions: unknown): Map<string, Coordinates> {
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

    onCombatUpdate(): Observable<{ timeLeft: number }> {
        return new Observable((observer) => {
            this.socket.on('combatUpdate', (data) => {
                observer.next(data);
            });
        });
    }

    startCombat(playerId: string, lobbyId: string): void {
        this.socket.emit('startCombat', { playerId, lobbyId });
    }

    updateCombatTime(timeLeft: number): void {
        this.socket.emit('combatUpdate', { timeLeft }); // Émettre le temps restant à tous les joueurs
    }

    // onTurnStarted(): Observable<any> {
    //     return new Observable((observer) => {
    //         this.socket.on('turnStarted', (data: any) => {
    //             observer.next(data);
    //         });
    //     });
    // }
}
function shareReplay<T>(bufferSize: number): import('rxjs').OperatorFunction<T, T> {
    return rxjsShareReplay(bufferSize);
}
