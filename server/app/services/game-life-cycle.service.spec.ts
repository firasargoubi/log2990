/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { GameEvents } from '@common/events';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { ObjectsTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { SinonSandbox, SinonStub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { BoardService } from './board.service';
import { GameActionService } from './game-action.service';
import { GameLifecycleService } from './game-life-cycle.service';
import { ItemService } from './item.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';
import { PathfindingService } from './pathfinding.service';
import { VirtualPlayerService } from './virtual-player.service';

const TILE_DOOR_OPEN = 3;
const ANIMATION_DELAY_MS = 100;
// const PLAYER_TEAM_CONST = 0.5;

describe('GameLifecycleService', () => {
    let sandbox: SinonSandbox;
    let service: GameLifecycleService;
    let boardService: BoardService;
    let lobbyService: LobbySocketHandlerService;
    let pathfindingService: PathfindingService;
    let itemService: ItemService;
    let virtualService: VirtualPlayerService;
    let gameActionService: GameActionService;
    let lobbies: Map<string, GameLobby>;
    let gameStates: Map<string, GameState>;
    let socket: Partial<Socket>;
    let io: Partial<Server>;
    let chainable: { to: SinonStub; emit: SinonStub };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        lobbies = new Map();
        gameStates = new Map();

        chainable = {
            to: sandbox.stub().returnsThis(),
            emit: sandbox.stub(),
        };

        boardService = {
            initializeGameState: sandbox.stub().resolves({ gameMode: 'default' } as GameState),
            handleTurn: sandbox.stub(),
            handleEndTurn: sandbox.stub(),
            handleBoardChange: sandbox.stub(),
            handleMovement: sandbox.stub().returns({ gameState: {} as GameState, shouldStop: false }),
            updatePlayerMoves: sandbox.stub(),
            findAllPaths: sandbox.stub().returns([]),
            findShortestPath: sandbox.stub().returns([]),
        } as unknown as BoardService;

        lobbyService = {
            updateLobby: sandbox.stub(),
        } as unknown as LobbySocketHandlerService;

        pathfindingService = {
            findClosestAvailableSpot: sandbox.stub().returns({ x: 0, y: 0 }),
        } as unknown as PathfindingService;

        itemService = {
            dropItems: sandbox.stub(),
        } as unknown as ItemService;

        virtualService = {
            handleVirtualMovement: sandbox.stub(),
            performTurn: sandbox.stub().callsArg(0),
        } as unknown as VirtualPlayerService;

        gameActionService = {
            setGameLifecycleService: sandbox.stub(),
            startBattle: sandbox.stub(),
            itemEvent: sandbox.stub(),
        } as unknown as GameActionService;

        io = {
            to: sandbox.stub().returns(chainable),
        } as unknown as Server;

        socket = {
            id: 'player1',
            emit: sandbox.stub(),
        };

        service = new GameLifecycleService(
            lobbies,
            gameStates,
            boardService,
            lobbyService,
            pathfindingService,
            virtualService,
            gameActionService,
            itemService,
        );
        service.setServer(io as Server);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should set gameLifecycleService in gameActionService', () => {
            sinon.assert.calledOnce(gameActionService.setGameLifecycleService as SinonStub);
            sinon.assert.calledWithExactly(gameActionService.setGameLifecycleService as SinonStub, service);
        });
    });

    describe('setServer', () => {
        it('should set io server', () => {
            const newIo = { to: sandbox.stub() } as unknown as Server;
            service.setServer(newIo);
            expect((service as any).io).to.equal(newIo);
        });
    });

    describe('handleRequestStart', () => {
        it('should emit error if lobby not found', async () => {
            await service.handleRequestStart(socket as Socket, 'lobby1');
            sinon.assert.calledWith(socket.emit as SinonStub, GameEvents.Error, gameSocketMessages.lobbyNotFound);
        });

        it('should emit error if player is not host', async () => {
            lobbies.set('lobby1', { players: [{ id: 'player1', isHost: false }], isLocked: false } as GameLobby);
            await service.handleRequestStart(socket as Socket, 'lobby1');
            sinon.assert.calledWith(socket.emit as SinonStub, GameEvents.Error, gameSocketMessages.onlyHostStart);
        });

        it('should emit error if capture mode has odd number of players', async () => {
            const lobby = {
                players: [
                    { id: 'player1', isHost: true },
                    { id: 'player2', isHost: false },
                    { id: 'player3', isHost: false },
                ],
                isLocked: false,
            } as GameLobby;
            lobbies.set('lobby1', lobby);
            (boardService.initializeGameState as SinonStub).resolves({ gameMode: 'capture' } as GameState);

            await service.handleRequestStart(socket as Socket, 'lobby1');

            sinon.assert.calledWith(socket.emit as SinonStub, GameEvents.Error, gameSocketMessages.notEnoughPlayers);
        });

        it('should start game and call startTurn if valid', async () => {
            const lobby = { players: [{ id: 'player1', isHost: true }], isLocked: false } as GameLobby;
            const gameState = { gameMode: 'default' } as GameState;
            lobbies.set('lobby1', lobby);
            (boardService.initializeGameState as SinonStub).resolves(gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);
            const startTurnSpy = sandbox.spy(service, 'startTurn' as any);

            await service.handleRequestStart(socket as Socket, 'lobby1');

            expect(gameStates.get('lobby1')).to.equal(gameState);
            expect(lobby.isLocked).to.equal(true);
            sinon.assert.calledWith(chainable.emit, GameEvents.GameStarted, { gameState });
            sinon.assert.calledOnceWithExactly(startTurnSpy, 'lobby1');
        });

        it('should emit error on exception', async () => {
            const lobby = { players: [{ id: 'player1', isHost: true }], isLocked: false } as GameLobby;
            lobbies.set('lobby1', lobby);
            (boardService.initializeGameState as SinonStub).rejects(new Error('Init failed'));
            await service.handleRequestStart(socket as Socket, 'lobby1');
            sinon.assert.calledWithMatch(socket.emit as SinonStub, GameEvents.Error, /Init failed/);
        });
    });

    describe('handleEndTurn', () => {
        it('should emit error if game not found', () => {
            service.handleEndTurn(socket as Socket, 'lobby1');
            sinon.assert.calledWith(socket.emit as SinonStub, GameEvents.Error, gameSocketMessages.gameNotFound);
        });

        it('should emit error if not current player', () => {
            gameStates.set('lobby1', { currentPlayer: 'player2' } as GameState);
            service.handleEndTurn(socket as Socket, 'lobby1');
            sinon.assert.calledWith(socket.emit as SinonStub, GameEvents.Error, gameSocketMessages.notYourTurn);
        });

        it('should end turn and start next if valid', () => {
            const gameState = { currentPlayer: 'player1' } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleEndTurn as SinonStub).returns(gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);
            const startTurnSpy = sandbox.spy(service, 'startTurn' as any);

            service.handleEndTurn(socket as Socket, 'lobby1');

            expect(gameStates.get('lobby1')).to.equal(gameState);
            sinon.assert.calledOnceWithExactly(startTurnSpy, 'lobby1');
        });

        it('should emit error on exception', () => {
            const gameState = { currentPlayer: 'player1' } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleEndTurn as SinonStub).throws(new Error('End turn failed'));
            service.handleEndTurn(socket as Socket, 'lobby1');
            sinon.assert.calledWithMatch(socket.emit as SinonStub, GameEvents.Error, /End turn failed/);
        });
    });

    describe('startTurn', () => {
        it('should return if game not found', () => {
            service.startTurn('lobby1');
            sinon.assert.notCalled(chainable.emit);
        });

        it('should update game state and emit TurnStarted for non-virtual player', () => {
            const gameState = { currentPlayer: 'player1', players: [{ id: 'player1' }] } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.startTurn('lobby1');

            expect(gameStates.get('lobby1')).to.equal(gameState);
            sinon.assert.calledWith(chainable.emit, GameEvents.TurnStarted, { gameState });
            sinon.assert.notCalled(virtualService.handleVirtualMovement as SinonStub);
        });

        it('should trigger virtual movement for virtual player', () => {
            const gameState = {
                currentPlayer: 'player1',
                players: [{ id: 'player1', virtualPlayerData: { profile: 'aggressive' } }],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.startTurn('lobby1');

            sinon.assert.calledWith(chainable.emit, GameEvents.TurnStarted, { gameState });
            sinon.assert.calledOnce(virtualService.handleVirtualMovement as SinonStub);
            const config = (virtualService.handleVirtualMovement as SinonStub).getCall(0).args[0];
            expect(config.lobbyId).to.equal('lobby1');
            expect(config.virtualPlayer).to.equal(gameState.players[0]);
            expect(config.gameState).to.equal(gameState);
            expect(config.callbacks).to.include.keys('handleRequestMovement', 'handleEndTurn', 'startBattle', 'delay', 'handleOpenDoor');
        });

        it('should emit error on exception', () => {
            const gameState = { currentPlayer: 'player1', players: [{ id: 'player1' }] } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).throws(new Error('Turn failed'));

            service.startTurn('lobby1');
        });

        it('should provide getGameState callback that returns current game state', () => {
            const gameState = {
                currentPlayer: 'player1',
                players: [{ id: 'player1', virtualPlayerData: { profile: 'aggressive' } }],
                board: [[]],
                spawnPoints: [],
                playerPositions: [],
            } as unknown as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.startTurn('lobby1');

            sinon.assert.calledOnce(virtualService.handleVirtualMovement as SinonStub);
            const config = (virtualService.handleVirtualMovement as SinonStub).args[0][0];
            expect(config.getGameState()).to.equal(gameState);
        });

        it('should provide getGameState callback that reflects updated state', () => {
            const initialGameState = {
                currentPlayer: 'player1',
                players: [{ id: 'player1', virtualPlayerData: { profile: 'aggressive' } }],
                board: [[]],
                spawnPoints: [],
                playerPositions: [],
            } as unknown as GameState;
            gameStates.set('lobby1', initialGameState);
            (boardService.handleTurn as SinonStub).returns(initialGameState);

            service.startTurn('lobby1');

            const updatedGameState = {
                ...initialGameState,
                currentPlayer: 'player2',
            } as unknown as GameState;
            gameStates.set('lobby1', updatedGameState);

            sinon.assert.calledOnce(virtualService.handleVirtualMovement as SinonStub);
            const config = (virtualService.handleVirtualMovement as SinonStub).args[0][0];
            expect(config.getGameState()).to.equal(updatedGameState);
        });
    });

    describe('handlePlayersUpdate', () => {
        it('should emit error if game not found', () => {
            service.handlePlayersUpdate(socket as Socket, 'lobby1', []);
            sinon.assert.calledWith(socket.emit as SinonStub, GameEvents.Error, gameSocketMessages.gameNotFound);
        });

        it('should remove deleted player and update state', () => {
            const gameState = {
                players: [{ id: 'player1' }, { id: 'player2' }],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                board: [[100], [0]],
                currentPlayer: 'player1',
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.handlePlayersUpdate(socket as Socket, 'lobby1', [
                {
                    id: 'player2',
                    pendingItem: 0,
                    name: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            ]);

            expect(gameState.players.length).to.equal(1);
            expect(gameState.players[0].id).to.equal('player2');
            expect(gameState.currentPlayer).to.equal('player2');
            expect(gameState.board[0][0]).to.equal(0);
            expect(gameState.deletedPlayers).to.deep.include({ id: 'player1' });
            sinon.assert.calledWith(chainable.emit, GameEvents.BoardModified, { gameState });
        });

        it('should not modify state if no player deleted', () => {
            const gameState = {
                players: [{ id: 'player1' }],
                spawnPoints: [{ x: 0, y: 0 }],
                playerPositions: [{ x: 0, y: 0 }],
                board: [[100]],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.handlePlayersUpdate(socket as Socket, 'lobby1', [
                {
                    id: 'player1',
                    pendingItem: 0,
                    name: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            ]);

            expect(gameState.players.length).to.equal(1);
            expect(gameState.deletedPlayers).to.be.equal(undefined);
            sinon.assert.calledWith(chainable.emit, GameEvents.BoardModified, { gameState });
        });
    });

    describe('handleDefeat', () => {
        it('should return if game not found', () => {
            service.handleDefeat('lobby1', { id: 'player1' } as Player, { id: 'player2' } as Player);
            sinon.assert.notCalled(chainable.emit);
        });

        it('should return if players not found', () => {
            gameStates.set('lobby1', { players: [] } as GameState);
            service.handleDefeat('lobby1', { id: 'player1' } as Player, { id: 'player2' } as Player);
            sinon.assert.notCalled(chainable.emit);
        });

        it('should reset loser and winner, emit combatEnded, and proceed with turn for non-virtual winner', () => {
            const gameState = {
                players: [
                    { id: 'player1', life: 5, maxLife: 10 },
                    { id: 'player2', life: 0, maxLife: 10, items: ['item'] },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                board: [[0], [0]],
                currentPlayer: 'player1',
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.handleDefeat('lobby1', gameState.players[0], gameState.players[1]);

            expect(gameState.players[1].life).to.equal(10);
            expect(gameState.players[1].items).to.deep.equal([]);
            expect(gameState.players[0].life).to.equal(10);
            expect(gameState.players[0].currentAP).to.equal(0);
            sinon.assert.calledOnce(itemService.dropItems as SinonStub);
            sinon.assert.calledWith(chainable.emit, 'combatEnded', { loser: gameState.players[1] });
            sinon.assert.calledWith(chainable.emit, GameEvents.BoardModified, { gameState });
        });

        it('should use pathfinding if spawn is occupied', () => {
            const gameState = {
                players: [
                    { id: 'player1', life: 5, maxLife: 10 },
                    { id: 'player2', life: 0, maxLife: 10, items: ['item'] },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 1, y: 1 },
                    { x: 0, y: 0 },
                ],
                board: [[0], [0]],
                currentPlayer: 'player1',
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);
            (pathfindingService.findClosestAvailableSpot as SinonStub).returns({ x: 2, y: 2 });

            service.handleDefeat('lobby1', gameState.players[0], gameState.players[1]);

            sinon.assert.calledOnce(pathfindingService.findClosestAvailableSpot as SinonStub);
            expect(gameState.playerPositions[1]).to.deep.equal({ x: 2, y: 2 });
        });

        it('should trigger virtual movement for virtual winner with MP', () => {
            const gameState = {
                players: [
                    { id: 'player1', life: 5, maxLife: 10, virtualPlayerData: { profile: 'aggressive' }, currentMP: 5 },
                    { id: 'player2', life: 0, maxLife: 10 },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                board: [[0], [0]],
            } as GameState;
            gameStates.set('lobby1', gameState);

            service.handleDefeat('lobby1', gameState.players[0], gameState.players[1]);

            sinon.assert.calledOnce(virtualService.performTurn as SinonStub);
            sinon.assert.calledOnce(virtualService.handleVirtualMovement as SinonStub);
        });

        it('should end turn for virtual winner with no MP', () => {
            const gameState = {
                players: [
                    { id: 'player1', life: 5, maxLife: 10, virtualPlayerData: { profile: 'aggressive' }, currentMP: 0 },
                    { id: 'player2', life: 0, maxLife: 10 },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                board: [[0], [0]],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleEndTurn as SinonStub).returns(gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.handleDefeat('lobby1', gameState.players[0], gameState.players[1]);

            sinon.assert.calledOnce(boardService.handleEndTurn as SinonStub);
            expect(gameStates.get('lobby1')).to.equal(gameState);
        });

        it('should end turn if loser is current player', () => {
            const gameState = {
                currentPlayer: 'player2',
                players: [
                    { id: 'player1', life: 5, maxLife: 10 },
                    { id: 'player2', life: 0, maxLife: 10 },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                board: [[0], [0]],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleEndTurn as SinonStub).returns(gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.handleDefeat('lobby1', gameState.players[0], gameState.players[1]);

            sinon.assert.calledOnce(boardService.handleEndTurn as SinonStub);
        });

        it('should provide getGameState callback that returns initial game state to virtual movement', () => {
            const gameState = {
                players: [
                    { id: 'player1', life: 5, maxLife: 10, virtualPlayerData: { profile: 'aggressive' }, currentMP: 5 },
                    { id: 'player2', life: 0, maxLife: 10 },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                board: [[0], [0]],
            } as GameState;
            gameStates.set('lobby1', gameState);

            (virtualService.handleVirtualMovement as SinonStub).callsFake((c) => {
                expect(c.getGameState()).to.equal(gameState);
            });

            service.handleDefeat('lobby1', gameState.players[0], gameState.players[1]);

            sinon.assert.calledOnce(virtualService.performTurn as SinonStub);
            sinon.assert.calledOnce(virtualService.handleVirtualMovement as SinonStub);
            const config = (virtualService.handleVirtualMovement as SinonStub).args[0][0];
            expect(config.lobbyId).to.equal('lobby1');
            expect(config.virtualPlayer).to.equal(gameState.players[0]);
        });
    });

    describe('handleRequestMovement', () => {
        it('should process single movement and emit movementProcessed', async () => {
            const gameState = {
                players: [{ id: 'player1' }],
                playerPositions: [{ x: 0, y: 0 }],
                spawnPoints: [{ x: 0, y: 0 }],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).returns({ gameState, shouldStop: false });
            (boardService.updatePlayerMoves as SinonStub).returns(gameState);

            await service.handleRequestMovement(socket as Socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ]);

            expect(gameState.animation).to.equal(false);
            sinon.assert.calledWith(chainable.emit, 'movementProcessed', { gameState });
        });

        it('should set animation to true for multiple coordinates', async () => {
            const gameState = {
                players: [{ id: 'player1' }],
                playerPositions: [{ x: 0, y: 0 }],
                spawnPoints: [{ x: 0, y: 0 }],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).returns({ gameState, shouldStop: false });
            (boardService.updatePlayerMoves as SinonStub).returns(gameState);

            await service.handleRequestMovement(socket as Socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ]);

            expect(gameState.animation).to.equal(false);
            sinon.assert.calledTwice(chainable.emit);
        });

        it('should stop and handle inventory full', async () => {
            const gameState = {
                players: [{ id: 'player1', pendingItem: 1, items: [] }],
                playerPositions: [{ x: 0, y: 0 }],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).returns({ gameState, shouldStop: true });
            (boardService.updatePlayerMoves as SinonStub).returns(gameState);

            await service.handleRequestMovement(socket as Socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ]);

            sinon.assert.calledWith(socket.emit as SinonStub, 'inventoryFull', { item: 1, currentInventory: [] });
        });

        it('should end game if flag captured at spawn', async () => {
            const gameState = {
                players: [{ id: 'player1', items: [ObjectsTypes.FLAG] }],
                playerPositions: [{ x: 0, y: 0 }],
                spawnPoints: [{ x: 0, y: 0 }],
                teams: { team1: [{ id: 'player1', name: 'Player1' }], team2: [] },
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).returns({ gameState, shouldStop: false });
            (boardService.updatePlayerMoves as SinonStub).returns(gameState);

            await service.handleRequestMovement(socket as Socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 0, y: 0 },
            ]);

            sinon.assert.calledWith(chainable.emit, 'gameOver', { winner: 'Player1' });
        });

        it('should emit error on exception', async () => {
            const gameState = { players: [{ id: 'player1' }], playerPositions: [{ x: 0, y: 0 }] } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).throws(new Error('Move failed'));

            await service.handleRequestMovement(socket as Socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ]);

            sinon.assert.calledWithMatch(socket.emit as SinonStub, GameEvents.Error, /Move failed/);
        });

        it('should reset animation and emit movementProcessed when movement stops due to shouldStop', async () => {
            const gameState = {
                players: [{ id: 'player1', pendingItem: 0 }],
                playerPositions: [{ x: 0, y: 0 }],
                spawnPoints: [{ x: 0, y: 0 }],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).returns({ gameState, shouldStop: true });
            (boardService.updatePlayerMoves as SinonStub).returns(gameState);

            await service.handleRequestMovement(socket as Socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ]);

            expect(gameState.animation).to.equal(false);
            expect(gameStates.get('lobby1')).to.equal(gameState);
            sinon.assert.calledWith(chainable.emit, 'movementProcessed', { gameState });
            sinon.assert.notCalled(socket.emit as SinonStub);
        });

        it('should emit gameOver with team2 player names when Blue team wins with flag at spawn', async () => {
            const gameState = {
                players: [
                    {
                        id: 'player1',
                        items: [ObjectsTypes.FLAG],
                    },
                ],
                playerPositions: [{ x: 0, y: 0 }],
                spawnPoints: [{ x: 0, y: 0 }],
                teams: {
                    team1: [{ id: 'player2', name: 'Alice' }],
                    team2: [
                        { id: 'player1', name: 'Bob' },
                        { id: 'player3', name: 'Charlie' },
                    ],
                },
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).returns({ gameState, shouldStop: false });
            (boardService.updatePlayerMoves as SinonStub).returns(gameState);

            await service.handleRequestMovement(socket as Socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 0, y: 0 },
            ]);

            expect(gameState.animation).to.equal(false);
            expect(gameStates.get('lobby1')).to.equal(gameState);
            sinon.assert.calledWith(chainable.emit, 'movementProcessed', { gameState });
            sinon.assert.calledWith(chainable.emit, 'gameOver', { winner: 'Bob, Charlie' });
        });

        it('should emit gameOver with "Unknown" when Blue team wins but team2 is undefined', async () => {
            const gameState = {
                players: [
                    {
                        id: 'player1',
                        items: [ObjectsTypes.FLAG],
                    },
                ],
                playerPositions: [{ x: 0, y: 0 }],
                spawnPoints: [{ x: 0, y: 0 }],
                teams: {
                    team1: [{ id: 'player2', name: 'Alice' }],
                    team2: undefined,
                },
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).returns({ gameState, shouldStop: false });
            (boardService.updatePlayerMoves as SinonStub).returns(gameState);

            await service.handleRequestMovement(socket as Socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 0, y: 0 },
            ]);

            expect(gameState.animation).to.equal(false);
            expect(gameStates.get('lobby1')).to.equal(gameState);
            sinon.assert.calledWith(chainable.emit, 'movementProcessed', { gameState });
            sinon.assert.calledWith(chainable.emit, 'gameOver', { winner: 'Unknown' });
        });
    });

    describe('handleInventoryFull', () => {
        it('should emit inventoryFull and update state', () => {
            const gameState = { animation: true } as GameState;
            const player: Player = {
                id: 'player1',
                name: 'Alice',
                avatar: 'avatar1',
                isHost: false,
                pendingItem: 1,
                items: [ObjectsTypes.BOOTS, ObjectsTypes.CRYSTAL],
                attack: 0,
                defense: 0,
                speed: 0,
                life: 0,
                maxLife: 0,
                currentAP: 0,
                winCount: 0,
                amountEscape: 0,
                virtualPlayerData: undefined,
            };

            service.handleInventoryFull(gameState, player, socket as Socket, 'lobby1');

            expect(gameState.animation).to.equal(false);
            sinon.assert.calledWith(socket.emit as SinonStub, 'inventoryFull', {
                item: 1,
                currentInventory: [ObjectsTypes.BOOTS, ObjectsTypes.CRYSTAL],
            });
            sinon.assert.calledWith(chainable.emit, 'movementProcessed', { gameState });
        });
    });

    describe('createTeams', () => {
        it('should return if game not found', () => {
            service.createTeams('lobby1', []);
            sinon.assert.notCalled(chainable.emit);
        });

        it('should return if teams already exist', () => {
            gameStates.set('lobby1', { teams: { team1: [], team2: [] } } as GameState);
            service.createTeams('lobby1', []);
            sinon.assert.notCalled(chainable.emit);
        });

        it('should create and emit teams', () => {
            const gameState = { players: [] } as GameState;
            gameStates.set('lobby1', gameState);
            const players = [{ id: 'player1' }, { id: 'player2' }] as Player[];
            sandbox.stub(Math, 'random').returns(0.4);

            service.createTeams('lobby1', players);
            const updatedGameState = gameStates.get('lobby1');

            expect(updatedGameState.teams.team1.length).to.equal(1);
            sinon.assert.calledWith(chainable.emit, GameEvents.TeamsCreated, sinon.match.any);
        });
    });

    describe('handleSetDebug', () => {
        it('should emit error if game not found', () => {
            service.handleSetDebug(socket as Socket, 'lobby1', true);
            sinon.assert.calledWith(socket.emit as SinonStub, 'error', 'Game not found.');
        });

        it('should set debug mode and emit boardModified', () => {
            const gameState = {} as GameState;
            gameStates.set('lobby1', gameState);

            service.handleSetDebug(socket as Socket, 'lobby1', true);
            const updatedGameState = gameStates.get('lobby1');

            expect(updatedGameState.debug).to.equal(true);
            sinon.assert.calledWith(chainable.emit, 'boardModified', { gameState: updatedGameState });
        });
    });

    describe('getGameStateOrEmitError', () => {
        it('should return null and emit error if game not found', () => {
            const result = service.getGameStateOrEmitError(socket as Socket, 'lobby1');
            expect(result).to.equal(null);
            sinon.assert.calledWith(socket.emit as SinonStub, GameEvents.Error, gameSocketMessages.gameNotFound);
        });

        it('should return game state if found', () => {
            const gameState = {} as GameState;
            gameStates.set('lobby1', gameState);
            const result = service.getGameStateOrEmitError(socket as Socket, 'lobby1');
            expect(result).to.equal(gameState);
            sinon.assert.notCalled(socket.emit as SinonStub);
        });
    });

    describe('openDoor', () => {
        it('should return if game not found', () => {
            service.openDoor(socket as Socket, { x: 0, y: 0 }, 'lobby1');
            sinon.assert.calledWith(socket.emit as SinonStub, GameEvents.Error, gameSocketMessages.gameNotFound);
        });

        it('should open door and update state', () => {
            const gameState = {
                players: [{ id: 'player1', currentAP: 5 }],
                currentPlayer: 'player1',
                board: [[100], [0]],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.openDoor(socket as Socket, { x: 0, y: 0 }, 'lobby1');

            expect(gameState.board[0][0]).to.equal(TILE_DOOR_OPEN);
            expect(gameState.currentPlayerActionPoints).to.equal(0);
            expect(gameState.players[0].currentAP).to.equal(0);
            sinon.assert.calledWith(chainable.emit, GameEvents.BoardModified, { gameState });
        });
    });

    describe('delay', () => {
        it('should resolve after specified ms', async () => {
            const clock = sinon.useFakeTimers();
            const promise = service['delay'](ANIMATION_DELAY_MS);
            clock.tick(ANIMATION_DELAY_MS);
            await promise;
            expect(true).to.equal(true);
            clock.restore();
        });
    });
});
