/* eslint-disable max-params */
import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { Coordinates } from '@common/coordinates';
import { GameEvents } from '@common/events';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { ObjectsTypes, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { GameActionService } from './game-action.service';
import { ItemService } from './item.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';
import { PathfindingService } from './pathfinding.service';
import { VirtualPlayerService } from './virtual-player.service';

const TILE_DOOR_OPEN = 3;
@Service()
export class GameLifecycleService {
    private io: Server;
    // eslint-disable-next-line max-params
    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
        private lobbySocketHandlerService: LobbySocketHandlerService,
        private pathfindingService: PathfindingService,
        private virtualService: VirtualPlayerService,
        private gameActionService: GameActionService,
        private itemService: ItemService,
    ) {
        this.gameActionService.setGameLifecycleService(this);
    }

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
            gameState.amountDoors =
                gameState.board.flat().filter((boardTile) => boardTile === TileTypes.DoorClosed).length +
                gameState.board.flat().filter((boardTile) => boardTile === TileTypes.DoorOpen).length;

            if (gameState.gameMode === 'capture' && lobby.players.length % 2 !== 0) {
                socket.emit(GameEvents.Error, gameSocketMessages.notEnoughPlayers);
                return;
            }

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

            this.startTurn(lobbyId);
        } catch (error) {
            socket.emit(GameEvents.Error, `${gameSocketMessages.failedEndTurn} ${error.message}`);
        }
    }

    startTurn(lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        try {
            const updatedGameState = this.boardService.handleTurn(gameState);

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit(GameEvents.TurnStarted, { gameState: updatedGameState });

            const currentPlayer = updatedGameState.players.find((p) => p.id === updatedGameState.currentPlayer);
            if (currentPlayer && currentPlayer.virtualPlayerData) {
                this.virtualService.handleVirtualMovement({
                    lobbyId,
                    virtualPlayer: currentPlayer,
                    getGameState: () => this.gameStates.get(lobbyId),
                    boardService: this.boardService,
                    callbacks: {
                        handleRequestMovement: this.handleRequestMovement.bind(this),
                        handleEndTurn: this.handleEndTurn.bind(this),
                        startBattle: this.gameActionService.startBattle.bind(this.gameActionService),
                        delay: this.delay,
                        handleOpenDoor: this.openDoor.bind(this),
                    },
                    gameState: updatedGameState,
                });
            }
        } catch (error) {
            this.io.to(lobbyId).emit(GameEvents.Error, `${gameSocketMessages.turnError}${error.message}`);
        }
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

    handleDefeat(lobbyId: string, winner: Player, loser: Player) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        const winnerIndex = gameState.players.findIndex((p) => p.id === winner.id);
        const loserIndex = gameState.players.findIndex((p) => p.id === loser.id);
        if (winnerIndex === -1 || loserIndex === -1) return;

        const originalSpawn = gameState.spawnPoints[loserIndex];
        const isInSpawnPoints = JSON.stringify(originalSpawn) === JSON.stringify(gameState.playerPositions[loserIndex]);
        const occupiedPositions = new Set(gameState.playerPositions.map((pos) => JSON.stringify(pos)));
        let newSpawn = originalSpawn;

        if (!isInSpawnPoints && occupiedPositions.has(JSON.stringify(originalSpawn))) {
            newSpawn = this.pathfindingService.findClosestAvailableSpot(gameState, originalSpawn);
        }
        loser.life = loser.maxLife;
        this.itemService.dropItems(loserIndex, gameState);
        loser.items = [];
        gameState.playerPositions[loserIndex] = newSpawn;
        gameState.players[loserIndex] = loser;

        winner.life = winner.maxLife;
        winner.currentAP = 0;
        gameState.players[winnerIndex] = winner;

        this.io.to(lobbyId).emit('combatEnded', { loser });

        const updatedWinner = gameState.players[winnerIndex];
        const winnerIsVirtual = !!updatedWinner.virtualPlayerData;
        const winnerHasMovementPoints = updatedWinner.currentMP > 0;

        if (winnerIsVirtual) {
            if (winnerHasMovementPoints) {
                const virtualMoveConfig: VirtualMovementConfig = {
                    lobbyId,
                    virtualPlayer: updatedWinner,
                    getGameState: () => this.gameStates.get(lobbyId),
                    boardService: this.boardService,
                    callbacks: {
                        handleRequestMovement: this.handleRequestMovement.bind(this),
                        handleEndTurn: this.handleEndTurn.bind(this),
                        startBattle: this.gameActionService.startBattle.bind(this.gameActionService),
                        delay: this.delay,
                        handleOpenDoor: this.openDoor.bind(this),
                    },
                    gameState,
                };
                this.virtualService.performTurn(() => {
                    this.virtualService.handleVirtualMovement(virtualMoveConfig);
                });
                return;
            } else {
                const endedTurnState = this.boardService.handleEndTurn(gameState);
                this.gameStates.set(lobbyId, endedTurnState);
                this.startTurn(lobbyId);
                return;
            }
        }

        let newGameState;
        if (loser.id === gameState.currentPlayer) {
            newGameState = this.boardService.handleEndTurn(gameState);
            this.gameStates.set(lobbyId, newGameState);
            this.startTurn(lobbyId);
            return;
        }

        newGameState = this.boardService.handleTurn(gameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
        this.gameStates.set(lobbyId, newGameState);
    }

    async handleRequestMovement(socket: Socket, lobbyId: string, coordinates: Coordinates[]) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;
        const indexPlayer = gameState.players.findIndex((p) => p.id === socket.id);
        const currentPlayer = gameState.players[indexPlayer];
        try {
            let updatedGameState = gameState;
            if (coordinates.length > 1) {
                updatedGameState.animation = true;
            }
            for (const [idx, coordinate] of coordinates.entries()) {
                if (!idx) {
                    continue;
                }
                this.updateVisitedTiles(currentPlayer, coordinate);
                const result = this.boardService.handleMovement(updatedGameState, coordinate);
                updatedGameState = result.gameState;
                updatedGameState = this.boardService.updatePlayerMoves(updatedGameState);

                if (result.shouldStop) {
                    if (currentPlayer.pendingItem !== 0) {
                        this.handleInventoryFull(updatedGameState, currentPlayer, socket, lobbyId);
                        return;
                    }
                    updatedGameState.animation = false;
                    this.gameStates.set(lobbyId, updatedGameState);
                    this.io.to(lobbyId).emit('movementProcessed', { gameState: updatedGameState });
                    return;
                }

                if (idx === coordinates.length - 1) {
                    const hasFlag = currentPlayer.items?.includes(ObjectsTypes.FLAG);
                    const originalSpawn = gameState.spawnPoints[indexPlayer];
                    const isInSpawnPoints = JSON.stringify(originalSpawn) === JSON.stringify(gameState.playerPositions[indexPlayer]);
                    updatedGameState.animation = false;
                    if (hasFlag && isInSpawnPoints) {
                        gameState.endDate = new Date();
                        const winningTeam = gameState.teams.team1.some((p) => p.id === currentPlayer.id) ? 'Red' : 'Blue';
                        const winningTeamPlayers =
                            winningTeam === 'Red'
                                ? (gameState.teams?.team1?.map((p) => p.name).join(', ') ?? 'Unknown')
                                : (gameState.teams?.team2?.map((p) => p.name).join(', ') ?? 'Unknown');

                        this.io.to(lobbyId).emit('gameOver', { winner: winningTeamPlayers, lobby: lobbyId, finalGameState: gameState });
                    }
                }

                this.gameStates.set(lobbyId, updatedGameState);
                this.io.to(lobbyId).emit('movementProcessed', { gameState: updatedGameState });

                await this.delay(GameSocketConstants.AnimationDelayMs);
            }
        } catch (error) {
            socket.emit(GameEvents.Error, `${gameSocketMessages.movementError}${error.message}`);
        }
    }

    handleInventoryFull(updatedGameState: GameState, currentPlayer: Player, socket: Socket, lobbyId: string) {
        socket.emit('inventoryFull', {
            item: currentPlayer.pendingItem,
            currentInventory: [...currentPlayer.items],
        });
        updatedGameState.animation = false;
        this.gameStates.set(lobbyId, updatedGameState);
        this.io.to(lobbyId).emit('movementProcessed', { gameState: updatedGameState });
    }

    createTeams(lobbyId: string, players: Player[]) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        if (gameState.teams) {
            return;
        }
        const shuffledPlayers = [...players].sort(() => Math.random() - GameSocketConstants.PlayerTeamConst);
        const half = Math.ceil(players.length / 2);
        const team1Server: Player[] = shuffledPlayers.slice(0, half).map((player) => ({ ...player, team: 'Red' }));
        const team2Server: Player[] = shuffledPlayers.slice(half).map((player) => ({ ...player, team: 'Blue' }));
        const updatedGameState = {
            ...gameState,
            teams: {
                team1: team1Server,
                team2: team2Server,
            },
        };
        this.gameStates.set(lobbyId, updatedGameState);
        this.io.to(lobbyId).emit(GameEvents.TeamsCreated, { team1Server, team2Server, updatedGameState });
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

    getGameStateOrEmitError(socket: Socket, lobbyId: string): GameState | null {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit(GameEvents.Error, gameSocketMessages.gameNotFound);
            return null;
        }
        return gameState;
    }

    openDoor(socket: Socket, tile: { x: number; y: number }, lobbyId: string): void {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        gameState.board = gameState.board.map((row) => [...row]);
        gameState.board[tile.x][tile.y] = (gameState.board[tile.x][tile.y] % TILE_DELIMITER) + TILE_DOOR_OPEN;
        gameState.currentPlayerActionPoints = 0;
        if (currentPlayerIndex !== -1) {
            gameState.players[currentPlayerIndex].currentAP = 0;
        }
        const newGameState = this.boardService.handleBoardChange(gameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    private async delay(ms: number): Promise<void> {
        return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    private updateVisitedTiles(player: Player, coordinates: { x: number; y: number }) {
        if (!player.visitedTiles) {
            player.visitedTiles = [];
        }

        if (!player.visitedTiles.some((tile) => tile.x === coordinates.x && tile.y === coordinates.y)) {
            player.visitedTiles.push(coordinates);
        }
    }
}
