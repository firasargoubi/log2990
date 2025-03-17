/* eslint-disable @typescript-eslint/no-explicit-any */
import { DisconnectHandlerService } from '@app/services/disconnect-handler.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { SocketService } from '@app/services/socket.service';
import { ValidationSocketHandlerService } from '@app/services/validation-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createServer, Server as HttpServer } from 'http';
import { createSandbox, createStubInstance, SinonSandbox, SinonStubbedInstance } from 'sinon';
import { Server, Socket } from 'socket.io';

describe('SocketService', () => {
    let service: SocketService;
    let sandbox: SinonSandbox;
    let httpServer: HttpServer;
    let mockSocket: SinonStubbedInstance<Socket>;
    let mockLobbyHandler: SinonStubbedInstance<LobbySocketHandlerService>;
    let mockGameHandler: SinonStubbedInstance<GameSocketHandlerService>;
    let mockValidationHandler: SinonStubbedInstance<ValidationSocketHandlerService>;
    let mockDisconnectHandler: SinonStubbedInstance<DisconnectHandlerService>;

    beforeEach(() => {
        sandbox = createSandbox();
        httpServer = createServer();
        mockSocket = createStubInstance<Socket>(Socket);
        mockLobbyHandler = createStubInstance(LobbySocketHandlerService);
        mockGameHandler = createStubInstance(GameSocketHandlerService);
        mockValidationHandler = createStubInstance(ValidationSocketHandlerService);
        mockDisconnectHandler = createStubInstance(DisconnectHandlerService);
        service = new SocketService(httpServer, mockLobbyHandler, mockGameHandler, mockValidationHandler, mockDisconnectHandler);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should initialize handlers with server instance', () => {
        expect(mockLobbyHandler.setServer.calledOnce).to.be.equal(true);
        expect(mockGameHandler.setServer.calledOnce).to.be.equal(true);
        expect(mockDisconnectHandler.setServer.calledOnce).to.be.equal(true);
        expect(mockLobbyHandler.setServer.args[0][0]).to.be.instanceOf(Server);
    });

    it('should register all socket events on connection', () => {
        const socketOnSpy = sandbox.spy();
        const socketMock: any = { on: socketOnSpy };
        const ioOnStub = sandbox.stub();
        (service as any).io = { on: ioOnStub };

        ioOnStub.callsFake((event: string, handler: any) => {
            if (event === 'connection') handler(socketMock);
        });

        service.init();

        const expectedEvents = [
            'createLobby',
            'joinLobby',
            'leaveLobby',
            'lockLobby',
            'getLobby',
            'getGameId',
            'verifyRoom',
            'verifyAvatars',
            'verifyUsername',
            'requestStart',
            'endTurn',
            'requestMovement',
            'disconnect',
        ];

        expectedEvents.forEach((evt) => {
            const wasCalled = socketOnSpy.getCalls().some((call) => call.args[0] === evt);
            expect(wasCalled).to.be.equal(true);
        });

        expect(ioOnStub.calledWith('connection')).to.be.equal(true);
    });

    it('should handle createLobby', () => {
        const game = {} as Game;
        const lobbyId = 'lobby123';
        mockLobbyHandler.createLobby.returns(lobbyId);
        service['handleCreateLobby'](mockSocket, game);
        expect(mockSocket.emit.calledWith('lobbyCreated', { lobbyId })).to.be.equal(true);
    });

    it('should handle joinLobby', () => {
        const data = { lobbyId: 'lobby1', player: {} as Player };
        service['handleJoinLobby'](mockSocket, data);
        expect(mockLobbyHandler.handleJoinLobbyRequest.calledWith(mockSocket, 'lobby1', data.player)).to.be.equal(true);
    });

    it('should handle leaveLobby', () => {
        const data = { lobbyId: 'lobby1', playerName: 'Alice' };
        service['handleLeaveLobby'](mockSocket, data);
        expect(mockLobbyHandler.leaveLobby.calledWith(mockSocket, 'lobby1', 'Alice')).to.be.equal(true);
    });

    it('should handle lockLobby', () => {
        service['handleLockLobby'](mockSocket, 'lobbyX');
        expect(mockLobbyHandler.lockLobby.calledWith(mockSocket, 'lobbyX')).to.be.equal(true);
    });

    it('should handle getLobby when lobby exists', () => {
        const lobby = { id: 'lobbyX' } as GameLobby;
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns(lobby);
        service['handleGetLobby'](mockSocket, 'lobbyX', callback);
        expect(callback.calledWith(lobby)).to.be.equal(true);
    });

    it('should handle getLobby when lobby is undefined', () => {
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns(undefined);
        service['handleGetLobby'](mockSocket, 'missing', callback);
        expect(callback.calledWith(null)).to.be.equal(true);
    });

    it('should handle getGameId when lobby exists', () => {
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns({ gameId: 'g123' } as GameLobby);
        service['handleGetGameId'](mockSocket, 'lobbyX', callback);
        expect(callback.calledWith('g123')).to.be.equal(true);
    });

    it('should handle getGameId when lobby is undefined', () => {
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns(undefined);
        service['handleGetGameId'](mockSocket, 'missing', callback);
        expect(callback.calledWith(null)).to.be.equal(true);
    });

    it('should handle verifyRoom', () => {
        const callback = sandbox.spy();
        const response = { exists: true, isLocked: false };
        mockValidationHandler.verifyRoom.callsFake((s, id, cb) => cb(response));
        service['handleVerifyRoom'](mockSocket, { gameId: 'g1' }, callback);
        expect(callback.calledWith(response)).to.be.equal(true);
    });

    it('should handle verifyAvatars', () => {
        const callback = sandbox.spy();
        const response = { avatars: ['a'] };
        mockValidationHandler.verifyAvatars.callsFake((s, id, cb) => cb(response));
        service['handleVerifyAvatars'](mockSocket, { lobbyId: 'lobby1' }, callback);
        expect(callback.calledWith(response)).to.be.equal(true);
    });

    it('should handle verifyUsername', () => {
        const callback = sandbox.spy();
        const response = { usernames: ['u'] };
        mockValidationHandler.verifyUsername.callsFake((s, id, cb) => cb(response));
        service['handleVerifyUsername'](mockSocket, { lobbyId: 'lobby1' }, callback);
        expect(callback.calledWith(response)).to.be.equal(true);
    });

    it('should handle requestStart', () => {
        service['handleRequestStart'](mockSocket, 'lobby1');
        expect(mockGameHandler.handleRequestStart.calledWith(mockSocket, 'lobby1')).to.be.equal(true);
    });

    it('should handle endTurn', () => {
        service['handleEndTurn'](mockSocket, { lobbyId: 'lobby1' });
        expect(mockGameHandler.handleEndTurn.calledWith(mockSocket, 'lobby1')).to.be.equal(true);
    });

    it('should handle requestMovement', () => {
        const data = { lobbyId: 'lobby1', coordinates: [{ x: 1, y: 2 }] };
        service['handleRequestMovement'](mockSocket, data);
        expect(mockGameHandler.handleRequestMovement.calledWith(mockSocket, 'lobby1', data.coordinates)).to.be.equal(true);
    });

    it('should handle disconnect', () => {
        service['handleDisconnect'](mockSocket);
        expect(mockDisconnectHandler.handleDisconnect.calledWith(mockSocket)).to.be.equal(true);
    });

    it('should call handleDisconnect when disconnect event is triggered from socket', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnStub = sandbox.stub();
        (service as any).io = { on: ioOnStub };
        ioOnStub.callsFake((evt, cb) => evt === 'connection' && cb(socketMock));
        service.init();
        const handler = socketMock.on.getCalls().find((c: any) => c.args[0] === 'disconnect')?.args[1];
        handler();
        expect(mockDisconnectHandler.handleDisconnect.calledWith(socketMock)).to.be.equal(true);
    });
});
