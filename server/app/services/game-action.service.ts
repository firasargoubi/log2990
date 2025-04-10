import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { Coordinates } from '@common/coordinates';
import { GameEvents } from '@common/events';
import { GameState } from '@common/game-state';
import { Tile, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { GameLifecycleService } from './game-life-cycle.service';
import { ItemService } from './item.service';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';

@Service()
export class GameActionService {
    private io: Server;
    private gameLifeCycleService: GameLifecycleService;

    constructor(
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
        private itemService: ItemService,
        private virtualService: VirtualPlayerService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }
    setGameLifecycleService(service: GameLifecycleService) {
        this.gameLifeCycleService = service;
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

        if (firstPlayer.virtualPlayerData) {
            setTimeout(() => this.handleVirtualCombatTurn(lobbyId, firstPlayer, currentPlayer, opponent), GameSocketConstants.CombatTurnDelay);
        }
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

        const nextPlayer = defender;
        if (nextPlayer.virtualPlayerData) {
            gameState.currentPlayer = nextPlayer.id;
            this.gameStates.set(lobbyId, gameState);
            setTimeout(() => this.handleVirtualCombatTurn(lobbyId, nextPlayer, attacker, defender), GameSocketConstants.CombatTurnDelay);
        }
    }

    handleFlee(lobbyId: string, fleeingPlayer: Player): void {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        fleeingPlayer.amountEscape = fleeingPlayer.amountEscape ?? 0;

        if (fleeingPlayer.amountEscape >= 2) {
            this.io.to(lobbyId).emit(GameEvents.FleeFailure, { fleeingPlayer });
            const opponent = gameState.players.find((p) => p.id !== fleeingPlayer.id && p.life > 0);
            if (opponent && opponent.virtualPlayerData) {
                gameState.currentPlayer = opponent.id;
                this.gameStates.set(lobbyId, gameState);
                setTimeout(() => {
                    this.handleVirtualCombatTurn(lobbyId, opponent, fleeingPlayer, opponent);
                }, GameSocketConstants.CombatTurnDelay);
            }
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

            const opponent = gameState.players.find((p) => p.id !== fleeingPlayer.id && p.life > 0);
            if (opponent && opponent.virtualPlayerData && opponent.currentMP > 0) {
                const virtualMoveConfig: VirtualMovementConfig = {
                    lobbyId,
                    virtualPlayer: opponent,
                    getGameState: () => this.gameStates.get(lobbyId),
                    boardService: this.boardService,
                    callbacks: {
                        handleRequestMovement: this.gameLifeCycleService.handleRequestMovement.bind(this.gameLifeCycleService),
                        handleEndTurn: this.gameLifeCycleService.handleEndTurn.bind(this.gameLifeCycleService),
                        startBattle: this.startBattle.bind(this),
                        delay: this.gameLifeCycleService['delay'],
                        handleOpenDoor: this.openDoor.bind(this),
                    },
                    gameState,
                };
                this.virtualService.performTurn(() => {
                    this.virtualService.handleVirtualMovement(virtualMoveConfig);
                });
            }
        } else {
            this.io.to(lobbyId).emit(GameEvents.FleeFailure, { fleeingPlayer });
            const opponent = gameState.players.find((p) => p.id !== fleeingPlayer.id && p.life > 0);
            if (opponent && opponent.virtualPlayerData) {
                gameState.currentPlayer = opponent.id;
                this.gameStates.set(lobbyId, gameState);
                setTimeout(() => {
                    this.handleVirtualCombatTurn(lobbyId, opponent, fleeingPlayer, opponent);
                }, GameSocketConstants.CombatTurnDelay);
            }
        }

        this.gameStates.set(lobbyId, gameState);
    }

    async handleRequestMovement(socket: Socket, lobbyId: string, coordinates: Coordinates[]): Promise<void> {
        await this.gameLifeCycleService.handleRequestMovement(socket, lobbyId, coordinates);
    }

    private handleVirtualCombatTurn(lobbyId: string, currentTurnPlayer: Player, originalCombatant1: Player, originalCombatant2: Player) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        const opponent = currentTurnPlayer.id === originalCombatant1.id ? originalCombatant2 : originalCombatant1;
        if (!opponent || opponent.life <= 0) return;

        const isDefensive = currentTurnPlayer.virtualPlayerData?.profile === 'defensive';
        const wasInjured = currentTurnPlayer.maxLife && currentTurnPlayer.life < currentTurnPlayer.maxLife;

        if (isDefensive && wasInjured && currentTurnPlayer.amountEscape < 2) {
            this.handleFlee(lobbyId, currentTurnPlayer);
        } else {
            this.handleAttackAction(lobbyId, currentTurnPlayer, opponent);
        }
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
