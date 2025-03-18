import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-constants';
import { Coordinates } from '@common/coordinates';
import { GameEvents } from '@common/events';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Tile, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';
@Service()
export class GameSocketHandlerService {
    private io: Server;
    private combatTimes: Map<string, number> = new Map<string, number>();
    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
        private lobbySocketHandlerService: LobbySocketHandlerService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    async handleRequestStart(socket: Socket, lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit(GameEvents.Error, gameSocketMessages.lobbyNotFound);
            return;
        }

        const player = lobby.players.find((p) => p.id === socket.id);
        if (!player || !player.isHost) {
            socket.emit(GameEvents.Error, gameSocketMessages.onlyHostStart);
            return;
        }

        try {
            const gameState = await this.boardService.initializeGameState(lobby);

            this.gameStates.set(lobbyId, gameState);

            lobby.isLocked = true;
            this.lobbySocketHandlerService.updateLobby(lobbyId);

            this.io.to(lobbyId).emit(GameEvents.GameStarted, { gameState });

            this.startTurn(lobbyId);
        } catch (error) {
            socket.emit(GameEvents.Error, `${gameSocketMessages.failedStartGame} ${error.message}`);
        }
    }

    handleEndTurn(socket: Socket, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit(GameEvents.Error, gameSocketMessages.gameNotFound);
            return;
        }

        if (socket.id !== gameState.currentPlayer) {
            socket.emit(GameEvents.Error, gameSocketMessages.notYourTurn);
            return;
        }

        try {
            const updatedGameState = this.boardService.handleEndTurn(gameState);

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit(GameEvents.TurnEnded, { gameState });

            this.startTurn(lobbyId);
        } catch (error) {
            socket.emit(GameEvents.Error, `${gameSocketMessages.failedEndTurn} ${error.message}`);
        }
    }

    handleRequestMovement(socket: Socket, lobbyId: string, coordinates: Coordinates[]) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;

        try {
            let updatedGameState = gameState;
            updatedGameState.animation = true;
            for (const [idx, coordinate] of coordinates.entries()) {
                setTimeout(() => {
                    updatedGameState = this.boardService.handleMovement(updatedGameState, coordinate);
                    if (idx === coordinates.length - 1) {
                        updatedGameState.animation = false;
                    }
                    this.gameStates.set(lobbyId, updatedGameState);
                    this.io.to(lobbyId).emit('movementProcessed', { gameState: updatedGameState });
                    if (updatedGameState.availableMoves.length === 0) {
                        this.handleEndTurn(socket, lobbyId);
                    }
                }, 150);
            }
        } catch (error) {
            socket.emit(GameEvents.Error, `${gameSocketMessages.movementError}${error.message}`);
        }
    }

    handleTeleport(socket: Socket, lobbyId: string, coordinates: Coordinates) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }
        try {
            const updatedGameState = this.boardService.handleTeleport(gameState, coordinates);
            this.gameStates.set(lobbyId, updatedGameState);
            this.io.to(lobbyId).emit('boardModified', { gameState: updatedGameState });
        } catch (error) {
            socket.emit('error', `Teleport error: ${error.message}`);
        }
    }
    startTurn(lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        try {
            const updatedGameState = this.boardService.handleTurn(gameState);

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit(GameEvents.TurnStarted, { gameState });
        } catch (error) {
            this.io.to(lobbyId).emit(GameEvents.Error, `${gameSocketMessages.turnError}${error.message}`);
        }
    }

    handleEndTurnInternally(gameState: GameState): GameState {
        return this.boardService.handleEndTurn(gameState);
    }

    closeDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;
        const newGameBoard = gameState.board.map((row) => [...row]);
        newGameBoard[tile.x][tile.y] = TileTypes.DoorClosed;
        const updatedGameState: GameState = {
            ...gameState,
            board: newGameBoard,
            currentPlayerActionPoints: 0,
        };
        const newGameState = this.boardService.handleBoardChange(updatedGameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    openDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;
        const newGameBoard = gameState.board.map((row) => [...row]);
        newGameBoard[tile.x][tile.y] = TileTypes.DoorOpen;
        const updatedGameState = {
            ...gameState,
            board: newGameBoard,
            currentPlayerActionPoints: 0,
        };

        const newGameState = this.boardService.handleBoardChange(updatedGameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    initializeBattle(socket: Socket, currentPlayer: Player, opponent: Player) {
        this.io.to(currentPlayer.id).to(opponent.id).emit(GameEvents.PlayersBattling, { isInCombat: true });
    }

    startBattle(lobbyId: string, currentPlayer: Player, opponent: Player, time: number) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        currentPlayer.amountEscape = 0;
        opponent.amountEscape = 0;
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id);
        const opponentIndex = gameState.players.findIndex((p) => p.id === opponent.id);
        if (currentPlayerIndex !== -1) {
            gameState.players[currentPlayerIndex].amountEscape = 0;
        }
        if (opponentIndex !== -1) {
            gameState.players[opponentIndex].amountEscape = 0;
        }

        this.combatTimes.set(lobbyId, time);
        const playerTurn = currentPlayerIndex < opponentIndex ? currentPlayerIndex : opponentIndex;
        const firstPlayer = gameState.players[playerTurn];
        this.io.to(currentPlayer.id).to(opponent.id).emit('startCombat', { firstPlayer });
    }

    changeTurnEnd(currentPlayer: Player, opponent: Player, playerTurn: string, gameState: GameState) {
        const player = gameState.players.find((p) => p.id === playerTurn);
        const newPlayerTurn = player.id === currentPlayer.id ? opponent.id : currentPlayer.id;
        const newPlayer = gameState.players.find((p) => p.id === newPlayerTurn);
        const countDown = newPlayer.amountEscape === 2 ? GameSocketConstants.EscapeCountdown : GameSocketConstants.DefaultCountdown;

        this.io.to(currentPlayer.id).to(opponent.id).emit(GameEvents.PlayerSwitch, {
            newPlayerTurn,
            countDown,
            attackerId: newPlayerTurn,
            defenderId: playerTurn,
        });
    }

    handlePlayersUpdate(socket: Socket, lobbyId: string, players: Player[]) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;

        let deletedPlayer: Player | undefined;
        for (const player of gameState.players) {
            if (!players.find((p) => p.id === player.id)) {
                deletedPlayer = player;
            }
        }
        if (deletedPlayer) {
            const playerIndex = gameState.players.findIndex((p) => p.id === deletedPlayer.id);
            gameState.currentPlayer = gameState.players[(playerIndex + 1) % gameState.players.length].id;
            gameState.players.splice(playerIndex, 1);
            const spawnPoint = gameState.spawnPoints[playerIndex];
            gameState.board[spawnPoint.x][spawnPoint.y] = gameState.board[spawnPoint.x][spawnPoint.y] % TILE_DELIMITER;
            gameState.spawnPoints.splice(playerIndex, 1);
            gameState.playerPositions.splice(playerIndex, 1);
            if (!gameState.deletedPlayers) {
                gameState.deletedPlayers = [];
            }
            gameState.deletedPlayers.push(deletedPlayer);
        }
        const newGameState = this.boardService.handleBoardChange(gameState);
        this.gameStates.set(lobbyId, gameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    handleDefeat(player: Player, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        const playerIndex = gameState.players.findIndex((p) => p.id === player.id);
        if (playerIndex === -1) return;
        const originalSpawn = gameState.spawnPoints[playerIndex];
        const occupiedPositions = new Set(gameState.playerPositions.map((pos) => JSON.stringify(pos)));
        let newSpawn = originalSpawn;

        if (occupiedPositions.has(JSON.stringify(originalSpawn))) {
            const queue: Coordinates[] = [originalSpawn];
            const visited = new Set<string>();
            visited.add(JSON.stringify(originalSpawn));
            let queueStart = 0;
            let found = false;

            while (queueStart < queue.length && !found) {
                const current = queue[queueStart++];

                if (isTileValid(current, gameState, occupiedPositions)) {
                    newSpawn = current;
                    found = true;
                    break;
                }

                const directions = [
                    { x: -1, y: 0 },
                    { x: 1, y: 0 },
                    { x: 0, y: -1 },
                    { x: 0, y: 1 },
                ];

                for (const dir of directions) {
                    const neighbor = {
                        x: current.x + dir.x,
                        y: current.y + dir.y,
                    };

                    if (isWithinBounds(neighbor, gameState.board)) {
                        const neighborKey = JSON.stringify(neighbor);
                        if (!visited.has(neighborKey)) {
                            visited.add(neighborKey);
                            queue.push(neighbor);
                        }
                    }
                }
            }
        }

        gameState.playerPositions[playerIndex] = newSpawn;
        gameState.currentPlayerActionPoints = 0;
        let newGameState = gameState;
        if (player.id === gameState.currentPlayer) {
            newGameState = this.handleEndTurnInternally(gameState);
        } else {
            newGameState = this.boardService.handleTurn(gameState);
        }
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit('combatEnded', { winner: player });
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    handleSetDebug(socket: Socket, lobbyId: string, debug: boolean) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }

        const updatedGameState = {
            ...gameState,
            debug,
        };

        this.gameStates.set(lobbyId, updatedGameState);
        this.io.to(lobbyId).emit('boardModified', { gameState: updatedGameState });
    }

    handleAttackAction(lobbyId: string, attacker: Player, defender: Player) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        const attackerIndex = gameState.players.findIndex((p) => p.id === attacker.id);
        const defenderIndex = gameState.players.findIndex((p) => p.id === defender.id);
        if (attackerIndex === -1 || defenderIndex === -1) {
            return;
        }
        let attackDice;
        let defenseDice;

        if (gameState.debug) {
            attackDice = attacker.attack;
            defenseDice = defender.defense;
        } else {
            attackDice = Math.floor(Math.random() * attacker.attack) + 1;
            defenseDice = Math.floor(Math.random() * defender.defense) + 1;
        }

        if (this.isPlayerOnIceTile(gameState, attacker)) {
            attackDice -= 2;
        }

        if (this.isPlayerOnIceTile(gameState, defender)) {
            defenseDice -= 2;
        }
        const damage = Math.max(0, attackDice - defenseDice);

        if (damage > 0) {
            defender.life -= damage;
        }

        if (defender.life <= 0) {
            this.handleDefeat(defender, lobbyId);
            return;
        }
        this.io.to(lobbyId).emit('attackResult', {
            attackRoll: attackDice,
            defenseRoll: defenseDice,
            attackerHP: attacker.life,
            defenderHP: defender.life,
            damage,
            attacker,
            defender,
        });
    }

    handleFlee(lobbyId: string, fleeingPlayer: Player, forceSuccess: boolean = false) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        if (fleeingPlayer.amountEscape === undefined) {
            fleeingPlayer.amountEscape = 0;
        }
        if (fleeingPlayer.amountEscape >= 2 && !forceSuccess) {
            this.io.to(lobbyId).emit(GameEvents.FleeFailure, { fleeingPlayer });
            return;
        }

        fleeingPlayer.amountEscape++;

        const playerIndex = gameState.players.findIndex((p) => p.id === fleeingPlayer.id);
        if (playerIndex !== -1) {
            gameState.players[playerIndex].amountEscape = fleeingPlayer.amountEscape;
        }

        const FLEE_RATE = 30;
        const fleeingChance = Math.random() * 100;

        const isSuccessful = forceSuccess || fleeingChance <= FLEE_RATE;
        if (!isSuccessful) {
            this.io.to(lobbyId).emit('fleeFailure', { fleeingPlayer });
            return;
        }

        gameState.currentPlayerActionPoints = 0;
        this.gameStates.set(lobbyId, gameState);
        this.io.to(lobbyId).emit(GameEvents.FleeSuccess, { fleeingPlayer, isSuccessful });
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState });

        this.updateCombatPlayers(lobbyId);
    }

    handleTerminateAttack(lobbyId: string) {
        const isInCombat = false;
        this.io.to(lobbyId).emit(GameEvents.AttackEnd, { isInCombat });
    }

    updateCombatTime(lobbyId: string, timeLeft: number): void {
        this.io.to(lobbyId).emit('combatUpdate', { timeLeft });
    }

    updateCombatPlayers(lobbyId: string): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        this.io.to(lobbyId).emit('combatPlayersUpdate', {
            players: gameState.players,
        });
    }
    private getGameStateOrEmitError(socket: Socket, lobbyId: string): GameState | null {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit(GameEvents.Error, gameSocketMessages.gameNotFound);
            return null;
        }
        return gameState;
    }
    private isPlayerOnIceTile(gameState: GameState, player: Player): boolean {
        const playerIndex = gameState.players.findIndex((p) => p.id === player.id);
        if (playerIndex === -1) return false;
        const position = gameState.playerPositions[playerIndex];
        if (!position) return false;

        const tile = gameState.board[position.x][position.y];
        return tile === TileTypes.Ice;
    }
}
export function isTileValid(tile: Coordinates, gameState: GameState, occupiedPositions: Set<string>): boolean {
    const isOccupiedByPlayer = occupiedPositions.has(JSON.stringify(tile));
    const isGrassTile = gameState.board[tile.x]?.[tile.y] === 0;
    return !isOccupiedByPlayer && isGrassTile;
}
export function isWithinBounds(tile: Coordinates, board: number[][]): boolean {
    if (tile.y < 0 || tile.y >= board.length) return false;
    const row = board[tile.y];
    return tile.x >= 0 && tile.x < row.length;
}
