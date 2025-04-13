import { Injectable } from '@angular/core';
import { Coordinates } from '@common/coordinates';
import { GameEvents, LobbyEvents } from '@common/events';
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

    createLobby(game: Game): void {
        this.socket.emit(LobbyEvents.CreateLobby, game);
    }

    onLobbyCreated(): Observable<{ lobby: GameLobby }> {
        return new Observable((observer) => {
            this.socket.on(LobbyEvents.LobbyCreated, (data: { lobby: GameLobby }) => {
                observer.next(data);
            });
        });
    }

    joinLobby(lobbyId: string, player: Player): void {
        this.socket.emit(LobbyEvents.JoinLobby, { lobbyId, player });
    }

    leaveLobby(lobbyId: string, playerName: string): void {
        this.socket.emit(LobbyEvents.LeaveLobby, { lobbyId, playerName });
    }

    leaveGame(lobbyId: string, playerName: string): void {
        this.socket.emit(LobbyEvents.LeaveGame, lobbyId, playerName);
    }

    lockLobby(lobbyId: string): void {
        this.socket.emit(LobbyEvents.LockLobby, lobbyId);
    }

    disconnectFromRoom(lobbyId: string): void {
        this.socket.emit(LobbyEvents.DisconnectFromRoom, lobbyId);
    }

    updatePlayers(lobbyId: string, players: Player[]): void {
        this.socket.emit(LobbyEvents.UpdatePlayers, lobbyId, players);
    }

    onLobbyLocked(): Observable<{ lobbyId: string }> {
        return new Observable((observer) => {
            this.socket.on(LobbyEvents.LobbyLocked, (data: { lobbyId: string }) => {
                observer.next(data);
            });
        });
    }

    requestStartGame(lobbyId: string): void {
        this.socket.emit(LobbyEvents.RequestStart, lobbyId);
    }

    onGameStarted(): Observable<{ gameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.GameStarted, (data: { gameState: GameState }) => {
                observer.next(data);
            });
        });
    }

    onTurnStarted(): Observable<{ gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.TurnStarted, (data: { gameState: GameState; currentPlayer: string; availableMoves: Coordinates[] }) => {
                observer.next(data);
            });
        });
    }

    requestMovement(lobbyId: string, coordinates: Coordinates[]): void {
        this.socket.emit(LobbyEvents.RequestMovement, { lobbyId, coordinates });
    }

    requestTeleport(lobbyId: string, coordinates: Coordinates): void {
        this.socket.emit(LobbyEvents.Teleport, { lobbyId, coordinates });
    }

    onMovementProcessed(): Observable<{ gameState: GameState; playerMoved: string; newPosition: Coordinates }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.MovementProcessed, (data: { gameState: GameState; playerMoved: string; newPosition: Coordinates }) => {
                if (!data.gameState.availableMoves) {
                    data.gameState.availableMoves = [];
                }

                observer.next(data);
            });
        });
    }

    requestEndTurn(lobbyId: string): void {
        this.socket.emit(LobbyEvents.EndTurn, { lobbyId });
    }

    onBoardChanged(): Observable<{ gameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.BoardModified, (data: { gameState: GameState }) => {
                observer.next(data);
            });
        });
    }
    onError(): Observable<string> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.Error, (error: string) => {
                observer.next(error);
            });
        });
    }

    getLobby(lobbyId: string): Observable<GameLobby> {
        return new Observable((observer) => {
            this.socket.emit(LobbyEvents.GetLobby, lobbyId, (lobby: GameLobby) => {
                observer.next(lobby);
            });
        });
    }

    getGameId(lobbyId: string): Observable<string> {
        return new Observable((observer) => {
            this.socket.emit(LobbyEvents.GetGameId, lobbyId, (gameId: string) => {
                observer.next(gameId);
            });
        });
    }

    onLobbyUpdated(): Observable<{ lobby: GameLobby }> {
        return new Observable((observer) => {
            this.socket.on(LobbyEvents.LobbyUpdated, (data: { lobby: GameLobby }) => {
                observer.next(data);
            });
        });
    }

    setDebug(lobbyId: string, debug: boolean): void {
        this.socket.emit(LobbyEvents.SetDebug, { lobbyId, debug });
    }

    verifyRoom(gameId: string): Observable<{ exists: boolean; isLocked?: boolean }> {
        return new Observable((observer) => {
            this.socket.emit(LobbyEvents.VerifyRoom, { gameId }, (response: { exists: boolean; isLocked?: boolean }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }

    verifyAvatars(lobbyId: string): Observable<{ avatars: string[] }> {
        return new Observable((observer) => {
            this.socket.emit(LobbyEvents.VerifyAvatars, { lobbyId }, (response: { avatars: string[] }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }

    verifyUsername(lobbyId: string): Observable<{ usernames: string[] }> {
        return new Observable((observer) => {
            this.socket.emit(LobbyEvents.VerifyUsername, { lobbyId }, (response: { usernames: string[] }) => {
                observer.next(response);
                observer.complete();
            });
        });
    }

    onHostDisconnected(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.HostDisconnected, () => {
                observer.next();
            });
        });
    }

    handleDefeat(player: Player, lobbyId: string) {
        this.socket.emit(LobbyEvents.PlayerDefeated, { player, lobbyId });
    }

    attack(lobbyId: string, attacker: Player, defender: Player): void {
        this.socket.emit(LobbyEvents.Attack, { lobbyId, attacker, defender });
    }

    flee(lobbyId: string, player: Player, opponent: Player): void {
        this.socket.emit(LobbyEvents.Flee, { lobbyId, player, opponent });
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
            this.socket.on(GameEvents.AttackResult, (data) => {
                observer.next(data);
            });
        });
    }

    startCombat(lobbyId: string, currentPlayer: Player, opponent: Player): void {
        this.socket.emit(LobbyEvents.StartBattle, { lobbyId, currentPlayer, opponent });
    }

    onStartCombat(): Observable<{ firstPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.StartCombat, (data) => {
                observer.next(data);
            });
        });
    }

    onCombatEnded(): Observable<{ loser: Player }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.CombatEnded, (data) => {
                observer.next(data);
            });
        });
    }

    onGameOver(): Observable<{ winner: string }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.GameOver, (data) => {
                observer.next(data);
            });
        });
    }

    teamCreated(): Observable<{ team1Server: Player[]; team2Server: Player[]; updatedGameState: GameState }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.TeamsCreated, (data) => {
                observer.next(data);
            });
        });
    }

    onFleeSuccess(): Observable<{ fleeingPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.FleeSuccess, (data) => {
                observer.next(data);
            });
        });
    }

    onFleeFailure(): Observable<{ fleeingPlayer: Player }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.FleeFailure, (data) => {
                observer.next(data);
            });
        });
    }

    onEventLog(): Observable<{ gameState: GameState; eventType: string; involvedPlayers?: string[]; description?: string }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.EventLog, (data) => {
                observer.next(data);
            });
        });
    }

    onInventoryFull(): Observable<{ item: number; currentInventory: number[] }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.InventoryFull, (data) => {
                observer.next(data);
            });
        });
    }
    resolveInventory(lobbyId: string, keptItems: number[]) {
        this.socket.emit(LobbyEvents.ResolveInventory, { lobbyId, keptItems });
    }

    cancelInventoryChoice(lobbyId: string): void {
        this.socket.emit(LobbyEvents.CancelInventoryChoice, { lobbyId });
    }
    onBoardModified(): Observable<unknown> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.BoardModified, (data) => {
                observer.next(data);
            });
        });
    }

    openDoor(lobbyId: string, tile: Tile): void {
        this.socket.emit(LobbyEvents.OpenDoor, { lobbyId, tile });
    }

    closeDoor(lobbyId: string, tile: Tile): void {
        this.socket.emit(LobbyEvents.CloseDoor, { lobbyId, tile });
    }

    createTeams(lobbyId: string, players: Player[]): void {
        this.socket.emit(LobbyEvents.CreateTeams, { lobbyId, players });
    }

    joinLobbyMessage(lobbyId: string): void {
        if (this.socket.connected) {
            this.socket.emit(LobbyEvents.JoinLobby, lobbyId);
        } else {
            this.socket.once(GameEvents.Connect, () => {
                this.socket.emit(LobbyEvents.JoinLobby, lobbyId);
            });
        }
    }

    sendMessage(lobbyId: string, playerName: string, message: string): void {
        if (this.socket.connected) {
            this.socket.emit(LobbyEvents.SendMessage, {
                lobbyId,
                playerName,
                message,
            });
        }
    }

    onMessageReceived(): Observable<{ playerName: string; message: string }> {
        return new Observable((observer) => {
            this.socket.on(GameEvents.ChatMessage, (data: { playerName: string; message: string }) => {
                observer.next(data);
            });
        });
    }
}
