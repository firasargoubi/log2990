import { Injectable } from '@angular/core';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game, Tile } from '@common/game.interface';
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

    createLobby(game: Game | null): void {
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

    checkSocketStatus(): Observable<{ isConnected: boolean }> {
        return new Observable((observer) => {
            this.socket.emit('checkSocketStatus', (response: { isConnected: boolean }) => {
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

    handleDefeat(player: Player, lobbyId: string) {
        this.socket.emit('playerDefeated', { player, lobbyId });
    }

    attack(lobbyId: string, attacker: Player, defender: Player): void {
        this.socket.emit('attack', { lobbyId, attacker, defender });
    }

    flee(lobbyId: string, player: Player): void {
        this.socket.emit('flee', { lobbyId, player });
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

    startCombat(lobbyId: string, currentPlayer: Player, opponent: Player): void {
        this.socket.emit('startBattle', { lobbyId, currentPlayer, opponent });
    }

    onStartCombat(): Observable<{ firstPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on('startCombat', (data) => {
                observer.next(data);
            });
        });
    }

    onCombatEnded(): Observable<{ loser: Player }> {
        return new Observable((observer) => {
            this.socket.on('combatEnded', (data) => {
                observer.next(data);
            });
        });
    }

    onGameOver(): Observable<{ winner: string }> {
        return new Observable((observer) => {
            this.socket.on('gameOver', (data) => {
                observer.next(data);
            });
        });
    }

    teamCreated(): Observable<{ team1Server: Player[]; team2Server: Player[]; updatedGameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on('teamsCreated', (data) => {
                observer.next(data);
            });
        });
    }

    onFleeSuccess(): Observable<{ fleeingPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on('fleeSuccess', (data) => {
                observer.next(data);
            });
        });
    }

    onFleeFailure(): Observable<{ fleeingPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on('fleeFailure', (data) => {
                observer.next(data);
            });
        });
    }

    onInventoryFull(): Observable<{ item: number; currentInventory: number[] }> {
        return new Observable((observer) => {
            this.socket.on('inventoryFull', (data) => {
                observer.next(data);
            });
        });
    }
    resolveInventory(lobbyId: string, keptItems: number[]) {
        this.socket.emit('resolveInventory', { lobbyId, keptItems });
    }

    cancelInventoryChoice(lobbyId: string): void {
        this.socket.emit('cancelInventoryChoice', { lobbyId });
    }
    onBoardModified(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on('boardModified', (data) => {
                observer.next(data);
            });
        });
    }

    openDoor(lobbyId: string, tile: Tile): void {
        this.socket.emit('openDoor', { lobbyId, tile });
    }

    closeDoor(lobbyId: string, tile: Tile): void {
        this.socket.emit('closeDoor', { lobbyId, tile });
    }

    createTeams(lobbyId: string, players: Player[]): void {
        this.socket.emit('createTeams', { lobbyId, players });
    }
}
