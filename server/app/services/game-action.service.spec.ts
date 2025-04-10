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
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { GameState } from '@common/game-state';
import { Coordinates } from '@common/coordinates';
import { GameSocketConstants, gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { GameEvents } from '@common/events';
import { ObjectsTypes, Tile, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';

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
                maxLife: 10,
                speed: 5,
                currentAP: 2,
                winCount: 0,
                amountEscape: 0,
                virtualPlayerData: undefined,
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
                maxLife: 10,
                speed: 4,
                currentAP: 2,
                winCount: 0,
                amountEscape: 0,
                virtualPlayerData: undefined,
            },
        ],
        board: [
            [TileTypes.DoorClosed, TileTypes.DoorOpen],
            [TileTypes.Ice, TileTypes.DoorClosed],
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
        animation: false,
        spawnPoints: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ],
    } as unknown as GameState;
};

describe('GameActionService Updated Tests', () => {
    let sandbox: sinon.SinonSandbox;
    let gameStates: Map<string, GameState>;
    let boardService: BoardService;
    let itemService: ItemService;
    let virtualService: VirtualPlayerService;
    let gameLifeCycleService: any;
    let io: Partial<Server>;
    let service: GameActionService;
    let fakeSocket: Partial<Socket>;
    let chainable: { to: sinon.SinonStub; emit: sinon.SinonStub };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        gameStates = new Map();

        chainable = {
            to: sandbox.stub().returnsThis(),
            emit: sandbox.stub(),
        };

        boardService = {
            handleTeleport: sandbox.stub().callsFake((gameState: GameState, coord: Coordinates) => {
                gameState.playerPositions[0] = coord;
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

        virtualService = {
            handleVirtualMovement: sandbox.stub(),
            performTurn: sandbox.stub().callsArg(0),
        } as unknown as VirtualPlayerService;

        gameLifeCycleService = {
            getGameStateOrEmitError: sandbox.stub().callsFake((socket: Socket, lobbyId: string) => {
                const state = gameStates.get(lobbyId);
                if (!state) {
                    socket.emit(GameEvents.Error, gameSocketMessages.gameNotFound);
                    return null;
                }
                return state;
            }),
            handleRequestMovement: sandbox.stub().resolves(),
            handleEndTurn: sandbox.stub(),
            handleDefeat: sandbox.stub(),
            delay: sinon.stub(),
        } as Partial<GameLifecycleService> as GameLifecycleService;
        io = {
            to: sandbox.stub().returns(chainable),
        } as unknown as Partial<Server>;

        fakeSocket = {
            id: 'player1',
            emit: sandbox.stub(),
        } as unknown as Partial<Socket>;

        service = new GameActionService(gameStates, boardService, itemService, virtualService);
        service.setServer(io as Server);
        service.setGameLifecycleService(gameLifeCycleService as GameLifecycleService);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('handleTeleport', () => {
        const coordinate: Coordinates = { x: 2, y: 2 };

        it('should emit error if game not found', () => {
            service.handleTeleport(fakeSocket as Socket, 'nonexistent', coordinate);
            sinon.assert.calledWith(fakeSocket.emit as sinon.SinonStub, 'error', 'Game not found.');
        });

        it('should update game state and emit boardModified on successful teleport', () => {
            const lobbyId = 'lobbyTeleport';
            const gameState = createGameState();
            gameStates.set(lobbyId, gameState);
            service.handleTeleport(fakeSocket as Socket, lobbyId, coordinate);
            expect(gameStates.get(lobbyId)?.playerPositions[0]).to.deep.equal(coordinate);
            sinon.assert.calledWith(chainable.emit, 'boardModified', { gameState: gameStates.get(lobbyId) });
        });

        it('should emit error when boardService.handleTeleport throws', () => {
            const lobbyId = 'lobbyTeleportError';
            const gameState = createGameState();
            gameStates.set(lobbyId, gameState);
            const error = new Error('Teleport failed');
            (boardService.handleTeleport as sinon.SinonStub).throws(error);
            service.handleTeleport(fakeSocket as Socket, lobbyId, coordinate);
            sinon.assert.calledWith(fakeSocket.emit as sinon.SinonStub, 'error', `Teleport error: ${error.message}`);
        });
    });

    describe('handleRequestMovement', () => {
        it('should call gameLifeCycleService.handleRequestMovement', async () => {
            const lobbyId = 'lobbyMovement';
            const gameState = createGameState();
            gameStates.set(lobbyId, gameState);
            const coordinates: Coordinates[] = [{ x: 1, y: 1 }];
            await service.handleRequestMovement(fakeSocket as Socket, lobbyId, coordinates);
            sinon.assert.calledWith(gameLifeCycleService.handleRequestMovement as sinon.SinonStub, fakeSocket, lobbyId, coordinates);
        });
    });

    describe('startTurn', () => {
        it('should do nothing if game state not found', () => {
            chainable.emit.resetHistory();
            service.startTurn('nonexistent');
            sinon.assert.notCalled(chainable.emit);
        });

        it('should update game state using boardService.handleTurn and emit TurnStarted', () => {
            const lobbyId = 'lobbyTurn';
            const gameState = createGameState();
            gameStates.set(lobbyId, gameState);
            (boardService.handleTurn as sinon.SinonStub).returns({ ...gameState, currentPlayerActionPoints: 2 });
            chainable.emit.resetHistory();
            service.startTurn(lobbyId);
            expect(gameStates.get(lobbyId)?.currentPlayerActionPoints).to.equal(2);
            sinon.assert.calledWith(chainable.emit, GameEvents.TurnStarted, { gameState: gameStates.get(lobbyId) });
        });

        it('should emit error when boardService.handleTurn throws', () => {
            const lobbyId = 'lobbyTurnError';
            const gameState = createGameState();
            gameStates.set(lobbyId, gameState);
            const error = new Error('Turn failed');
            (boardService.handleTurn as sinon.SinonStub).throws(error);
            chainable.emit.resetHistory();
            service.startTurn(lobbyId);
            sinon.assert.calledWith(chainable.emit, GameEvents.Error, `${gameSocketMessages.turnError}${error.message}`);
        });

        it('should call virtualService.handleVirtualMovement with correct configuration when current player is virtual', () => {
            const lobbyId = 'lobbyTurnVirtual';
            const baseState = createGameState();
            const virtualPlayer: Player = { ...baseState.players[0], virtualPlayerData: { profile: 'aggressive' } };
            const updatedState: GameState = { ...baseState, players: [virtualPlayer, baseState.players[1]], currentPlayer: virtualPlayer.id };
            gameStates.set(lobbyId, updatedState);
            (boardService.handleTurn as sinon.SinonStub).returns(updatedState);
            chainable.emit.resetHistory();
            service.startTurn(lobbyId);
            sinon.assert.calledOnce(virtualService.handleVirtualMovement as sinon.SinonStub);
            const config = (virtualService.handleVirtualMovement as sinon.SinonStub).getCall(0).args[0];
            expect(config.lobbyId).to.equal(lobbyId);
            expect(config.virtualPlayer).to.deep.equal(virtualPlayer);
            expect(config.getGameState).to.be.a('function');
            expect(config.getGameState()).to.deep.equal(gameStates.get(lobbyId));
            expect(config.boardService).to.equal(boardService);
            expect(config.callbacks).to.include.all.keys('handleRequestMovement', 'handleEndTurn', 'startBattle', 'delay', 'handleOpenDoor');
            expect(config.callbacks.delay).to.equal(gameLifeCycleService.delay);
            expect(config.gameState).to.deep.equal(updatedState);
        });
        it('should emit error for same team players in capture mode', () => {
            const lobbyId = 'lobbySameTeam';
            const gameState = createGameState();
            gameState.gameMode = 'capture';
            gameState.teams = {
                team1: [
                    {
                        id: 'player1',
                        name: 'Alice',
                        pendingItem: 0,
                        avatar: '',
                        isHost: false,
                        life: 0,
                        maxLife: 0,
                        speed: 0,
                        attack: 0,
                        defense: 0,
                        winCount: 0,
                    },
                    {
                        id: 'player2',
                        name: 'Bob',
                        pendingItem: 0,
                        avatar: '',
                        isHost: false,
                        life: 0,
                        maxLife: 0,
                        speed: 0,
                        attack: 0,
                        defense: 0,
                        winCount: 0,
                    },
                ],
                team2: [],
            };
            gameStates.set(lobbyId, gameState);

            chainable.emit.resetHistory();

            service.startBattle(lobbyId, gameState.players[0], gameState.players[1]);

            sinon.assert.calledWith(chainable.emit, GameEvents.Error, gameSocketMessages.sameTeam);
        });
    });

    describe('openDoor and closeDoor', () => {
        const tile: Tile = {
            x: 0,
            y: 0,
            type: TileTypes.DoorClosed,
            object: ObjectsTypes.BOOTS,
        };

        it('closeDoor: should update tile to DoorClosed, set AP to 0, and emit BoardModified', () => {
            const lobbyId = 'lobbyCloseDoor';
            const gameState = createGameState();
            gameStates.set(lobbyId, gameState);
            chainable.emit.resetHistory();
            service.closeDoor(fakeSocket as Socket, tile, lobbyId);
            expect(gameStates.get(lobbyId)?.board[tile.x][tile.y]).to.equal(TileTypes.DoorClosed);
            expect(gameStates.get(lobbyId)?.currentPlayerActionPoints).to.equal(0);
            sinon.assert.calledWith(chainable.emit, GameEvents.BoardModified, { gameState: gameStates.get(lobbyId) });
        });

        it('openDoor: should update tile to DoorOpen, set AP to 0, and emit BoardModified', () => {
            const lobbyId = 'lobbyOpenDoor';
            const gameState = createGameState();
            gameStates.set(lobbyId, gameState);
            chainable.emit.resetHistory();
            service.openDoor(fakeSocket as Socket, tile, lobbyId);
            expect(gameStates.get(lobbyId)?.board[tile.x][tile.y]).to.equal(TileTypes.DoorOpen);
            expect(gameStates.get(lobbyId)?.currentPlayerActionPoints).to.equal(0);
            sinon.assert.calledWith(chainable.emit, GameEvents.BoardModified, { gameState: gameStates.get(lobbyId) });
        });
    });

    describe('startBattle', () => {
        let player1: Player;
        let player2: Player;
        const lobbyId = 'lobbyBattle';

        beforeEach(() => {
            const state = createGameState();
            player1 = { ...state.players[0] };
            player2 = { ...state.players[1] };
            gameStates.set(lobbyId, state);
        });

        it('should do nothing if game state is not found', () => {
            chainable.emit.resetHistory();
            service.startBattle('nonexistent', player1, player2);
            sinon.assert.notCalled(chainable.emit);
        });

        it('should trigger virtual combat turn if first player is virtual', () => {
            const clock = sinon.useFakeTimers();
            player1.virtualPlayerData = { profile: 'aggressive' };
            const state = createGameState();
            state.players = [player1, player2];
            state.gameMode = 'deathmatch';
            state.currentPlayer = player1.id;
            gameStates.set(lobbyId, state);
            chainable.emit.resetHistory();
            service.startBattle(lobbyId, player1, player2);
            clock.tick(GameSocketConstants.CombatTurnDelay);
            clock.restore();
        });

        it('should set firstPlayer to opponent when opponent.speed > currentPlayer.speed', () => {
            const state = createGameState();
            state.gameMode = 'classic';

            const currentPlayer = {
                ...state.players[0],
                id: 'player1',
                name: 'Alice',
                speed: 3,
            };

            const opponent = {
                ...state.players[1],
                id: 'player2',
                name: 'Bob',
                speed: 5,
            };

            state.teams.team1 = [currentPlayer];
            state.teams.team2 = [opponent];
            state.players = [currentPlayer, opponent];

            gameStates.set('lobby-speed-test', state);

            chainable.emit.resetHistory();

            service.startBattle('lobby-speed-test', currentPlayer, opponent);

            sinon.assert.calledWith(
                chainable.emit,
                'startCombat',
                sinon.match({
                    firstPlayer: opponent,
                }),
            );
        });

        it('should make currentPlayer first if both players have equal speed', () => {
            const state = createGameState();
            state.gameMode = 'classic';

            const currentPlayer = {
                ...state.players[0],
                id: 'player1',
                speed: 5,
            };
            const opponent = {
                ...state.players[1],
                id: 'player2',
                speed: 5,
            };

            state.teams.team1 = [currentPlayer];
            state.teams.team2 = [opponent];
            state.players = [currentPlayer, opponent];

            gameStates.set('lobby-equal-speed', state);

            chainable.emit.resetHistory();

            service.startBattle(lobbyId, currentPlayer, opponent);

            sinon.assert.calledWith(chainable.emit, 'startCombat', {
                firstPlayer: currentPlayer,
            });
        });
    });

    describe('handleAttackAction', () => {
        let randomStub: sinon.SinonStub;
        const lobbyId = 'lobbyAttack';
        let state: GameState;
        let attacker: Player;
        let defender: Player;

        beforeEach(() => {
            state = createGameState();
            gameStates.set(lobbyId, state);
            attacker = { ...state.players[0], attack: 5, bonus: { attack: 'D6', defense: 'D4' } };
            defender = { ...state.players[1], defense: 3, bonus: { attack: 'D6', defense: 'D4' } };
            state.players = [attacker, defender];
            randomStub = sandbox.stub(Math, 'random').returns(0.5);
            chainable.emit.resetHistory();
        });

        afterEach(() => {
            randomStub.restore();
        });

        it('should do nothing if attacker or defender is not found', () => {
            chainable.emit.resetHistory();
            service.handleAttackAction(lobbyId, { ...attacker, id: 'unknown' }, defender);
            sinon.assert.notCalled(chainable.emit);
        });

        it('should schedule virtual combat turn if defender is virtual', (done) => {
            defender.virtualPlayerData = { profile: 'aggressive' };
            const clock = sinon.useFakeTimers();
            chainable.emit.resetHistory();
            service.handleAttackAction(lobbyId, attacker, defender);
            sinon.assert.calledWith(chainable.emit, 'attackResult', sinon.match.object);
            clock.tick(GameSocketConstants.CombatTurnDelay);
            clock.restore();
            done();
        });

        it('should emit error when both players are in team2 in capture mode', () => {
            state.gameMode = 'capture';

            const currentPlayer = { ...state.players[0], id: 'player1' };
            const opponent = { ...state.players[1], id: 'player2' };

            state.teams.team2 = [currentPlayer, opponent];
            state.players = [currentPlayer, opponent];

            gameStates.set('lobbyCapture', createGameState());

            chainable.emit.resetHistory();

            service.startBattle(lobbyId, currentPlayer, opponent);

            sinon.assert.calledWith(chainable.emit, GameEvents.Error, gameSocketMessages.sameTeam);
        });
        it('should reduce attackDice by 2 when attacker is on ice tile', () => {
            state.board[0][0] = TileTypes.Ice;
            state.playerPositions[0] = { x: 0, y: 0 };
            service.handleAttackAction(lobbyId, attacker, defender);
            const attackRoll = (chainable.emit as sinon.SinonStub).getCall(0).args[1].attackRoll;
            const expectedAttackDice = Math.floor(0.5 * GameSocketConstants.D6Value) + 1 - 2;
            expect(attackRoll).to.equal(expectedAttackDice + attacker.attack);
        });
        it('should reduce defenseDice by 2 when defender is on ice tile', () => {
            state.board[1][0] = TileTypes.Ice;
            state.playerPositions[1] = { x: 1, y: 0 };
            service.handleAttackAction(lobbyId, attacker, defender);
            const defenseRoll = (chainable.emit as sinon.SinonStub).getCall(0).args[1].defenseRoll;
            const expectedDefenseDice = Math.floor(0.5 * GameSocketConstants.D4Value) + 1 - 2;
            expect(defenseRoll).to.equal(expectedDefenseDice + defender.defense);
        });
        it('should set attackDice to attacker.attack and defenseDice to 1 when debug is true', () => {
            state.debug = true;
            state.board[0][0] = TileTypes.Ice;
            state.board[1][1] = TileTypes.Ice;
            service.handleAttackAction(lobbyId, attacker, defender);
            const attackRoll = (chainable.emit as sinon.SinonStub).getCall(0).args[1].attackRoll;
            const defenseRoll = (chainable.emit as sinon.SinonStub).getCall(0).args[1].defenseRoll;
            expect(attackRoll).to.equal(attacker.attack + attacker.attack);
            expect(defenseRoll).to.equal(1 + defender.defense);
        });

        it('should increase attacker winCount and reset amountEscape for all players when defender.life <= 0', () => {
            attacker.attack = 10;
            defender.life = 5;
            defender.defense = 0;
            randomStub.returns(1);
            state.players.push({ ...state.players[0], id: 'player3', amountEscape: 2 });
            service.handleAttackAction(lobbyId, attacker, defender);
            expect(attacker.winCount).to.equal(1);
            expect(state.players.every((p) => p.amountEscape === 0)).to.equal(true);
            sinon.assert.calledWith(gameLifeCycleService.handleDefeat as sinon.SinonStub, lobbyId, attacker, defender);
        });

        it('should emit gameOver when attacker reaches MaxWinCount', () => {
            attacker.winCount = GameSocketConstants.MaxWinCount - 1;
            attacker.attack = 10;
            defender.life = 5;
            defender.defense = 0;
            randomStub.returns(1);
            service.handleAttackAction(lobbyId, attacker, defender);
            expect(attacker.winCount).to.equal(GameSocketConstants.MaxWinCount);
            sinon.assert.calledWith(chainable.emit, 'gameOver', { winner: attacker.name });
            sinon.assert.notCalled(gameLifeCycleService.handleDefeat as sinon.SinonStub);
        });

        it('should call handleDefeat when defender.life <= 0 but winCount < MaxWinCount', () => {
            attacker.winCount = 0;
            attacker.attack = 10;
            defender.life = 5;
            defender.defense = 0;
            randomStub.returns(1);
            service.handleAttackAction(lobbyId, attacker, defender);
            expect(attacker.winCount).to.equal(1);
            sinon.assert.calledWith(gameLifeCycleService.handleDefeat as sinon.SinonStub, lobbyId, attacker, defender);
            sinon.assert.notCalled(chainable.emit.withArgs('gameOver'));
        });

        it('should emit attackResult with correct values when defender survives', () => {
            attacker.attack = 2;
            defender.defense = 2;
            randomStub.returns(0.5);
            service.handleAttackAction(lobbyId, attacker, defender);
            const args = (chainable.emit as sinon.SinonStub).getCall(0).args[1];
            const expectedAttackDice = Math.floor(0.5 * GameSocketConstants.D6Value) + 1;
            const expectedDefenseDice = Math.floor(0.5 * GameSocketConstants.D4Value) + 1;
            const expectedDamage = Math.max(0, expectedAttackDice + attacker.attack - expectedDefenseDice - defender.defense);
            expect(args.attackRoll).to.equal(expectedAttackDice + attacker.attack);
            expect(args.defenseRoll).to.equal(expectedDefenseDice + defender.defense);
            expect(args.damage).to.equal(expectedDamage);
            expect(args.attackerHP).to.equal(attacker.life);
        });
        it('should trigger handleFlee for defensive virtual player when injured and escape attempts < 2', () => {
            const clock = sinon.useFakeTimers();
            const handleFleeSpy = sandbox.spy(service, 'handleFlee' as any);

            defender.virtualPlayerData = { profile: 'defensive' };
            defender.life = 5;
            defender.maxLife = 10;
            defender.amountEscape = 0;

            service.handleAttackAction(lobbyId, attacker, defender);

            sinon.assert.calledWith(chainable.emit, 'attackResult', sinon.match.object);

            clock.tick(GameSocketConstants.CombatTurnDelay);

            sinon.assert.calledOnce(handleFleeSpy);
            sinon.assert.calledWithExactly(handleFleeSpy, lobbyId, defender);

            clock.restore();
        });
    });

    describe('handleFlee', () => {
        let randomStub: sinon.SinonStub;
        const lobbyId = 'lobbyFlee';
        let state: GameState;
        let fleeingPlayer: Player;
        let opponent: Player;

        beforeEach(() => {
            state = createGameState();
            gameStates.set(lobbyId, state);
            fleeingPlayer = state.players[0];
            opponent = state.players[1];
            opponent.virtualPlayerData = { profile: 'aggressive' };
            randomStub = sandbox.stub(Math, 'random').returns(0.1);
            chainable.emit.resetHistory();
        });

        afterEach(() => {
            randomStub.restore();
        });

        it('should emit FleeFailure if amountEscape >= 2', () => {
            fleeingPlayer.amountEscape = 2;
            chainable.emit.resetHistory();
            service.handleFlee(lobbyId, fleeingPlayer);
            sinon.assert.calledWith(chainable.emit, GameEvents.FleeFailure, { fleeingPlayer });
        });

        it('should reset amountEscape (to 0) on successful flee and emit FleeSuccess and BoardModified', () => {
            state.debug = true;
            fleeingPlayer.amountEscape = 0;
            chainable.emit.resetHistory();
            service.handleFlee(lobbyId, fleeingPlayer);
            expect(fleeingPlayer.amountEscape).to.equal(0);
            sinon.assert.calledWith(chainable.emit, GameEvents.FleeSuccess, { fleeingPlayer, isSuccessful: true });
            sinon.assert.calledWith(chainable.emit, GameEvents.BoardModified, { gameState: state });
        });

        it('should schedule virtual combat turn on unsuccessful flee', (done) => {
            randomStub.returns(0.9);
            const clock = sinon.useFakeTimers();
            chainable.emit.resetHistory();
            service.handleFlee(lobbyId, fleeingPlayer);
            sinon.assert.calledWith(chainable.emit, GameEvents.FleeFailure, { fleeingPlayer });
            clock.tick(GameSocketConstants.CombatTurnDelay);
            clock.restore();
            done();
        });
        it('should schedule virtual combat turn when amountEscape >= 2 and opponent is virtual', () => {
            const clock = sinon.useFakeTimers();
            const handleVirtualCombatTurnSpy = sandbox.spy(service, 'handleVirtualCombatTurn' as any);
            fleeingPlayer.amountEscape = 2;
            opponent.life = 10;
            service.handleFlee(lobbyId, fleeingPlayer);

            expect(state.currentPlayer).to.equal(opponent.id);
            sinon.assert.calledWith(chainable.emit, GameEvents.FleeFailure, { fleeingPlayer });

            clock.tick(GameSocketConstants.CombatTurnDelay);

            sinon.assert.calledOnce(handleVirtualCombatTurnSpy);
            sinon.assert.calledWithExactly(handleVirtualCombatTurnSpy, lobbyId, opponent, fleeingPlayer, opponent);

            clock.restore();
        });

        it('should trigger virtual movement on successful flee when opponent is virtual with MP > 0', () => {
            fleeingPlayer.amountEscape = 0;
            opponent.currentMP = 5;
            opponent.life = 10;
            state.debug = true;

            (virtualService.performTurn as sinon.SinonStub).resetHistory();
            (virtualService.handleVirtualMovement as sinon.SinonStub).resetHistory();

            service.handleFlee(lobbyId, fleeingPlayer);

            expect(fleeingPlayer.amountEscape).to.equal(0);
            sinon.assert.calledWith(chainable.emit, GameEvents.FleeSuccess, { fleeingPlayer, isSuccessful: true });
            sinon.assert.calledWith(chainable.emit, GameEvents.BoardModified, { gameState: state });

            sinon.assert.calledOnce(virtualService.performTurn as sinon.SinonStub);
            const callbackArg = (virtualService.performTurn as sinon.SinonStub).getCall(0).args[0];
            expect(typeof callbackArg).to.equal('function');

            callbackArg();

            sinon.assert.called(virtualService.handleVirtualMovement as sinon.SinonStub);
            const config = (virtualService.handleVirtualMovement as sinon.SinonStub).getCall(0).args[0] as VirtualMovementConfig;
            expect(config.lobbyId).to.equal(lobbyId);
            expect(config.virtualPlayer).to.equal(opponent);
            expect(config.getGameState()).to.deep.equal(state);
            expect(config.boardService).to.equal(boardService);
            expect(config.gameState).to.deep.equal(state);
            expect(config.callbacks).to.include.keys('handleRequestMovement', 'handleEndTurn', 'startBattle', 'delay', 'handleOpenDoor');
        });
    });

    describe('getGameStateOrEmitError', () => {
        it('should emit error and return null when game state is missing', () => {
            const result = service.getGameStateOrEmitError(fakeSocket as Socket, 'nonexistent');
            expect(result).to.equal(null);
            sinon.assert.calledWith(fakeSocket.emit as sinon.SinonStub, GameEvents.Error, gameSocketMessages.gameNotFound);
        });

        it('should return game state when found', () => {
            const lobbyId = 'lobbyState';
            const gameState = createGameState();
            gameStates.set(lobbyId, gameState);
            const result = service.getGameStateOrEmitError(fakeSocket as Socket, lobbyId);
            expect(result).to.deep.equal(gameState);
        });
    });

    describe('Private methods indirectly tested', () => {
        it('getDiceValue should return proper values for D4, D6 and default for unknown', () => {
            const d4 = service['getDiceValue']('D4');
            const d6 = service['getDiceValue']('D6');
            const unk = service['getDiceValue']('XYZ');
            expect(d4).to.equal(GameSocketConstants.D4Value);
            expect(d6).to.equal(GameSocketConstants.D6Value);
            expect(unk).to.equal(0);
        });

        it('isPlayerOnIceTile should return true if player is on an Ice tile', () => {
            const state = createGameState();
            state.board[0][0] = TileTypes.Ice;
            const result = service['isPlayerOnIceTile'](state, state.players[0]);
            expect(result).to.equal(true);
        });

        it('isPlayerOnIceTile should return false if player not found', () => {
            const state = createGameState();
            const fakePlayer: Player = { ...state.players[0], id: 'unknown' };
            const result = service['isPlayerOnIceTile'](state, fakePlayer);
            expect(result).to.equal(false);
        });
    });
});
