import { Injectable } from '@angular/core';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { shareReplay as rxjsShareReplay } from 'rxjs/operators';

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
                    console.log('Processed turn data:', {
                        currentPlayer: data.gameState.currentPlayer,
                        availableMoves: data.gameState.availableMoves,
                        gameStateAvailableMoves: data.gameState.availableMoves,
                    });

                    observer.next(data);
                } catch (error) {
                    console.error('Error processing turn started event:', error);
                }
            });
        });
    }

    requestMovement(lobbyId: string, coordinates: Coordinates[]): void {
        console.log('Requesting movement in lobby:', lobbyId, 'to coordinate:', coordinates);
        this.socket.emit('requestMovement', { lobbyId, coordinates });
    }

    onMovementProcessed(): Observable<{ gameState: GameState; playerMoved: string; newPosition: Coordinates }> {
        return new Observable((observer) => {
            this.socket.on('movementProcessed', (data: { gameState: GameState; playerMoved: string; newPosition: Coordinates }) => {
                console.log('Movement processed event received:', data);

                try {
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

    onBoardChanged(): Observable<{ gameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on('boardModified', (data: { gameState: GameState }) => {
                console.log('Board changed event received:', data);

                try {
                    console.log('Processed board changed data:', {
                        currentPlayer: data.gameState.currentPlayer,
                        availableMoves: data.gameState.availableMoves,
                    });

                    observer.next(data);
                } catch (error) {
                    console.error('Error processing board changed event:', error);
                }
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

    getPlayerTurn(): Observable<{ playerTurn: string }> {
        return new Observable<{ playerTurn: string }>((observer) => {
            this.socket.on('PlayerTurn', (data: { playerTurn: string }) => {
                console.log('PLAYER ID: ', data);
                observer.next(data);
                observer.complete();
            });
        });
    }

    handleAttack(currentPlayer: Player, opponent: Player, lobbyId: string, gameState: GameState) {
        console.log('START BATTLE IN CURRENT PLAYER');
        this.socket.emit('startBattle', { currentPlayer, opponent, lobbyId, gameState });
    }

    // Écoute les mises à jour envoyées à TOUS les joueurs
    onTileUpdate(): Observable<{ newGameBoard: number[][] }> {
        return new Observable<{ newGameBoard: number[][] }>((observer) => {
            this.socket.on('tileUpdated', (data: { newGameBoard: number[][] }) => {
                observer.next(data);
            });
        });
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
