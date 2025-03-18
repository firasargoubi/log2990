import { GameSocketConstants, gameSocketMessages } from '@app/constants/gameSocketHandlerConst';
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
                    this.io.to(lobbyId).emit('movementProcessed', { gameState: updatedGameState });
                    if (updatedGameState.availableMoves.length === 0) {
                        this.handleEndTurn(socket, lobbyId);
                    }
                }, 150);
            }
            updatedGameState.animation = false;
            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit(GameEvents.MovementProcessed, { gameState });

        } catch (error) {
            socket.emit(GameEvents.Error, `${gameSocketMessages.movementError}${error.message}`);
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

    startBattle(socket: Socket, currentPlayer: Player, opponent: Player, gameState: GameState) {
        const currentIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id);
        const opponentIndex = gameState.players.findIndex((p) => p.id === opponent.id);
        const playerTurn = currentIndex < opponentIndex ? currentPlayer.id : opponent.id;
        const player = gameState.players.find((p) => p.id === playerTurn);
        const countDown = player.amountEscape === 2 ? GameSocketConstants.EscapeCountdown : GameSocketConstants.DefaultCountdown;
        this.io.to(currentPlayer.id).to(opponent.id).emit(GameEvents.PlayerTurn, { playerTurn, countDown });
    }

    changeTurnEnd(currentPlayer: Player, opponent: Player, playerTurn: string, gameState: GameState) {
        const player = gameState.players.find((p) => p.id === playerTurn);
        const newPlayerTurn = player.id === currentPlayer.id ? opponent.id : currentPlayer.id;
        const newPlayer = gameState.players.find((p) => p.id === newPlayerTurn);
        const countDown = newPlayer.amountEscape === 2 ? GameSocketConstants.EscapeCountdown : GameSocketConstants.DefaultCountdown;
        this.io.to(currentPlayer.id).to(opponent.id).emit(GameEvents.PlayerSwitch, { newPlayerTurn, countDown });
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
        this.io.to(lobbyId).emit(GameEvents.ChangedSpawn, { player, newSpawn });
    }

    handleAttackAction(lobbyId: string, opponent: Player, damage: number) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        const opponentGame = gameState.players.find((p) => p.id === opponent.id);
        if (!opponentGame) return;
        if (damage > 0) {
            opponentGame.life -= damage;
        }
        this.io.to(lobbyId).emit(GameEvents.UpdateHealth, { player: opponentGame, remainingHealth: opponentGame.life });
    }

    handleFlee(lobbyId: string, fleeingPlayer: Player, success: boolean) {
        if (success) {
            this.io.to(lobbyId).emit(GameEvents.FleeSuccess, { fleeingPlayer });
        } else {
            const player = this.gameStates.get(lobbyId).players.find((p) => p.id === fleeingPlayer.id);
            if (isNaN(player.amountEscape)) {
                player.amountEscape = 0;
            }
            player.amountEscape++;
            this.io.to(lobbyId).emit(GameEvents.FleeFailure, { fleeingPlayer: player });
        }
    }

    handleTerminateAttack(lobbyId: string) {
        const isInCombat = false;
        this.io.to(lobbyId).emit(GameEvents.AttackEnd, { isInCombat });
    }
    private getGameStateOrEmitError(socket: Socket, lobbyId: string): GameState | null {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit(GameEvents.Error, gameSocketMessages.gameNotFound);
            return null;
        }
        return gameState;
    }
}

function isTileValid(tile: Coordinates, gameState: GameState, occupiedPositions: Set<string>): boolean {
    const isOccupiedByPlayer = occupiedPositions.has(JSON.stringify(tile));
    const isGrassTile = gameState.board[tile.x]?.[tile.y] === 0;
    return !isOccupiedByPlayer && isGrassTile;
}

// Calculer la distance entre deux points (Manhattan)
// function getDistance(a: Coordinates, b: Coordinates): number {
//     return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
// }

function isWithinBounds(tile: Coordinates, board: number[][]): boolean {
    if (tile.y < 0 || tile.y >= board.length) return false;
    const row = board[tile.y];
    return tile.x >= 0 && tile.x < row.length;
}
