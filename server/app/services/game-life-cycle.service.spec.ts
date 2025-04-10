/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { gameSocketMessages } from '@app/constants/game-socket-handler-const';
import { BoardService } from '@app/services/board.service';
import { ItemService } from '@app/services/item.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { PathfindingService } from '@app/services/pathfinding.service';
import { GameEvents } from '@common/events';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import { Server, Socket } from 'socket.io';
import { GameLifecycleService } from './game-life-cycle.service';

describe('GameLifecycleService', () => {
    let sandbox: SinonSandbox;
    let service: GameLifecycleService;
    let boardService: BoardService;
    let lobbyService: LobbySocketHandlerService;
    let pathfindingService: PathfindingService;
    let itemService: ItemService;
    let lobbies: Map<string, GameLobby>;
    let gameStates: Map<string, GameState>;
    let socket: Partial<Socket>;

    beforeEach(() => {
        sandbox = createSandbox();
        lobbies = new Map();
        gameStates = new Map();

        boardService = {
            initializeGameState: sandbox.stub(),
            handleTurn: sandbox.stub(),
            handleEndTurn: sandbox.stub(),
            handleBoardChange: sandbox.stub(),
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

        socket = {
            id: '1',
            emit: sandbox.stub(),
        };

        service = new GameLifecycleService(lobbies, gameStates, boardService, lobbyService, pathfindingService, itemService);
        service.setServer({ to: sandbox.stub().returns({ emit: sandbox.stub() }) } as unknown as any);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should handleRequestStart with host', async () => {
        const lobby = {
            players: [{ id: '1', isHost: true }],
            isLocked: false,
        } as GameLobby;

        const gameState = { gameMode: 'default' } as GameState;

        lobbies.set('lobby1', lobby);
        (boardService.initializeGameState as SinonStub).resolves(gameState);
        (boardService.handleTurn as SinonStub).returns(gameState);

        await service.handleRequestStart(socket as Socket, 'lobby1');

        expect(gameStates.get('lobby1')).to.equal(gameState);
        expect(lobby.isLocked).to.be.equal(true);
    });

    it('should emit error if not current player on end turn', () => {
        const gameState = { currentPlayer: 'someone-else' } as GameState;
        gameStates.set('lobby1', gameState);

        service.handleEndTurn(socket as Socket, 'lobby1');

        const wasCalledWithError = (socket.emit as SinonStub).calledWith(GameEvents.Error, "It's not your turn.");
        expect(wasCalledWithError).to.be.equal(true);
    });

    it('should handleEndTurn with valid player', () => {
        const gameState = { currentPlayer: '1' } as GameState;

        gameStates.set('lobby1', gameState);
        (boardService.handleEndTurn as SinonStub).returns(gameState);
        (boardService.handleTurn as SinonStub).returns(gameState);

        service.handleEndTurn(socket as Socket, 'lobby1');

        expect(gameStates.get('lobby1')).to.equal(gameState);
    });

    it('should call startTurn correctly', () => {
        const gameState = { currentPlayer: '1' } as GameState;

        gameStates.set('lobby1', gameState);
        (boardService.handleTurn as SinonStub).returns(gameState);

        service.startTurn('lobby1');

        expect(gameStates.get('lobby1')).to.equal(gameState);
    });

    it('should handleSetDebug properly', () => {
        const gameState = {} as GameState;

        gameStates.set('lobby1', gameState);
        service.handleSetDebug(socket as Socket, 'lobby1', true);

        expect(gameStates.get('lobby1')?.debug).to.equal(true);
    });
    it('should return null and emit error in getGameStateOrEmitError if game not found', () => {
        const result = service.getGameStateOrEmitError(socket as Socket, 'lobby1');
        expect(result).to.be.equal(null);
        expect((socket.emit as SinonStub).calledWith(GameEvents.Error)).to.be.equal(true);
    });

    it('should handlePlayersUpdate when a player is removed', () => {
        const gameState = {
            players: [{ id: '1' }],
            spawnPoints: [{ x: 0, y: 0 }],
            playerPositions: [{ x: 0, y: 0 }],
            board: [[100]],
        } as unknown as GameState;

        gameStates.set('lobby1', gameState);
        (boardService.handleBoardChange as SinonStub).returns(gameState);

        service.handlePlayersUpdate(socket as Socket, 'lobby1', []);

        expect(gameStates.get('lobby1')).to.equal(gameState);
    });

    it('should handleDefeat and continue turn if loser is current player', () => {
        const gameState = {
            currentPlayer: '2',
            players: [
                { id: '1', life: 5, maxLife: 5 },
                { id: '2', life: 5, maxLife: 5 },
            ],
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            board: [[0]],
        } as unknown as GameState;

        gameStates.set('lobby1', gameState);
        (boardService.handleEndTurn as SinonStub).returns(gameState);
        (boardService.handleTurn as SinonStub).returns(gameState);

        service.setServer({
            to: sandbox.stub().returns({ emit: sandbox.stub() }),
        } as unknown as any);

        service.handleDefeat('lobby1', { ...gameState.players[0], life: 5, maxLife: 5 }, { ...gameState.players[1], life: 0, maxLife: 5, items: [] });

        expect(gameStates.get('lobby1')).to.deep.equal(gameState);
    });
    it('should handleFlee and emit failure after 2 attempts', () => {
        const gameState = {
            players: [{ id: '1', amountEscape: 2 }],
        } as unknown as GameState;

        gameStates.set('lobby1', gameState);
        service.handleFlee('lobby1', { id: '1', amountEscape: 2 } as Player, { id: '2', amountEscape: 0 } as Player);

        expect((socket.emit as SinonStub).called).to.be.equal(false);
    });
    it('should handleFlee and emit success if debug mode is true', () => {
        const gameState = {
            players: [{ id: '1', amountEscape: 0 }],
            debug: true,
        } as unknown as GameState;

        gameStates.set('lobby1', gameState);
        service.setServer({
            to: sandbox.stub().returns({
                emit: sandbox.stub(),
                to: sandbox.stub().returnsThis(),
            }),
        } as unknown as any);

        service.handleFlee('lobby1', { id: '1', amountEscape: 0 } as Player, { id: '2', amountEscape: 0 } as Player);

        expect(gameStates.get('lobby1')?.players[0].amountEscape).to.equal(0);
    });

    it('should createTeams and emit teams', () => {
        const gameState = {
            players: [],
        } as GameState;

        gameStates.set('lobby1', gameState);
        service.setServer({ to: sandbox.stub().returns({ emit: sandbox.stub() }) } as unknown as any);

        service.createTeams('lobby1', [{ id: '1' }, { id: '2' }] as Player[]);
        expect(gameStates.get('lobby1')?.teams).to.not.be.equal(undefined);
    });
    it('should emit TurnStarted on startTurn', () => {
        const emitStub = sandbox.stub();
        service.setServer({ to: sandbox.stub().returns({ emit: emitStub }) } as unknown as any);
        const gameState = { currentPlayer: '1' } as GameState;
        gameStates.set('lobby1', gameState);
        (boardService.handleTurn as SinonStub).returns(gameState);

        service.startTurn('lobby1');

        expect(emitStub.calledWith(GameEvents.TurnStarted)).to.equal(true);
    });
    it('should not update players if gameState is missing', () => {
        service.handlePlayersUpdate(socket as Socket, 'unknown-lobby', []);
        expect((socket.emit as SinonStub).calledWith(GameEvents.Error)).to.equal(true);
    });
    it('should return if gameState is missing on flee', () => {
        service.handleFlee('unknown-lobby', { id: '1' } as Player, { id: '2' } as Player);
    });

    it('should emit FleeFailure if player escaped too much', () => {
        const gameState = { players: [{ id: '1', amountEscape: 2 }] } as unknown as GameState;
        gameStates.set('lobby1', gameState);
        const emitStub = sandbox.stub();
        service.setServer({ to: sandbox.stub().returns({ emit: emitStub }) } as unknown as any);

        service.handleFlee('lobby1', { id: '1', amountEscape: 2 } as Player, { id: '2', amountEscape: 0 } as Player);

        expect(emitStub.calledWith(GameEvents.FleeFailure)).to.equal(true);
    });
    it('should not recreate teams if already exists', () => {
        const gameState = { teams: {} } as GameState;
        gameStates.set('lobby1', gameState);
        service.createTeams('lobby1', []);
    });
    it('should emit TeamsCreated after team creation', () => {
        const emitStub = sandbox.stub();
        service.setServer({ to: sandbox.stub().returns({ emit: emitStub }) } as unknown as any);
        const gameState = { players: [] } as GameState;
        gameStates.set('lobby1', gameState);

        service.createTeams('lobby1', [{ id: '1' }, { id: '2' }] as Player[]);

        expect(emitStub.calledWith(GameEvents.TeamsCreated)).to.equal(true);
    });
    it('should emit error if gameState is not found in handleSetDebug', () => {
        service.handleSetDebug(socket as Socket, 'unknown-lobby', true);
        expect((socket.emit as SinonStub).calledWith('error', 'Game not found.')).to.equal(true);
    });
    it('should not start turn if gameState does not exist', () => {
        service.startTurn('unknown-lobby');
    });
    it('should emit error if game mode is capture with odd number of players', async () => {
        const lobby = {
            players: [
                { id: '1', isHost: true },
                { id: '2', isHost: false },
                { id: '3', isHost: false },
            ],
            isLocked: false,
        } as GameLobby;
        const gameState = { gameMode: 'capture' } as GameState;

        lobbies.set('lobby1', lobby);
        (boardService.initializeGameState as SinonStub).resolves(gameState);

        await service.handleRequestStart(socket as Socket, 'lobby1');

        expect((socket.emit as SinonStub).calledWith(GameEvents.Error, gameSocketMessages.notEnoughPlayers)).to.equal(true);
    });
    it('should emit error if an exception is thrown during game start', async () => {
        const lobby = {
            players: [{ id: '1', isHost: true }],
            isLocked: false,
        } as GameLobby;

        const gameState = { gameMode: 'default' } as GameState;

        lobbies.set('lobby1', lobby);
        (boardService.initializeGameState as SinonStub).resolves(gameState);
        (lobbyService.updateLobby as SinonStub).throws(new Error('Unexpected error'));

        await service.handleRequestStart(socket as Socket, 'lobby1');

        sinon.assert.calledOnceWithExactly(socket.emit as SinonStub, GameEvents.Error, `${gameSocketMessages.failedStartGame} Unexpected error`);
    });
    it('should return early if gameState is not found in startTurn', () => {
        const emitStub = sandbox.stub();
        service.setServer({ to: () => ({ emit: emitStub }) } as unknown as Server);

        service.startTurn('nonexistent-lobby');

        expect(emitStub.called).to.be.equal(false);
    });
    it('should remove missing player from game state in handlePlayersUpdate', () => {
        const gameState = {
            players: [{ id: '1' }],
            spawnPoints: [{ x: 0, y: 0 }],
            board: [[0]],
            playerPositions: [{ x: 0, y: 0 }],
        } as unknown as GameState;

        (boardService.handleBoardChange as SinonStub).returns(gameState);
        gameStates.set('lobby1', gameState);

        service.handlePlayersUpdate(socket as Socket, 'lobby1', []);

        expect(gameState.players.length).to.equal(0);
    });
    it('should call pathfinding if spawn is occupied', () => {
        const gameState = {
            players: [
                { id: '1', life: 5, maxLife: 10 },
                { id: '2', life: 5, maxLife: 10 },
            ],
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            playerPositions: [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ],
            board: [[0]],
        } as unknown as GameState;

        gameStates.set('lobby1', gameState);
        (pathfindingService.findClosestAvailableSpot as SinonStub).returns({ x: 3, y: 3 });

        service.setServer({ to: () => ({ emit: sandbox.stub() }) } as unknown as Server);

        service.handleDefeat('lobby1', gameState.players[0], gameState.players[1]);

        expect((pathfindingService.findClosestAvailableSpot as SinonStub).called).to.equal(true);
    });
    it('should call endTurn if loser is current player', () => {
        const gameState = {
            currentPlayer: '2',
            players: [{ id: '1' }, { id: '2' }],
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            board: [[0]],
        } as unknown as GameState;

        gameStates.set('lobby1', gameState);
        (boardService.handleEndTurn as SinonStub).returns(gameState);
        (boardService.handleTurn as SinonStub).returns(gameState);

        service.setServer({ to: sandbox.stub().returns({ emit: sandbox.stub() }) } as unknown as any);

        service.handleDefeat('lobby1', gameState.players[0], gameState.players[1]);

        expect(gameStates.get('lobby1')).to.equal(gameState);
    });
    it('should return early if teams already exist', () => {
        const emitStub = sandbox.stub();
        const gameState = {
            teams: { team1: [], team2: [] },
        } as unknown as GameState;

        gameStates.set('lobby1', gameState);
        service.setServer({ to: () => ({ emit: emitStub }) } as unknown as Server);

        service.createTeams('lobby1', [{ id: '1' }, { id: '2' }] as Player[]);

        expect(emitStub.called).to.equal(false);
    });
    it('should emit error if lobby is not found in handleRequestStart', async () => {
        (boardService.initializeGameState as SinonStub).resolves({ gameMode: 'default' });
        await service.handleRequestStart(socket as Socket, 'invalidLobbyId');
        expect((socket.emit as SinonStub).calledWith(GameEvents.Error, gameSocketMessages.lobbyNotFound)).to.equal(true);
    });
    it('should emit error if player is not host in handleRequestStart', async () => {
        const lobby = { players: [{ id: '1', isHost: false }] } as GameLobby;
        lobbies.set('lobby1', lobby);
        (boardService.initializeGameState as SinonStub).resolves({ gameMode: 'default' });

        await service.handleRequestStart(socket as Socket, 'lobby1');

        expect((socket.emit as SinonStub).calledWith(GameEvents.Error, gameSocketMessages.onlyHostStart)).to.equal(true);
    });
    it('should emit error if players count is odd in capture mode', async () => {
        const lobby = {
            players: [
                { id: '1', isHost: true },
                { id: '2', isHost: false },
                { id: '3', isHost: false },
            ],
        } as GameLobby;
        lobbies.set('lobby1', lobby);
        const gameState = { gameMode: 'capture' } as GameState;
        (boardService.initializeGameState as SinonStub).resolves(gameState);

        await service.handleRequestStart(socket as Socket, 'lobby1');

        expect((socket.emit as SinonStub).calledWith(GameEvents.Error, gameSocketMessages.notEnoughPlayers)).to.equal(true);
    });
    it('should handleFlee and emit failure when random yields failure (non-debug mode)', () => {
        const gameState = {
            players: [
                { id: '1', name: 'Player1', amountEscape: 0 },
                { id: '2', name: 'Player2', amountEscape: 0 },
            ],
            debug: false,
        } as unknown as GameState;
        gameStates.set('lobby1', gameState);
        service.setServer({
            to: sandbox.stub().returns({
                to: sandbox.stub().returns({ emit: sandbox.stub() }),
            }),
        } as unknown as any);

        const randomStub = sandbox.stub(Math, 'random').returns(1);

        const emitEventToPlayersSpy = sandbox.spy(service, 'emitEventToPlayers');

        service.handleFlee(
            'lobby1',
            { id: '1', name: 'Player1', amountEscape: 0 } as Player,
            { id: '2', name: 'Player2', amountEscape: 0 } as Player,
        );

        const updatedPlayer = gameState.players.find((p) => p.id === '1');
        expect(updatedPlayer?.amountEscape).to.equal(1);
        sinon.assert.calledWith(emitEventToPlayersSpy, sinon.match.any, ['Player1', 'Player2'], "Player1 n'a pas pu fuire.", '1', '2');
        randomStub.restore();
    });

    it('should handleFlee and emit success when random yields success (non-debug mode)', () => {
        const gameState = {
            players: [
                { id: '1', name: 'Player1', amountEscape: 0 },
                { id: '2', name: 'Player2', amountEscape: 0 },
            ],
            debug: false,
        } as unknown as GameState;
        gameStates.set('lobby1', gameState);

        const randomStub = sandbox.stub(Math, 'random').returns(0);

        const socketEmitStub = sandbox.stub();
        service.setServer({
            to: sandbox.stub().returns({
                to: sandbox.stub().returnsThis(),
                emit: socketEmitStub,
            }),
        } as unknown as Server);

        service.handleFlee(
            'lobby1',
            { id: '1', name: 'Player1', amountEscape: 0 } as Player,
            { id: '2', name: 'Player2', amountEscape: 0 } as Player,
        );

        for (const player of gameState.players) {
            expect(player.amountEscape).to.equal(0);
        }

        sinon.assert.calledWith(socketEmitStub, GameEvents.FleeSuccess, { fleeingPlayer: sinon.match.has('id', '1'), isSuccessful: true });
        sinon.assert.calledWith(socketEmitStub, GameEvents.BoardModified, { gameState });

        randomStub.restore();
    });

    it('should update fleeing player escape count when below limit and not emit io events for failure branch', () => {
        const gameState = {
            players: [
                { id: '1', name: 'Player1', amountEscape: 0 },
                { id: '2', name: 'Player2', amountEscape: 0 },
            ],
            debug: false,
        } as unknown as GameState;
        gameStates.set('lobby1', gameState);

        const randomStub = sandbox.stub(Math, 'random').returns(1);

        const emitEventToPlayersSpy = sandbox.spy(service, 'emitEventToPlayers');
        const ioEmitStub = sandbox.stub();
        service.setServer({ to: sandbox.stub().returns({ to: sandbox.stub().returnsThis(), emit: ioEmitStub }) } as unknown as Server);

        service.handleFlee(
            'lobby1',
            { id: '1', name: 'Player1', amountEscape: 0 } as Player,
            { id: '2', name: 'Player2', amountEscape: 0 } as Player,
        );

        const updatedPlayer = gameState.players.find((p) => p.id === '1');
        expect(updatedPlayer?.amountEscape).to.equal(1);
        sinon.assert.calledOnce(emitEventToPlayersSpy);

        randomStub.restore();
    });
});
