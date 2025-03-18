/* eslint-disable max-lines */
/* eslint-disable no-dupe-class-members */
import { Injectable } from '@angular/core';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay as rxjsShareReplay } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class LobbyService {
    private socket: Socket;
    private currentPlayer: Player | null = null;
    private isInCombatSubject = new BehaviorSubject<boolean>(false); // Valeur par défaut
    isInCombat$ = this.isInCombatSubject.asObservable();

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
            window.location.reload();
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

    onLobbyCreated(): Observable<{ lobby: GameLobby }> {
        return new Observable((observer) => {
            this.socket.on('lobbyCreated', (data: { lobby: GameLobby }) => {
                observer.next(data);
            });
        });
    }

    joinLobby(lobbyId: string, player: Player): void {
        this.socket.emit('joinLobby', { lobbyId, player });
    }

    leaveLobby(lobbyId: string, playerName: string): void {
        this.socket.emit('leaveLobby', { lobbyId, playerName });
    }

    leaveGame(lobbyId: string, playerName: string): void {
        this.socket.emit('leaveGame', lobbyId, playerName);
    }

    lockLobby(lobbyId: string): void {
        this.socket.emit('lockLobby', lobbyId);
    }

    disconnectFromRoom(lobbyId: string): void {
        this.socket.emit('disconnectFromRoom', lobbyId);
    }

    updatePlayers(lobbyId: string, players: Player[]): void {
        this.socket.emit('updatePlayers', lobbyId, players);
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
                observer.next(data);
            });
        });
    }

    onTurnStarted(): Observable<{ gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }> {
        return new Observable((observer) => {
            this.socket.on('turnStarted', (data: { gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }) => {
                observer.next(data);
            });
        });
    }

    requestMovement(lobbyId: string, coordinates: Coordinates[]): void {
        this.socket.emit('requestMovement', { lobbyId, coordinates });
    }

    requestTeleport(lobbyId: string, coordinates: Coordinates): void {
        this.socket.emit('teleport', { lobbyId, coordinates });
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

    onBoardChanged(): Observable<{ gameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on('boardModified', (data: { gameState: GameState }) => {
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

    onLobbyUpdated(): Observable<{ lobby: GameLobby }> {
        return new Observable((observer) => {
            this.socket.on('lobbyUpdated', (data: { lobby: GameLobby }) => {
                observer.next(data);
            });
        });
    }

    setDebug(lobbyId: string, debug: boolean): void {
        this.socket.emit('setDebug', { lobbyId, debug });
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
        return new Observable((observer) => {
            this.socket.on('PlayerSwitch', (data: { newPlayerTurn: string; countDown: number }) => {
                observer.next(data);
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

    updateCountdown(time: number): void {
        this.socket.emit('updateCountdown(time)', { time }); // Calls the updateCountdown method in SocketService
    }

    handleDefeat(player: Player, lobbyId: string) {
        this.socket.emit('playerDefeated', { player, lobbyId });
    }

    newSpawnPoints(): Observable<{ player: Player; newSpawn: Coordinates }> {
        return new Observable<{ player: Player; newSpawn: Coordinates }>((observer) => {
            this.socket.on('changedSpawnPoint', (data: { player: Player; newSpawn: Coordinates }) => {
                observer.next(data);
            });
        });
    }

    attackAction(lobbyId: string, opponent: Player, damage: number, opponentLife: number) {
        this.socket.emit('attackAction', { lobbyId, opponent, damage, opponentLife });
    }

    updateHealth(): Observable<{ player: Player; remainingHealth: number }> {
        return new Observable<{ player: Player; remainingHealth: number }>((observer) => {
            this.socket.on('update-health', (data: { player: Player; remainingHealth: number }) => {
                observer.next(data);
                observer.complete();
            });
        });
    }

    terminateAttack(lobbyId: string) {
        this.socket.emit('terminateAttack', { lobbyId });
    }

    onAttackEnd(): Observable<{ isInCombat: boolean }> {
        return new Observable((observer) => {
            this.socket.on('attackEnd', (data: { isInCombat: boolean }) => {
                observer.next(data);
            });
        });
    }

    onCombatUpdate(): Observable<{ timeLeft: number }> {
        return new Observable((observer) => {
            this.socket.on('combatUpdate', (data) => {
                observer.next(data); // Envoie le temps restant
            });
        });
    }

    getCombatUpdate(): Observable<{ players: Player[] }> {
        return new Observable((observer) => {
            this.socket.on('combatPlayersUpdate', (data) => {
                observer.next(data); // Sends the updated player states
            });
        });
    }

    performAttack(lobbyId: string, attackerId: string, defenderId: string): void {
        this.socket.emit('performAttack', { lobbyId, attackerId, defenderId });
    }

    getAttackResult(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on('attackResult', (data: unknown) => {
                observer.next(data);
            });
        });
    }

    updateCombatTime(timeLeft: number): void {
        this.socket.emit('combatUpdate', { timeLeft });
    }

    updateCombatStatus(isInCombat: boolean): void {
        this.isInCombatSubject.next(isInCombat);
    }

    attack(lobbyId: string, attacker: Player, defender: Player): void {
        this.socket.emit('attack', { lobbyId, attacker, defender });
    }

    flee(lobbyId: string, player: Player, success: boolean): void {
        this.socket.emit('flee', { lobbyId, player, success });
    }

    onAttackResult(): Observable<{
        attackDice: number;
        defenseDice: number;
        attackRoll: number;
        defenseRoll: number;
        attackerHP: number;
        defenderHP: number;
        damage: number;
        attacker: Player;
        defender: Player;
    }> {
        return new Observable((observer) => {
            this.socket.on('attackResult', (data) => {
                observer.next(data);
            });
        });
    }

    startCombat(lobbyId: string, currentPlayer: Player, opponent: Player, time: number): void {
        this.socket.emit('startBattle', { lobbyId, currentPlayer, opponent, time });
    }

    onStartCombat(): Observable<{ firstPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on('startCombat', (data) => {
                observer.next(data);
            });
        });
    }

    onGameEnded(): Observable<{ winner: Player }> {
        return new Observable((observer) => {
            this.socket.on('combatEnded', (data) => {
                observer.next(data);
            });
        });
    }

    // Listen for successful flee events
    onFleeSuccess(): Observable<{ fleeingPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on('fleeSuccess', (data) => {
                observer.next(data);
            });
        });
    }

    // Listen for failed flee attempts
    onFleeFailure(): Observable<{ fleeingPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on('fleeFailure', (data) => {
                observer.next(data);
            });
        });
    }
}
function shareReplay<T>(bufferSize: number): import('rxjs').OperatorFunction<T, T> {
    return rxjsShareReplay(bufferSize);
}
