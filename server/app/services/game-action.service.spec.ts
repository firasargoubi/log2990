/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameActionService } from '@app/services/game-action.service';
import { BoardService } from './board.service';
import { ItemService } from './item.service';
import { GameLifecycleService } from './game-life-cycle.service';
import { GameState } from '@common/game-state';
import { ObjectsTypes, Tile, TileTypes } from '@common/game.interface';
import { Coordinates } from '@common/coordinates';
import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { GameEvents } from '@common/events';
import { Player } from '@common/player';

const createGameState = (): GameState => {
    return {
        players: [
            {
                id: 'player1',
                name: 'Alice',
                items: [],
                pendingItem: 0,
                attack: 3,
                defense: 1,
                bonus: { attack: 'D6', defense: 'D4' },
                life: 10,
                speed: 5,
                currentAP: 2,
                winCount: 0,
                amountEscape: 0,
            },
            {
                id: 'player2',
                name: 'Bob',
                items: [],
                pendingItem: 0,
                attack: 2,
                defense: 2,
                bonus: { attack: 'D4', defense: 'D6' },
                life: 10,
                speed: 4,
                currentAP: 2,
                winCount: 0,
                amountEscape: 0,
            },
        ],
        board: [
            [TileTypes.DoorClosed, TileTypes.DoorOpen],
            [TileTypes.Ice, TileTypes.DoorClosed],
        ],
        animation: false,
        spawnPoints: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ],
        playerPositions: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ],
        teams: { team1: [{ id: 'player1', name: 'Alice' }], team2: [{ id: 'player2', name: 'Bob' }] },
        currentPlayer: 'player1',
        currentPlayerActionPoints: 2,
        debug: false,
        gameMode: 'capture',
    } as unknown as GameState;
};

