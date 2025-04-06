/* eslint-disable max-lines */
import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { Coordinates } from '@common/coordinates';
import { GameEvents } from '@common/events';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { ObjectsTypes, Tile, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { ItemService } from './item.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';
import { PathfindingService } from './pathfinding.service';

@Service()
export class GameSocketHandlerService {
    private io: Server;
    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
        private lobbySocketHandlerService: LobbySocketHandlerService,
        private pathfindingService: PathfindingService,
        private itemService: ItemService,
    ) {
        this.itemService = new ItemService(this.pathfindingService);
    }
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

    async handleRequestMovement(socket: Socket, lobbyId: string, coordinates: Coordinates[]) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        const indexPlayer = gameState.players.findIndex((p) => p.id === socket.id);
        const currentPlayer = gameState.players[indexPlayer];
        if (!gameState) return;

        try {
            let updatedGameState = gameState;
            if (coordinates.length > 1) {
                updatedGameState.animation = true;
            }

            for (const [idx, coordinate] of coordinates.entries()) {
                if (!idx) {
                    continue;
                }
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
                        const winningTeam = gameState.teams.team1.some((p) => p.id === currentPlayer.id) ? 'Red' : 'Blue';
                        const winningTeamPlayers =
                            winningTeam === 'Red'
                                ? (gameState.teams?.team1?.map((p) => p.name).join(', ') ?? 'Unknown')
                                : (gameState.teams?.team2?.map((p) => p.name).join(', ') ?? 'Unknown');

                        this.io.to(lobbyId).emit('gameOver', { winner: winningTeamPlayers });
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

            this.io.to(lobbyId).emit(GameEvents.TurnStarted, { gameState: updatedGameState });
        } catch (error) {
            this.io.to(lobbyId).emit(GameEvents.Error, `${gameSocketMessages.turnError}${error.message}`);
        }
    }

    closeDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        gameState.board = gameState.board.map((row) => [...row]);
        gameState.board[tile.x][tile.y] = TileTypes.DoorClosed;
        gameState.currentPlayerActionPoints = 0;
        if (currentPlayerIndex !== -1) {
            gameState.players[currentPlayerIndex].currentAP = 0;
        }
        const newGameState = this.boardService.handleBoardChange(gameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    openDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        gameState.board = gameState.board.map((row) => [...row]);
        gameState.board[tile.x][tile.y] = TileTypes.DoorOpen;
        gameState.currentPlayerActionPoints = 0;
        if (currentPlayerIndex !== -1) {
            gameState.players[currentPlayerIndex].currentAP = 0;
        }
        const newGameState = this.boardService.handleBoardChange(gameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
    }

    startBattle(lobbyId: string, currentPlayer: Player, opponent: Player) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        if (gameState.gameMode === 'capture') {
            const isSameTeam =
                (gameState.teams.team1.some((p) => p.id === currentPlayer.id) && gameState.teams.team1.some((p) => p.id === opponent.id)) ||
                (gameState.teams.team2.some((p) => p.id === currentPlayer.id) && gameState.teams.team2.some((p) => p.id === opponent.id));
            if (isSameTeam) {
                this.io.to(currentPlayer.id).to(opponent.id).emit(GameEvents.Error, gameSocketMessages.sameTeam);
                return;
            }
        }
        gameState.currentPlayerActionPoints = 0;
        currentPlayer.amountEscape = 0;
        opponent.amountEscape = 0;
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id);
        const opponentIndex = gameState.players.findIndex((p) => p.id === opponent.id);

        if (currentPlayerIndex !== -1) {
            gameState.players[currentPlayerIndex].amountEscape = 0;
            gameState.players[currentPlayerIndex].currentAP = 0;
        }
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

        if (this.isPlayerOnIceTile(gameState, attacker)) {
            attackDice -= 2;
        }

        if (this.isPlayerOnIceTile(gameState, defender)) {
            defenseDice -= 2;
        }

        if (gameState.debug) {
            attackDice = attacker.attack;
            defenseDice = 1;
        }
        const damage = Math.max(0, attackDice + attacker.attack - defenseDice - defender.defense);

        this.itemService.applyPotionEffect(attacker, defender);

        if (damage > 0) {
            defender.life -= damage;
        }

        this.itemService.applyJuiceEffect(defender);

        if (defender.life <= 0) {
            attacker.winCount += 1;
            for (const player of gameState.players) {
                player.amountEscape = 0;
            }
            if (attacker.winCount === GameSocketConstants.MaxWinCount) {
                this.io.to(lobbyId).emit('gameOver', { winner: attacker.name });
                return;
            }
            this.handleDefeat(lobbyId, attacker, defender);
            // eslint-disable-next-line max-lines
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
    getGameStateOrEmitError(socket: Socket, lobbyId: string): GameState | null {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit(GameEvents.Error, gameSocketMessages.gameNotFound);
            return null;
        }
        return gameState;
    }

    private async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
        // eslint-disable-next-line max-lines
    }

    private getDiceValue(playerDice: string): number {
        if (playerDice === 'D4') {
            return GameSocketConstants.D4Value;
        }
        if (playerDice === 'D6') {
            return GameSocketConstants.D6Value;
        }
        return 0;
    }

    private isPlayerOnIceTile(gameState: GameState, player: Player): boolean {
        const playerIndex = gameState.players.findIndex((p) => p.id === player.id);
        if (playerIndex === -1) return false;
        const position = gameState.playerPositions[playerIndex];
        if (!position || position.x >= gameState.board.length || position.y >= gameState.board[0].length) return false;

        const tile = gameState.board[position.x][position.y];
        return tile === TileTypes.Ice;
    }
}
