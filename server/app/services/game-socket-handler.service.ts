import { gameSocketMessages } from '@app/constants/game-socket-handler-const';
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
import { PathfindingService } from './pathfinding.service';

const ANIMATION_DELAY_MS = 150;
const MAX_WIN_COUNT = 3;
const FLEE_RATE_PERCENT = 30;
const D4_VALUE = 4;
const D6_VALUE = 6;
// const MAX_ESCAPE_ATTEMPTS = 2;
const MAX_FLEE = 100;
@Service()
export class GameSocketHandlerService {
    private io: Server;
    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
        private lobbySocketHandlerService: LobbySocketHandlerService,
        private pathfindingService: PathfindingService,
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
                }, ANIMATION_DELAY_MS);
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
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        const newGameBoard = gameState.board.map((row) => [...row]);
        newGameBoard[tile.x][tile.y] = TileTypes.DoorClosed;
        const updatedGameState: GameState = {
            ...gameState,
            board: newGameBoard,
            currentPlayerActionPoints: 0,
        };

        updatedGameState.players[currentPlayerIndex].currentAP = 0;
        const newGameState = this.boardService.handleBoardChange(updatedGameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    openDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        const newGameBoard = gameState.board.map((row) => [...row]);
        newGameBoard[tile.x][tile.y] = TileTypes.DoorOpen;
        const updatedGameState = {
            ...gameState,
            board: newGameBoard,
            currentPlayerActionPoints: 0,
        };

        updatedGameState.players[currentPlayerIndex].currentAP = 0;

        const newGameState = this.boardService.handleBoardChange(updatedGameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    startBattle(lobbyId: string, currentPlayer: Player, opponent: Player) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        currentPlayer.amountEscape = 0;
        opponent.amountEscape = 0;

        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id);
        const opponentIndex = gameState.players.findIndex((p) => p.id === opponent.id);

        if (currentPlayerIndex !== -1) gameState.players[currentPlayerIndex].amountEscape = 0;
        if (opponentIndex !== -1) gameState.players[opponentIndex].amountEscape = 0;

        let firstPlayer = currentPlayer;
        if (opponent.speed > currentPlayer.speed) {
            firstPlayer = opponent;
        } else if (opponent.speed === currentPlayer.speed) {
            firstPlayer = currentPlayer;
        }
        this.io.to(currentPlayer.id).to(opponent.id).emit('startCombat', { firstPlayer });
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
        const isInSpawnPoints = originalSpawn === gameState.playerPositions[loserIndex];
        const occupiedPositions = new Set(gameState.playerPositions.map((pos) => JSON.stringify(pos)));
        let newSpawn = originalSpawn;

        if (!isInSpawnPoints && occupiedPositions.has(JSON.stringify(originalSpawn))) {
            newSpawn = this.pathfindingService.findClosestAvailableSpot(gameState, originalSpawn);
        }

        winner.life = winner.maxLife;
        loser.life = loser.maxLife;

        gameState.playerPositions[loserIndex] = newSpawn;
        gameState.currentPlayerActionPoints = 0;
        let newGameState = gameState;
        if (loser.id === gameState.currentPlayer) {
            newGameState = this.handleEndTurnInternally(gameState);
        } else {
            newGameState = this.boardService.handleTurn(gameState);
        }
        newGameState.players[winnerIndex] = winner;
        newGameState.players[winnerIndex].currentAP = 0;
        newGameState.players[loserIndex] = loser;
        this.gameStates.set(lobbyId, newGameState);

        this.io.to(lobbyId).emit('combatEnded', { loser });
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
        let attackDice = Math.floor(Math.random() * this.getDiceValue(attacker.bonus.attack)) + 1;
        let defenseDice = Math.floor(Math.random() * this.getDiceValue(defender.bonus.defense)) + 1;

        if (gameState.debug) {
            attackDice = attacker.attack;
            defenseDice = 1;
        }

        if (this.isPlayerOnIceTile(gameState, attacker)) {
            attackDice -= 2;
        }

        if (this.isPlayerOnIceTile(gameState, defender)) {
            defenseDice -= 2;
        }
        const damage = Math.max(0, attackDice + attacker.attack - defenseDice - defender.defense);

        if (damage > 0) {
            defender.life -= damage;
        }

        if (defender.life <= 0) {
            attacker.winCount += 1;
            if (attacker.winCount === MAX_WIN_COUNT) {
                this.io.to(lobbyId).emit('gameOver', { winner: attacker.name });
                return;
            }
            this.handleDefeat(lobbyId, attacker, defender);
            return;
        }
        this.io.to(lobbyId).emit('attackResult', {
            attackRoll: attackDice + attacker.attack,
            defenseRoll: defenseDice + defender.defense,
            attackerHP: attacker.life,
            defenderHP: defender.life,
            damage,
            attacker,
            defender,
        });
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

        const FLEE_RATE = FLEE_RATE_PERCENT;
        const isSuccessful = Math.random() * MAX_FLEE <= FLEE_RATE;

        const opponent = gameState.players.find((p) => p.id !== fleeingPlayer.id);
        if (opponent) {
            // eslint-disable-next-line max-lines
            gameState.currentPlayer = opponent.id;
        }

        if (isSuccessful) {
            this.io.to(lobbyId).emit(GameEvents.FleeSuccess, { fleeingPlayer, isSuccessful });
        } else {
            this.io.to(lobbyId).emit(GameEvents.FleeFailure, { fleeingPlayer });
        }

        this.gameStates.set(lobbyId, gameState);
    }

    private getDiceValue(playerDice: string): number {
        if (playerDice === 'D4') {
            return D4_VALUE;
        }
        if (playerDice === 'D6') {
            return D6_VALUE;
        }
        return 0;
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