describe('GameActionService Tests', () => {
    let gameStates: Map<string, GameState>;
    let boardService: BoardService;
    let itemService: ItemService;
    let handleDefeatStub: sinon.SinonStub;
    let gameLifeCycleService: GameLifecycleService;
    let io: Server;
    let service: GameActionService;
    let sandbox: sinon.SinonSandbox;
    let fakeSocket: Partial<Socket>;
    let chainable: any;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        gameStates = new Map();

        boardService = {
            handleMovement: sandbox.stub().callsFake((gameState: GameState, coordinate: Coordinates) => {
                if (coordinate.x === -1) {
                    return { gameState, shouldStop: true };
                }
                return { gameState, shouldStop: false };
            }),
            updatePlayerMoves: sandbox.stub().callsFake((gameState: GameState) => gameState),
            handleTeleport: sandbox.stub().callsFake((gameState: GameState, coordinate: Coordinates) => {
                gameState.playerPositions[0] = coordinate;
                return gameState;
            }),
            handleTurn: sandbox.stub().callsFake((gameState: GameState) => {
                gameState.currentPlayerActionPoints = 2;
                return gameState;
            }),
            handleBoardChange: sandbox.stub().callsFake((gameState: GameState) => gameState),
        } as unknown as BoardService;

        itemService = {
            applyPotionEffect: sandbox.stub(),
            applyJuiceEffect: sandbox.stub(),
        } as unknown as ItemService;

        handleDefeatStub = sandbox.stub();
        gameLifeCycleService = {
            getGameStateOrEmitError: sandbox.stub().callsFake((socket: Socket, lobbyId: string) => {
                const state = gameStates.get(lobbyId);
                if (!state) {
                    socket.emit('error', 'Game not found.');
                    return { players: [] } as GameState;
                }
                return state;
            }),
            handleDefeat: handleDefeatStub,
        } as unknown as GameLifecycleService;

        chainable = {
            to: sandbox.stub().returnsThis(),
            emit: sandbox.stub(),
        };
        io = {
            to: sandbox.stub().returns(chainable),
        } as unknown as Server;
        service = new GameActionService(gameStates, boardService, itemService, gameLifeCycleService);
        service.setServer(io);

        fakeSocket = {
            id: 'player1',
            emit: sandbox.stub(),
        } as unknown as Socket;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should process movement and emit movementProcessed', async () => {
        const lobbyId = 'lobby1';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        const coordinates: Coordinates[] = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ];

        await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);
        expect((boardService.handleMovement as sinon.SinonStub).called).to.equal(true);
        expect((boardService.updatePlayerMoves as sinon.SinonStub).called).to.equal(true);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('movementProcessed')).to.equal(true);
    });

    it('should handle early stop with inventory full', async () => {
        const lobbyId = 'lobby2';
        const gameState = createGameState();
        gameState.players[0].pendingItem = 1;
        gameStates.set(lobbyId, gameState);
        const coordinates: Coordinates[] = [
            { x: 0, y: 0 },
            { x: -1, y: -1 },
        ];

        await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);
        expect((fakeSocket.emit as sinon.SinonStub).calledWith('inventoryFull')).to.equal(true);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('movementProcessed')).to.equal(true);
    });

    it('should emit error when game state is not found', async () => {
        const lobbyId = 'nonExistingLobby';
        const coordinates: Coordinates[] = [{ x: 0, y: 0 }];

        await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);
        expect((fakeSocket.emit as sinon.SinonStub).calledWith(GameEvents.Error)).to.equal(true);
    });

    it('should stop movement, set animation to false, update gameStates when result.shouldStop is true and pendingItem is 0', async () => {
        const lobbyId = 'lobbyStop';
        const gameState = createGameState();
        gameState.players[0].pendingItem = 0;
        gameStates.set(lobbyId, gameState);
        const coordinates: Coordinates[] = [
            { x: 0, y: 0 },
            { x: -1, y: -1 },
        ];

        (boardService.handleMovement as sinon.SinonStub).withArgs(sinon.match.any, sinon.match.has('x', -1)).returns({ gameState, shouldStop: true });

        await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);
        expect(gameState.animation).to.equal(false);
        expect(gameStates.get(lobbyId)).to.equal(gameState);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('movementProcessed', { gameState })).to.equal(true);
    });

    it('should emit gameOver when last coordinate processed, player has flag, and is in spawn point', async () => {
        const lobbyId = 'lobbyGameOver';
        const gameState = createGameState();
        gameState.players[0].items.push(ObjectsTypes.FLAG);
        gameState.playerPositions[0] = { ...gameState.spawnPoints[0] };
        gameStates.set(lobbyId, gameState);
        const coordinates: Coordinates[] = [
            { x: 0, y: 0 },
            { x: 2, y: 2 },
        ];

        (boardService.handleMovement as sinon.SinonStub).returns({ gameState, shouldStop: false });

        await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);
        const expectedWinner = gameState.teams.team1.map((p) => p.name).join(', ');
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('gameOver', { winner: expectedWinner })).to.equal(true);
    });

    it('should emit gameOver with Blue team players when current player is in team2', async () => {
        const lobbyId = 'lobbyGameOverBlue';
        const gameState = createGameState();
        gameState.teams.team1 = [];
        gameState.teams.team2 = [gameState.players[0], gameState.players[1]];
        gameState.players[0].items.push(ObjectsTypes.FLAG);
        gameState.playerPositions[0] = { ...gameState.spawnPoints[0] };
        gameStates.set(lobbyId, gameState);
        const coordinates: Coordinates[] = [
            { x: 0, y: 0 },
            { x: 2, y: 2 },
        ];

        (boardService.handleMovement as sinon.SinonStub).returns({ gameState, shouldStop: false });

        await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);
        const expectedWinner = gameState.teams.team2.map((p) => p.name).join(', ') || 'Unknown';
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('gameOver', { winner: expectedWinner })).to.equal(true);
    });

    it('should update game state on teleport and emit boardModified', () => {
        const lobbyId = 'lobbyTeleport';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        const coordinate: Coordinates = { x: 2, y: 2 };

        service.handleTeleport(fakeSocket as Socket, lobbyId, coordinate);
        expect((boardService.handleTeleport as sinon.SinonStub).called).to.equal(true);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('boardModified')).to.equal(true);
    });

    it('should emit error if game state is not found', () => {
        const lobbyId = 'nonExistingLobby';
        const coordinate: Coordinates = { x: 2, y: 2 };

        service.handleTeleport(fakeSocket as Socket, lobbyId, coordinate);
        expect((fakeSocket.emit as sinon.SinonStub).calledWith('error')).to.equal(true);
    });

    it('should update game state on startTurn and emit TurnStarted', () => {
        const lobbyId = 'lobbyTurn';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);

        service.startTurn(lobbyId);
        expect((boardService.handleTurn as sinon.SinonStub).called).to.equal(true);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith(GameEvents.TurnStarted)).to.equal(true);
    });

    it('should update board and emit BoardModified on closeDoor', () => {
        const lobbyId = 'lobbyDoor';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        const tile: Tile = {
            x: 0,
            y: 0,
            type: TileTypes.Grass,
            object: ObjectsTypes.BOOTS,
        };

        service.closeDoor(fakeSocket as Socket, tile, lobbyId);
        expect(gameState.board[tile.x][tile.y]).to.equal(TileTypes.DoorClosed);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith(GameEvents.BoardModified)).to.equal(true);
    });

    it('should update board and emit BoardModified on openDoor', () => {
        const lobbyId = 'lobbyDoor';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        const tile: Tile = {
            x: 0,
            y: 0,
            type: TileTypes.Grass,
            object: ObjectsTypes.BOOTS,
        };

        service.openDoor(fakeSocket as Socket, tile, lobbyId);
        expect(gameState.board[tile.x][tile.y]).to.equal(TileTypes.DoorOpen);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith(GameEvents.BoardModified)).to.equal(true);
    });

    it('should not allow battle between same team players in capture mode', () => {
        const lobbyId = 'lobbyBattle';
        const gameState = createGameState();
        gameState.teams = { team1: [gameState.players[0], gameState.players[1]], team2: [] };
        gameStates.set(lobbyId, gameState);

        service.startBattle(lobbyId, gameState.players[0], gameState.players[1]);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith(GameEvents.Error, gameSocketMessages.sameTeam)).to.equal(true);
    });

    it('should calculate damage, update defender life and emit attackResult', () => {
        const lobbyId = 'lobbyAttack';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        gameState.debug = true;
        gameState.players[1].defense = 1;
        gameState.players[0].attack = 3;

        service.handleAttackAction(lobbyId, gameState.players[0], gameState.players[1]);
        expect(gameState.players[1].life).to.be.lessThan(10);
        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('attackResult')).to.equal(true);
    });

    it('should emit movement error on handleRequestMovement catch', async () => {
        const lobbyId = 'lobbyError';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        (boardService.updatePlayerMoves as sinon.SinonStub).throws(new Error('Test movement error'));
        const coordinates: Coordinates[] = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ];

        await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);
        expect((fakeSocket.emit as sinon.SinonStub).calledWith(GameEvents.Error, `${gameSocketMessages.movementError}Test movement error`)).to.equal(
            true,
        );
    });

    it('should emit teleport error when boardService.handleTeleport throws', () => {
        const lobbyId = 'lobbyTeleportError';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        const coordinate: Coordinates = { x: 2, y: 2 };
        (boardService.handleTeleport as sinon.SinonStub).throws(new Error('Teleport failed'));

        service.handleTeleport(fakeSocket as Socket, lobbyId, coordinate);

        expect((fakeSocket.emit as sinon.SinonStub).calledWith('error', 'Teleport error: Teleport failed')).to.equal(true);
    });

    it('should emit turn error when boardService.handleTurn throws', () => {
        const lobbyId = 'lobbyTurnError';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        (boardService.handleTurn as sinon.SinonStub).throws(new Error('Turn failed'));

        service.startTurn(lobbyId);

        expect((io.to as sinon.SinonStub).calledWith(lobbyId)).to.equal(true);
        expect(chainable.emit.calledWith(GameEvents.Error, `${gameSocketMessages.turnError}Turn failed`)).to.equal(true);
    });
    it('should set firstPlayer to opponent when opponent.speed > currentPlayer.speed', () => {
        const lobbyId = 'lobbyBattleFirst';
        const gameState = createGameState();
        gameState.teams = { team1: [gameState.players[0]], team2: [gameState.players[1]] };
        gameState.players[1].speed = 10;
        gameStates.set(lobbyId, gameState);

        service.startBattle(lobbyId, gameState.players[0], gameState.players[1]);

        expect((io.to as sinon.SinonStub).calledWith(gameState.players[0].id)).to.equal(true);
        expect(chainable.to.calledWith(gameState.players[1].id)).to.equal(true);
        expect(chainable.emit.calledWith('startCombat', { firstPlayer: gameState.players[1] })).to.equal(true);
    });
    it('should set firstPlayer to currentPlayer when speeds are equal', () => {
        const lobbyId = 'lobbyEqualSpeed';
        const gameState = createGameState();

        gameState.players[0].speed = 5;
        gameState.players[1].speed = 5;
        gameStates.set(lobbyId, gameState);

        service.startBattle(lobbyId, gameState.players[0], gameState.players[1]);

        expect(chainable.emit.calledWith('startCombat', sinon.match({ firstPlayer: gameState.players[0] }))).to.equal(true);
    });
    it('should return early in handleAttackAction when attacker or defender is not found', () => {
        const lobbyId = 'lobbyAttackNotFound';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        const attackerNotFound: Player = { ...gameState.players[0], id: 'unknown' };
        service.handleAttackAction(lobbyId, attackerNotFound, gameState.players[1]);
        expect((io.to as sinon.SinonStub).called).to.equal(false);
    });
    it('should return early in handleAttackAction when gameState is undefined', () => {
        const lobbyId = 'lobbyAttackNotFound';

        service.handleAttackAction(lobbyId, undefined, undefined);
        expect((io.to as sinon.SinonStub).called).to.equal(false);
    });

    it('should subtract 2 from attackDice and defenseDice when players are on ice', () => {
        const lobbyId = 'lobbyAttackIce';
        const gameState = createGameState();
        gameState.board[0][0] = TileTypes.Ice;
        gameState.board[1][1] = TileTypes.Ice;
        gameState.playerPositions[0] = { x: 0, y: 0 };
        gameState.playerPositions[1] = { x: 1, y: 1 };
        gameStates.set(lobbyId, gameState);

        service.handleAttackAction(lobbyId, gameState.players[0], gameState.players[1]);

        expect((io.to as sinon.SinonStub).calledWith(lobbyId)).to.equal(true);
        expect(chainable.emit.calledWith('attackResult')).to.equal(true);
    });
    it('should emit gameOver if defender dies and attacker wins', () => {
        const lobbyId = 'lobbyAttackGameOver';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        gameState.players[0].attack = 10;
        gameState.players[1].defense = 0;
        gameState.debug = true;
        gameState.players[0].winCount = GameSocketConstants.MaxWinCount - 1;
        sandbox.stub(Math, 'random').returns(0);

        service.handleAttackAction(lobbyId, gameState.players[0], gameState.players[1]);

        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('gameOver', { winner: gameState.players[0].name })).to.equal(true);
    });

    it('should call handleDefeat if defender dies and attacker win count is below MaxWinCount', () => {
        const lobbyId = 'lobbyAttackDefeat';
        const gameState = createGameState();
        gameStates.set(lobbyId, gameState);
        gameState.players[0].attack = 10;
        gameState.players[1].defense = 0;
        gameState.debug = true;
        gameState.players[0].winCount = 0;
        sandbox.stub(Math, 'random').returns(0);

        service.handleAttackAction(lobbyId, gameState.players[0], gameState.players[1]);

        expect(handleDefeatStub.called).to.equal(true);
    });

    it('should return correct dice value for D4 and default for unknown dice', () => {
        const svc: any = service;
        const d4Value = svc.getDiceValue('D4');
        expect(d4Value).to.equal(GameSocketConstants.D4Value);
        const unknownValue = svc.getDiceValue('XYZ');
        expect(unknownValue).to.equal(0);
    });
    it('should not emit gameOver when items is undefined and player is in spawn point', async () => {
        const lobbyId = 'lobbyNoFlagUndefined';
        const gameState = createGameState();
        gameState.players[0].items = undefined;
        gameState.playerPositions[0] = { ...gameState.spawnPoints[0] };
        gameStates.set(lobbyId, gameState);
        const coordinates: Coordinates[] = [
            { x: 0, y: 0 },
            { x: 2, y: 2 },
        ];

        (boardService.handleMovement as sinon.SinonStub).returns({ gameState, shouldStop: false });

        await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);

        const roomStub = (io.to as sinon.SinonStub).getCall(0).returnValue;
        expect((roomStub.emit as sinon.SinonStub).calledWith('gameOver')).to.equal(false);
    });
    it('should return early in startBattle when gameState is undefined', () => {
        const lobbyId = 'lobbyAttackNotFound';

        service.startBattle(lobbyId, undefined, undefined);
        expect((io.to as sinon.SinonStub).called).to.equal(false);
    });
});
