import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { Coordinates } from '@common/coordinates';
import { GameEvents } from '@common/events';
import { GameState } from '@common/game-state';
import { ObjectsTypes, Tile, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { GameLifecycleService } from './game-life-cycle.service';
import { ItemService } from './item.service';

@Service()
export class GameActionService {
    private io: Server;
    constructor(
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
        private itemService: ItemService,
        private gameLifeCycleService: GameLifecycleService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    async handleRequestMovement(socket: Socket, lobbyId: string, coordinates: Coordinates[]) {
        const gameState = this.gameLifeCycleService.getGameStateOrEmitError(socket, lobbyId);
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
    closeDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.gameLifeCycleService.getGameStateOrEmitError(socket, lobbyId);
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
        const gameState = this.gameLifeCycleService.getGameStateOrEmitError(socket, lobbyId);
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
            this.gameLifeCycleService.handleDefeat(lobbyId, attacker, defender);
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

    private async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
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
