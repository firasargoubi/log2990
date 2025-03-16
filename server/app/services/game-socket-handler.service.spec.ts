/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoardService } from '@app/services/board.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { expect } from 'chai';
import { createSandbox, SinonSandbox, SinonSpy, SinonStub } from 'sinon';

describe('GameSocketHandlerService', () => {
    let sandbox: SinonSandbox;
    let lobbies: Map<string, GameLobby>;
    let gameStates: Map<string, GameState>;
    let boardService: BoardService;
    let lobbySocketHandlerService: LobbySocketHandlerService;
    let service: GameSocketHandlerService;
    let socket: any;

    let emitSpy: SinonSpy;
    let ioToStub: SinonStub;

    beforeEach(() => {
        sandbox = createSandbox();
        lobbies = new Map<string, GameLobby>();
        gameStates = new Map<string, GameState>();

        boardService = {
            initializeGameState: sandbox.stub(),
            handleEndTurn: sandbox.stub(),
            handleMovement: sandbox.stub(),
            findShortestPath: sandbox.stub(),
            handleTurn: sandbox.stub(),
        } as any;

        lobbySocketHandlerService = {
            updateLobby: sandbox.spy(),
        } as any;

        service = new GameSocketHandlerService(lobbies, gameStates, boardService, lobbySocketHandlerService);
        ioToStub = sandbox.stub().returns({ emit: sandbox.spy() });
        service['io'] = { to: ioToStub } as any;

        emitSpy = sandbox.spy();
        socket = { id: 'socket1', emit: emitSpy };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should emit error if lobby not found in handleRequestStart', async () => {
        await service.handleRequestStart(socket, 'unknown');
        expect(emitSpy.calledWith('error', 'Lobby not found.')).to.equal(true);
    });

    it('should emit error if player not host in handleRequestStart', async () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [{ id: 'socket1', isHost: false } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);
        await service.handleRequestStart(socket, 'lobby1');
        expect(emitSpy.calledWith('error', 'Only the host can start the game.')).to.equal(true);
    });

    it('should handleRequestStart successfully', async () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [{ id: 'socket1', isHost: true } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        const gameState: GameState = {
            currentPlayer: 'socket1',
            availableMoves: [],
            currentPlayerMovementPoints: 3,
            playerPositions: new Map([['socket1', { x: 0, y: 0 }]]),
        } as any;
        (boardService.initializeGameState as any).resolves(gameState);
        lobbies.set('lobby1', lobby);

        await service.handleRequestStart(socket, 'lobby1');

        expect(gameStates.get('lobby1')).to.equal(gameState);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should emit error on gameState not found in handleEndTurn', () => {
        service.handleEndTurn(socket, 'lobbyX');
        expect(emitSpy.calledWith('error', 'Game not found.')).to.equal(true);
    });

    it('should emit error if not currentPlayer in handleEndTurn', () => {
        const gameState = { currentPlayer: 'other' } as GameState;
        gameStates.set('lobby1', gameState);
        service.handleEndTurn(socket, 'lobby1');
        expect(emitSpy.calledWith('error', "It's not your turn.")).to.equal(true);
    });

    it('should handleEndTurn successfully', () => {
        const gameState: GameState = { currentPlayer: 'socket1' } as any;
        const updatedGameState = { currentPlayer: 'socket2', availableMoves: [], playerPositions: new Map() } as any;
        (boardService.handleEndTurn as any).returns(updatedGameState);
        (boardService.handleTurn as any).returns(updatedGameState);
        gameStates.set('lobby1', gameState);
        service.handleEndTurn(socket, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should emit error if gameState not found in handleRequestMovement', () => {
        service.handleRequestMovement(socket, 'lobbyX', [{ x: 0, y: 0 }]);
        expect(emitSpy.calledWith('error', 'Game not found.')).to.equal(true);
    });

    it('should emit error if not currentPlayer in handleRequestMovement', () => {
        const gs = { currentPlayer: 'other' } as GameState;
        gameStates.set('lobby1', gs);
        service.handleRequestMovement(socket, 'lobby1', [{ x: 0, y: 0 }]);
        expect(emitSpy.calledWith('error', "It's not your turn.")).to.equal(true);
    });

    it('should emit error if invalid move in handleRequestMovement', () => {
        const gs = { currentPlayer: 'socket1', availableMoves: [] } as GameState;
        gameStates.set('lobby1', gs);
        service.handleRequestMovement(socket, 'lobby1', [{ x: 1, y: 1 }]);
        expect(emitSpy.calledWith('error', 'Invalid move.')).to.equal(true);
    });

    it('should handleRequestMovement and call endTurn if no moves left', () => {
        const gs = {
            currentPlayer: 'socket1',
            availableMoves: [{ x: 1, y: 1 }],
            playerPositions: new Map(),
        } as unknown as GameState;
        const updated = { currentPlayer: 'socket2', availableMoves: [], playerPositions: new Map() } as any;
        (boardService.handleMovement as any).returns(updated);
        (boardService.handleTurn as any).returns(updated);
        gameStates.set('lobby1', gs);
        service.handleRequestMovement(socket, 'lobby1', [{ x: 1, y: 1 }]);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should call handleEndTurnInternally correctly', () => {
        const gs: GameState = {} as GameState;
        (boardService.handleEndTurn as any).returns(gs);
        const result = service.handleEndTurnInternally(gs);
        expect(result).to.equal(gs);
    });
    it('should set server correctly', () => {
        const fakeServer = {} as any;
        service.setServer(fakeServer);
        expect((service as any).io).to.equal(fakeServer);
    });
    it('should set empty array if availableMoves is undefined in startTurn', () => {
        const gs: GameState = {
            currentPlayer: 'socket1',
            currentPlayerMovementPoints: 3,
            playerPositions: new Map(),
        } as any;

        gameStates.set('lobby1', gs);
        (boardService.handleTurn as any).returns({ ...gs, availableMoves: undefined });

        service.startTurn('lobby1');

        expect(gameStates.get('lobby1')?.availableMoves).to.deep.equal([]);
    });
    it('should call startTurn at the end of handleRequestStart', async () => {
        const spy = sandbox.spy(service, 'startTurn');
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [{ id: 'socket1', isHost: true } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);

        const gs = {
            currentPlayer: 'socket1',
            playerPositions: new Map(),
            availableMoves: [],
            currentPlayerMovementPoints: 3,
        } as unknown as GameState;

        (boardService.initializeGameState as any).resolves(gs);
        (boardService.handleTurn as any).returns(gs);

        await service.handleRequestStart(socket, 'lobby1');

        expect(spy.calledWith('lobby1')).to.equal(true);
    });
});
