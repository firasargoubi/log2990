import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { GameEvents } from '@common/events';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { TILE_DELIMITER } from '@common/game.interface';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { ItemService } from './item.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';
import { PathfindingService } from './pathfinding.service';

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
        private itemService: ItemService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    async handleRequestStart(socket: Socket, lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        const gameState = await this.boardService.initializeGameState(lobby);
        if (!lobby) {
            socket.emit(GameEvents.Error, gameSocketMessages.lobbyNotFound);
            return;
        }
        const player = lobby.players.find((p) => p.id === socket.id);
        if (!player || !player.isHost) {
            socket.emit(GameEvents.Error, gameSocketMessages.onlyHostStart);
            return;
        }

        if (gameState.gameMode === 'capture') {
            if (lobby.players.length % 2 !== 0) {
                socket.emit(GameEvents.Error, gameSocketMessages.notEnoughPlayers);
                return;
            }
        }
        try {
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

        winner.life = winner.maxLife;
        loser.life = loser.maxLife;

        this.itemService.dropItems(loserIndex, gameState);
        gameState.playerPositions[loserIndex] = newSpawn;
        loser.items = [];
        gameState.players[loserIndex] = loser;
        gameState.currentPlayerActionPoints = 0;
        gameState.players[winnerIndex] = winner;
        gameState.players[winnerIndex].currentAP = 0;
        this.io.to(lobbyId).emit('combatEnded', { loser });

        let newGameState;
        if (loser.id === gameState.currentPlayer) {
            newGameState = this.boardService.handleEndTurn(gameState);
            this.startTurn(lobbyId);
            return;
        }
        newGameState = this.boardService.handleTurn(gameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });

        this.gameStates.set(lobbyId, newGameState);
    }

    handleFlee(lobbyId: string, fleeingPlayer: Player) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        fleeingPlayer.amountEscape = fleeingPlayer.amountEscape ?? 0;

        if (fleeingPlayer.amountEscape >= 2) {
            this.io.to(lobbyId).emit(GameEvents.FleeFailure, { fleeingPlayer });
            return;
        }

        fleeingPlayer.amountEscape++;

        const playerIndex = gameState.players.findIndex((p) => p.id === fleeingPlayer.id);
        if (playerIndex !== -1) {
            gameState.players[playerIndex].amountEscape = fleeingPlayer.amountEscape;
        }

        const FLEE_RATE = GameSocketConstants.FleeRatePercent;
        let isSuccessful = Math.random() * GameSocketConstants.MaxFlee <= FLEE_RATE;
        if (gameState.debug) {
            isSuccessful = true;
        }

        if (isSuccessful) {
            for (const player of gameState.players) {
                player.amountEscape = 0;
            }
            this.gameStates.set(lobbyId, gameState);
            this.io.to(lobbyId).emit(GameEvents.FleeSuccess, { fleeingPlayer, isSuccessful });
            this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState });
        } else {
            this.io.to(lobbyId).emit(GameEvents.FleeFailure, { fleeingPlayer });
        }
        this.gameStates.set(lobbyId, gameState);
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
}
