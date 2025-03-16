/* eslint-disable @typescript-eslint/no-explicit-any */
import { DisconnectHandlerService } from '@app/services/disconnect-handler.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { SocketService } from '@app/services/socket.service';
import { ValidationSocketHandlerService } from '@app/services/validation-socket-handler.service';
import { Coordinates } from '@common/coordinates';
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

    it('should handle createLobby event', () => {
        const game = { id: 'test' } as Game;
        const lobbyId = '123';
        mockLobbyHandler.createLobby.returns(lobbyId);

        service['handleCreateLobby'](mockSocket, game);

        expect(mockLobbyHandler.createLobby.calledWith(game)).to.be.equal(true);
        expect(mockSocket.emit.calledWith('lobbyCreated', { lobbyId })).to.be.equal(true);
    });

    it('should handle joinLobby event', () => {
        const data = { lobbyId: '123', player: { name: 'test' } as Player };

        service['handleJoinLobby'](mockSocket, data);

        expect(mockLobbyHandler.handleJoinLobbyRequest.calledWith(mockSocket, data.lobbyId, data.player)).to.be.equal(true);
    });

    it('should handle leaveLobby event', () => {
        const data = { lobbyId: '123', playerName: 'test' };

        service['handleLeaveLobby'](mockSocket, data);

        expect(mockLobbyHandler.leaveLobby.calledWith(mockSocket, data.lobbyId, data.playerName)).to.be.equal(true);
    });

    it('should handle lockLobby event', () => {
        const lobbyId = '123';

        service['handleLockLobby'](mockSocket, lobbyId);

        expect(mockLobbyHandler.lockLobby.calledWith(mockSocket, lobbyId)).to.be.equal(true);
    });

    it('should handle getLobby event', () => {
        const lobby: GameLobby = {
            id: '123',
            players: [],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'game123',
        };
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns(lobby);

        service['handleGetLobby'](mockSocket, '123', callback);

        expect(mockLobbyHandler.getLobby.calledWith('123')).to.be.equal(true);
        expect(callback.calledWith(lobby)).to.be.equal(true);
    });

    it('should handle getGameId event', () => {
        const lobby = { gameId: 'game123' } as GameLobby;
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns(lobby);

        service['handleGetGameId'](mockSocket, '123', callback);

        expect(mockLobbyHandler.getLobby.calledWith('123')).to.be.equal(true);
        expect(callback.calledWith('game123')).to.be.equal(true);
    });

    it('should handle verifyRoom event', () => {
        const response = { exists: true, isLocked: false };
        const callback = sandbox.spy();
        mockValidationHandler.verifyRoom.callsFake((socket, gameId, cb) => cb(response));

        service['handleVerifyRoom'](mockSocket, { gameId: '123' }, callback);

        expect(mockValidationHandler.verifyRoom.calledWith(mockSocket, '123', callback)).to.be.equal(true);
        expect(callback.calledWith(response)).to.be.equal(true);
    });

    it('should handle verifyAvatars event', () => {
        const response = { avatars: ['avatar1'] };
        const callback = sandbox.spy();
        mockValidationHandler.verifyAvatars.callsFake((socket, lobbyId, cb) => cb(response));

        service['handleVerifyAvatars'](mockSocket, { lobbyId: '123' }, callback);

        expect(mockValidationHandler.verifyAvatars.calledWith(mockSocket, '123', callback)).to.be.equal(true);
        expect(callback.calledWith(response)).to.be.equal(true);
    });

    it('should handle verifyUsername event', () => {
        const response = { usernames: ['user1'] };
        const callback = sandbox.spy();
        mockValidationHandler.verifyUsername.callsFake((socket, lobbyId, cb) => cb(response));

        service['handleVerifyUsername'](mockSocket, { lobbyId: '123' }, callback);

        expect(mockValidationHandler.verifyUsername.calledWith(mockSocket, '123', callback)).to.be.equal(true);
        expect(callback.calledWith(response)).to.be.equal(true);
    });

    it('should handle requestStart event', () => {
        service['handleRequestStart'](mockSocket, '123');
        expect(mockGameHandler.handleRequestStart.calledWith(mockSocket, '123')).to.be.equal(true);
    });

    it('should handle endTurn event', () => {
        service['handleEndTurn'](mockSocket, { lobbyId: '123' });
        expect(mockGameHandler.handleEndTurn.calledWith(mockSocket, '123')).to.be.equal(true);
    });

    it('should handle requestMovement event', () => {
        const coordinate = { x: 1, y: 1 } as Coordinates;
        service['handleRequestMovement'](mockSocket, { lobbyId: '123', coordinate });
        expect(mockGameHandler.handleRequestMovement.calledWith(mockSocket, '123', coordinate)).to.be.equal(true);
    });

    it('should handle requestPath event', () => {
        const destination = { x: 2, y: 2 } as Coordinates;
        service['handleRequestPath'](mockSocket, { lobbyId: '123', destination });
        expect(mockGameHandler.handlePathRequest.calledWith(mockSocket, '123', destination)).to.be.equal(true);
    });

    it('should call handleDisconnect on handleDisconnect event', () => {
        service['handleDisconnect'](mockSocket);
        expect(mockDisconnectHandler.handleDisconnect.calledWith(mockSocket)).to.be.equal(true);
    });
    it('should register all socket events on connection', () => {
        const socketOnSpy = sandbox.spy();
        const socketMock: any = { on: socketOnSpy };
        const ioOnSpy = sandbox.stub();
        (service as any).io = {
            on: ioOnSpy,
        };
        ioOnSpy.callsFake((event: string, handler: any) => {
            if (event === 'connection') {
                handler(socketMock);
            }
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
            'requestPath',
            'disconnect',
        ];

        expectedEvents.forEach((evt) => {
            const wasCalled = socketOnSpy.getCalls().some((call) => call.args[0] === evt);
            expect(wasCalled).to.equal(true);
        });
        expect(ioOnSpy.calledWith('connection')).to.equal(true);
    });
    it('should call handleGetLobby when getLobby event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (service as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        service.init();

        // Simuler l'enregistrement de 'getLobby'
        const handler = socketMock.on.getCalls().find((c: { args: any[] }) => c.args[0] === 'getLobby')?.args[1];
        const callback = sandbox.spy();

        // Stub getLobby pour s'assurer de la vérification
        const fakeLobby: GameLobby = { id: '123', players: [], isLocked: false, maxPlayers: 4, gameId: 'game123' };
        mockLobbyHandler.getLobby.returns(fakeLobby);

        handler('123', callback);
        expect(mockLobbyHandler.getLobby.calledWith('123')).to.equal(true);
        expect(callback.calledWith(fakeLobby)).to.equal(true);
    });

    it('should call handleGetGameId when getGameId event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (service as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        service.init();

        const handler = socketMock.on.getCalls().find((c: { args: any[] }) => c.args[0] === 'getGameId')?.args[1];
        const callback = sandbox.spy();

        mockLobbyHandler.getLobby.returns({
            gameId: 'game123',
            id: '',
            players: [],
            isLocked: false,
            maxPlayers: 0,
        });

        handler('123', callback);
        expect(mockLobbyHandler.getLobby.calledWith('123')).to.equal(true);
        expect(callback.calledWith('game123')).to.equal(true);
    });

    it('should call handleVerifyRoom when verifyRoom event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (service as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        service.init();

        const handler = socketMock.on.getCalls().find((c: { args: string[] }) => c.args[0] === 'verifyRoom')?.args[1];
        const callback = sandbox.spy();

        handler({ gameId: 'game123' }, callback);
        expect(mockValidationHandler.verifyRoom.calledWith(socketMock, 'game123', callback)).to.equal(true);
    });
});
