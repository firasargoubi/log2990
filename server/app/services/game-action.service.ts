import { GAME_ACTION_CONSTS } from '@app/constants/game-action-consts';
import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { Coordinates } from '@common/coordinates';
import { EventType, GameEvents } from '@common/events';
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
        gameState.doorHandled = gameState.doorHandled || [];
        gameState.doorCounter = gameState.doorCounter || 0;
        gameState.percentageDoorHandled = gameState.percentageDoorHandled || 0;
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        gameState.board = gameState.board.map((row) => [...row]);
        gameState.board[tile.x][tile.y] = TileTypes.DoorClosed;
        gameState.currentPlayerActionPoints = 0;
        const alreadyClosed = gameState.doorHandled.some((t) => t.x === tile.x && t.y === tile.y);
        if (!alreadyClosed) {
            gameState.doorCounter += 1;
            gameState.doorHandled.push(tile);
        }
        gameState.percentageDoorHandled = Math.floor((gameState.doorCounter / gameState.amountDoors) * GAME_ACTION_CONSTS.percentage);
        if (currentPlayerIndex !== -1) {
            gameState.players[currentPlayerIndex].currentAP = 0;
        }
        const newGameState = this.boardService.handleBoardChange(gameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
        this.gameLifeCycleService.emitGlobalEvent(newGameState, EventType.DoorClosed, lobbyId);
    }

    openDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.gameLifeCycleService.getGameStateOrEmitError(socket, lobbyId);
        if (!gameState) return;
        gameState.doorHandled = gameState.doorHandled || [];
        gameState.doorCounter = gameState.doorCounter || 0;
        gameState.percentageDoorHandled = gameState.percentageDoorHandled || 0;
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        gameState.board = gameState.board.map((row) => [...row]);
        const alreadyOpened = gameState.doorHandled.some((t) => t.x === tile.x && t.y === tile.y);
        if (!alreadyOpened) {
            gameState.doorCounter += 1;
            gameState.doorHandled.push(tile);
        }
        gameState.percentageDoorHandled = Math.floor((gameState.doorCounter / gameState.amountDoors) * GAME_ACTION_CONSTS.percentage);
        gameState.board[tile.x][tile.y] = TileTypes.DoorOpen;
        gameState.currentPlayerActionPoints = 0;
        if (currentPlayerIndex !== -1) {
            gameState.players[currentPlayerIndex].currentAP = 0;
        }
        const newGameState = this.boardService.handleBoardChange(gameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState: newGameState });
        this.gameLifeCycleService.emitGlobalEvent(newGameState, EventType.DoorOpened, lobbyId);
    }

    startBattle(lobbyId: string, currentPlayer: Player, opponent: Player) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;
        if (gameState.gameMode === 'capture') {
            const isSameTeam =
                (gameState.teams.team1.some((p) => p.id === currentPlayer.id) && gameState.teams.team1.some((p) => p.id === opponent.id)) ||
                (gameState.teams.team2.some((p) => p.id === currentPlayer.id) && gameState.teams.team2.some((p) => p.id === opponent.id));
            if (isSameTeam) {
                this.io.to(currentPlayer.id).to(opponent.id).emit('startCombat', { firstPlayer: currentPlayer, gameState });
                return;
            }
        }

        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id);
        const opponentIndex = gameState.players.findIndex((p) => p.id === opponent.id);
        if (currentPlayerIndex === -1 || opponentIndex === -1) return;

        const attacker = gameState.players[currentPlayerIndex];
        const defender = gameState.players[opponentIndex];

        attacker.fightCount = (attacker.fightCount || 0) + 1;
        defender.fightCount = (defender.fightCount || 0) + 1;
        attacker.amountEscape = 0;
        defender.amountEscape = 0;
        attacker.currentAP = 0;
        gameState.currentPlayerActionPoints = 0;

        let firstPlayer = attacker;
        if (defender.speed > attacker.speed) {
            firstPlayer = defender;
        } else if (defender.speed === attacker.speed) {
            firstPlayer = attacker;
        }
        this.gameLifeCycleService.emitGlobalEvent(gameState, EventType.CombatStarted, lobbyId, [currentPlayer.name, opponent.name]);

        this.gameStates.set(lobbyId, gameState);
        this.io.to(attacker.id).to(defender.id).emit('startCombat', { firstPlayer, gameState });

        if (firstPlayer.virtualPlayerData) {
            setTimeout(() => this.handleVirtualCombatTurn(lobbyId, firstPlayer, attacker, defender), GameSocketConstants.CombatTurnDelay);
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
        const serverAttacker = gameState.players[attackerIndex];
        const serverDefender = gameState.players[defenderIndex];

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
        const damage = Math.max(0, attackDice + serverAttacker.attack - defenseDice - serverDefender.defense);
        this.itemService.applyPotionEffect(serverAttacker, serverDefender);
        if (damage > 0) {
            serverDefender.life -= damage;
            serverDefender.damageReceived = (serverDefender.damageReceived || 0) + damage;
            serverAttacker.damageDealt = (serverAttacker.damageDealt || 0) + damage;
        }
        this.itemService.applyJuiceEffect(serverDefender);

        if (serverDefender.life <= 0) {
            serverAttacker.winCount++;
            serverDefender.loseCount++;
            for (const player of gameState.players) {
                player.amountEscape = 0;
            }
            if (serverAttacker.winCount === GameSocketConstants.MaxWinCount) {
                gameState.endDate = new Date();
                gameState.turnCounter++;
                this.io.to(lobbyId).emit('gameOver', { winner: serverAttacker.name, lobby: lobbyId, finalGameState: gameState });
                return;
            }
            this.gameLifeCycleService.handleDefeat(lobbyId, serverAttacker, serverDefender);
            return;
        }

        this.io.to(lobbyId).emit('attackResult', {
            attackRoll: attackDice + serverAttacker.attack,
            defenseRoll: defenseDice + serverDefender.defense,
            attackerHP: serverAttacker.life,
            defenderHP: serverDefender.life,
            damage,
            attacker: serverAttacker,
            defender: serverDefender,
            defenderDamageReceived: serverDefender?.damageReceived,
            attackerDamageDealt: serverAttacker?.damageDealt,
        });

        const description = `${attacker.name} a attaqué ${defender.name} et lui a infligé ${damage} dégâts.`;
        this.gameLifeCycleService.emitEventToPlayers(EventType.AttackResult, [attacker.name, defender.name], description, attacker.id, defender.id);

        const nextPlayer = serverDefender;
        if (nextPlayer.virtualPlayerData) {
            gameState.currentPlayer = nextPlayer.id;
            this.gameStates.set(lobbyId, gameState);
            setTimeout(() => this.handleVirtualCombatTurn(lobbyId, nextPlayer, serverAttacker, serverDefender), GameSocketConstants.CombatTurnDelay);
        }
    }

    handleChatMessage(lobbyId: string, playerName: string, message: string) {
        this.io.to(lobbyId).emit(GameEvents.ChatMessage, {
            playerName,
            message,
        });
    }

    getGameStateOrEmitError(socket: Socket, lobbyId: string): GameState | null {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit(GameEvents.Error, gameSocketMessages.gameNotFound);
            return null;
        }
        return gameState;
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
            fleeingPlayer.fleeCount++;
            gameState.players[playerIndex] = fleeingPlayer;
            for (const player of gameState.players) {
                player.amountEscape = 0;
            }
            this.io.to(lobbyId).emit(GameEvents.FleeSuccess, { fleeingPlayer, isSuccessful });
            this.io.to(lobbyId).emit(GameEvents.BoardModified, { gameState });
            const opponent = gameState.players.find((p) => p.id !== fleeingPlayer.id && p.life > 0);
            const description = `${fleeingPlayer.name} a fui ${opponent.name}.`;
            this.gameLifeCycleService.emitEventToPlayers(
                EventType.FleeSuccess,
                [fleeingPlayer.name, opponent.name],
                description,
                fleeingPlayer.id,
                opponent.id,
            );

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
            const description = `${fleeingPlayer.name} n'a pas pu fuire.`;
            this.gameLifeCycleService.emitEventToPlayers(
                EventType.FleeFailure,
                [fleeingPlayer.name, opponent.name],
                description,
                fleeingPlayer.id,
                opponent.id,
            );
        }

        this.gameStates.set(lobbyId, gameState);
    }

    async handleRequestMovement(socket: Socket, lobbyId: string, coordinates: Coordinates[]): Promise<void> {
        await this.gameLifeCycleService.handleRequestMovement(socket, lobbyId, coordinates);
    }

    itemEvent(result: { gameState: GameState; shouldStop: boolean; itemPicked?: boolean; item?: number }, lobbyId: string) {
        if (result.itemPicked && result.item === ObjectsTypes.FLAG) {
            this.gameLifeCycleService.emitGlobalEvent(result.gameState, EventType.FlagPicked, lobbyId);
        } else if (result.itemPicked && result.item !== ObjectsTypes.FLAG) {
            this.gameLifeCycleService.emitGlobalEvent(result.gameState, EventType.ItemPicked, lobbyId);
        } else {
            return;
        }
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
