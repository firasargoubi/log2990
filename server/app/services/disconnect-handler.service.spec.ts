/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoardService } from '@app/services/board.service';
import { DisconnectHandlerService } from '@app/services/disconnect-handler.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { createSandbox, SinonSandbox, SinonSpy, SinonStub } from 'sinon';
import { Server } from 'socket.io';

describe('DisconnectHandlerService', () => {
    let sandbox: SinonSandbox;
    let lobbies: Map<string, GameLobby>;
    let gameStates: Map<string, GameState>;
    let gameSocketHandler: GameSocketHandlerService;
    let boardService: BoardService;
    let service: DisconnectHandlerService;
    let mockSocket: any;
    let ioToStub: SinonStub;
    let emitSpy: SinonSpy;

    beforeEach(() => {
        sandbox = createSandbox();
        lobbies = new Map();
        gameStates = new Map();
        gameSocketHandler = { startTurn: sandbox.stub() } as unknown as GameSocketHandlerService;
        boardService = { handleEndTurn: sandbox.stub() } as any;

        service = new DisconnectHandlerService(lobbies, gameStates, gameSocketHandler, boardService);

        emitSpy = sandbox.spy();
        ioToStub = sandbox.stub().returns({ emit: emitSpy });

        (service as any).io = { to: ioToStub };

        mockSocket = { id: 'socket1', leave: sandbox.spy() };
    });

    afterEach(() => sandbox.restore());

    it('should remove player from lobby and emit playerLeft', () => {
        lobbies.set('lobby1', {
            id: 'lobby1',
            players: [{ id: 'socket1', name: 'Alice', isHost: false } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        });

        service.handleDisconnect(mockSocket);

        expect(mockSocket.leave.calledWith('lobby1')).to.equal(true);
        expect(emitSpy.calledWith('playerLeft', { lobbyId: 'lobby1', playerName: 'Alice' })).to.equal(true);
    });

    it('should emit hostDisconnected and delete lobby if host leaves', () => {
        lobbies.set('lobby1', {
            id: 'lobby1',
            players: [{ id: 'socket1', name: 'Alice', isHost: true } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        });

        gameStates.set('lobby1', {} as any);

        service.handleDisconnect(mockSocket);

        expect(lobbies.has('lobby1')).to.equal(false);
        expect(gameStates.has('lobby1')).to.equal(false);
        expect(emitSpy.calledWith('hostDisconnected')).to.equal(true);
    });

    it('should delete lobby and gameState if no players left', () => {
        lobbies.set('lobby1', {
            id: 'lobby1',
            players: [{ id: 'socket1', name: 'Alice', isHost: false } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        });
        gameStates.set('lobby1', {} as any);

        service.handleDisconnect(mockSocket);

        expect(lobbies.has('lobby1')).to.equal(false);
        expect(gameStates.has('lobby1')).to.equal(false);
    });

    it('should call handlePlayerLeaveGame if player leaves and others remain', () => {
        lobbies.set('lobby1', {
            id: 'lobby1',
            players: [{ id: 'socket1', name: 'Alice', isHost: false } as any, { id: 'socket2', name: 'Bob', isHost: true } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        });
        gameStates.set('lobby1', {} as any);
        const spy = sandbox.spy(service as any, 'handlePlayerLeaveGame');

        service.handleDisconnect(mockSocket);

        expect(spy.calledWith('lobby1', 'socket1')).to.equal(true);
    });

    it('should emit turnEnded and call startTurn if current player leaves', () => {
        const gs: GameState = {
            currentPlayer: 'socket1',
            availableMoves: [],
            playerPositions: new Map(),
        } as any;
        gameStates.set('lobby1', gs);
        (boardService.handleEndTurn as any).returns(gs);

        (service as any).handlePlayerLeaveGame('lobby1', 'socket1');

        expect(emitSpy.calledWithMatch('turnEnded', { gameState: sinon.match.any })).to.equal(true);
        expect((gameSocketHandler.startTurn as SinonStub).calledWith('lobby1')).to.equal(true);
    });

    it('should emit updated lobby in updateLobby', () => {
        lobbies.set('lobby1', { id: 'lobby1', players: [], isLocked: false, maxPlayers: 4, gameId: 'g1' });
        (service as any).updateLobby('lobby1');
        expect(emitSpy.calledWithMatch('lobbyUpdated')).to.equal(true);
    });
    it('should set the server instance in setServer()', () => {
        const mockServer = {} as unknown as Server;
        service.setServer(mockServer);
        expect((service as any).io).to.equal(mockServer);
    });
});
