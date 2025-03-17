/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DisconnectHandlerService } from '@app/services/disconnect-handler.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { SocketService } from '@app/services/socket.service';
import { ValidationSocketHandlerService } from '@app/services/validation-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { Game, Tile } from '@common/game.interface';
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
            'openDoor',
            'closeDoor',
            'disconnect',
        ];

        expectedEvents.forEach((evt) => {
            const wasCalled = socketOnSpy.getCalls().some((call) => call.args[0] === evt);
            expect(wasCalled).to.be.equal(true);
        });

        expect(ioOnStub.calledWith('connection')).to.be.equal(true);
    });

    it('should handle createLobby with valid data', () => {
        const game = {} as Game;
        const lobbyId = 'lobby123';
        mockLobbyHandler.createLobby.returns(lobbyId);
        service['handleCreateLobby'](mockSocket, game);
        expect(mockSocket.emit.calledWith('lobbyCreated', { lobbyId })).to.be.equal(true);
    });

    it('should handle createLobby with undefined data', () => {
        service['handleCreateLobby'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid game data')).to.be.equal(true);
        expect(mockLobbyHandler.createLobby.called).to.be.equal(false);
    });

    it('should handle createLobby with null data', () => {
        service['handleCreateLobby'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid game data')).to.be.equal(true);
        expect(mockLobbyHandler.createLobby.called).to.be.equal(false);
    });

    it('should handle joinLobby with valid data', () => {
        const data = { lobbyId: 'lobby1', player: {} as Player };
        service['handleJoinLobby'](mockSocket, data);
        expect(mockLobbyHandler.handleJoinLobbyRequest.calledWith(mockSocket, 'lobby1', data.player)).to.be.equal(true);
    });

    it('should handle joinLobby with undefined data', () => {
        service['handleJoinLobby'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid player data')).to.be.equal(true);
        expect(mockLobbyHandler.handleJoinLobbyRequest.called).to.be.equal(false);
    });

    it('should handle joinLobby with null data', () => {
        service['handleJoinLobby'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid player data')).to.be.equal(true);
        expect(mockLobbyHandler.handleJoinLobbyRequest.called).to.be.equal(false);
    });

    it('should handle joinLobby with missing player property', () => {
        service['handleJoinLobby'](mockSocket, { lobbyId: 'lobby1' } as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid player data')).to.be.equal(true);
        expect(mockLobbyHandler.handleJoinLobbyRequest.called).to.be.equal(false);
    });

    it('should handle leaveLobby with valid data', () => {
        const data = { lobbyId: 'lobby1', playerName: 'Alice' };
        service['handleLeaveLobby'](mockSocket, data);
        expect(mockLobbyHandler.leaveLobby.calledWith(mockSocket, 'lobby1', 'Alice')).to.be.equal(true);
    });

    it('should handle leaveLobby with undefined data', () => {
        service['handleLeaveLobby'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby or player data')).to.be.equal(true);
        expect(mockLobbyHandler.leaveLobby.called).to.be.equal(false);
    });

    it('should handle leaveLobby with null data', () => {
        service['handleLeaveLobby'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby or player data')).to.be.equal(true);
        expect(mockLobbyHandler.leaveLobby.called).to.be.equal(false);
    });

    it('should handle lockLobby', () => {
        service['handleLockLobby'](mockSocket, 'lobbyX');
        expect(mockLobbyHandler.lockLobby.calledWith(mockSocket, 'lobbyX')).to.be.equal(true);
    });

    it('should handle lockLobby with undefined lobbyId', () => {
        service['handleLockLobby'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(mockLobbyHandler.lockLobby.called).to.be.equal(false);
    });

    it('should handle lockLobby with null lobbyId', () => {
        service['handleLockLobby'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(mockLobbyHandler.lockLobby.called).to.be.equal(false);
    });

    it('should handle getLobby when lobby exists', () => {
        const lobby = { id: 'lobbyX' } as GameLobby;
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns(lobby);
        service['handleGetLobby'](mockSocket, 'lobbyX', callback);
        expect(callback.calledWith(lobby)).to.be.equal(true);
    });

    it('should handle getLobby with undefined lobbyId', () => {
        const callback = sandbox.spy();
        service['handleGetLobby'](mockSocket, undefined as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith(null)).to.be.equal(true);
        expect(mockLobbyHandler.getLobby.called).to.be.equal(false);
    });

    it('should handle getLobby with null lobbyId', () => {
        const callback = sandbox.spy();
        service['handleGetLobby'](mockSocket, null as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith(null)).to.be.equal(true);
        expect(mockLobbyHandler.getLobby.called).to.be.equal(false);
    });

    it('should handle getLobby with empty string lobbyId', () => {
        const callback = sandbox.spy();
        service['handleGetLobby'](mockSocket, '', callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith(null)).to.be.equal(true);
        expect(mockLobbyHandler.getLobby.called).to.be.equal(false);
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

    it('should handle getGameId with undefined lobbyId', () => {
        const callback = sandbox.spy();
        service['handleGetGameId'](mockSocket, undefined as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith(null)).to.be.equal(true);
        expect(mockLobbyHandler.getLobby.called).to.be.equal(false);
    });

    it('should handle getGameId with null lobbyId', () => {
        const callback = sandbox.spy();
        service['handleGetGameId'](mockSocket, null as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith(null)).to.be.equal(true);
        expect(mockLobbyHandler.getLobby.called).to.be.equal(false);
    });

    it('should handle getGameId with empty string lobbyId', () => {
        const callback = sandbox.spy();
        service['handleGetGameId'](mockSocket, '', callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith(null)).to.be.equal(true);
        expect(mockLobbyHandler.getLobby.called).to.be.equal(false);
    });

    it('should handle getGameId when lobby is undefined', () => {
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns(undefined);
        service['handleGetGameId'](mockSocket, 'missing', callback);
        expect(callback.calledWith(null)).to.be.equal(true);
    });

    it('should handle getGameId when gameId is null', () => {
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns({ id: 'lobby1', gameId: null } as any);
        service['handleGetGameId'](mockSocket, 'lobby1', callback);
        expect(callback.calledWith(null)).to.be.equal(true);
    });

    it('should handle verifyRoom with valid data', () => {
        const callback = sandbox.spy();
        const response = { exists: true, isLocked: false };
        mockValidationHandler.verifyRoom.callsFake((s, id, cb) => cb(response));
        service['handleVerifyRoom'](mockSocket, { gameId: 'g1' }, callback);
        expect(callback.calledWith(response)).to.be.equal(true);
        expect(mockValidationHandler.verifyRoom.calledWith(mockSocket, 'g1', callback)).to.be.equal(true);
    });

    it('should handle verifyRoom with undefined data', () => {
        const callback = sandbox.spy();
        service['handleVerifyRoom'](mockSocket, undefined as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid game ID')).to.be.equal(true);
        expect(callback.calledWith({ exists: false })).to.be.equal(true);
        expect(mockValidationHandler.verifyRoom.called).to.be.equal(false);
    });

    it('should handle verifyRoom with null data', () => {
        const callback = sandbox.spy();
        service['handleVerifyRoom'](mockSocket, null as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid game ID')).to.be.equal(true);
        expect(callback.calledWith({ exists: false })).to.be.equal(true);
        expect(mockValidationHandler.verifyRoom.called).to.be.equal(false);
    });

    it('should handle verifyRoom with missing gameId', () => {
        const callback = sandbox.spy();
        service['handleVerifyRoom'](mockSocket, { gameId: undefined } as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid game ID')).to.be.equal(true);
        expect(callback.calledWith({ exists: false })).to.be.equal(true);
        expect(mockValidationHandler.verifyRoom.called).to.be.equal(false);
    });

    it('should handle verifyAvatars with valid data', () => {
        const callback = sandbox.spy();
        const response = { avatars: ['a'] };
        mockValidationHandler.verifyAvatars.callsFake((s, id, cb) => cb(response));
        service['handleVerifyAvatars'](mockSocket, { lobbyId: 'lobby1' }, callback);
        expect(callback.calledWith(response)).to.be.equal(true);
        expect(mockValidationHandler.verifyAvatars.calledWith(mockSocket, 'lobby1', callback)).to.be.equal(true);
    });

    it('should handle verifyAvatars with undefined data', () => {
        const callback = sandbox.spy();
        service['handleVerifyAvatars'](mockSocket, undefined as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith({ avatars: [] })).to.be.equal(true);
        expect(mockValidationHandler.verifyAvatars.called).to.be.equal(false);
    });

    it('should handle verifyAvatars with null data', () => {
        const callback = sandbox.spy();
        service['handleVerifyAvatars'](mockSocket, null as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith({ avatars: [] })).to.be.equal(true);
        expect(mockValidationHandler.verifyAvatars.called).to.be.equal(false);
    });

    it('should handle verifyAvatars with missing lobbyId', () => {
        const callback = sandbox.spy();
        service['handleVerifyAvatars'](mockSocket, { lobbyId: undefined } as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith({ avatars: [] })).to.be.equal(true);
        expect(mockValidationHandler.verifyAvatars.called).to.be.equal(false);
    });

    it('should handle verifyUsername with valid data', () => {
        const callback = sandbox.spy();
        const response = { usernames: ['u'] };
        mockValidationHandler.verifyUsername.callsFake((s, id, cb) => cb(response));
        service['handleVerifyUsername'](mockSocket, { lobbyId: 'lobby1' }, callback);
        expect(callback.calledWith(response)).to.be.equal(true);
        expect(mockValidationHandler.verifyUsername.calledWith(mockSocket, 'lobby1', callback)).to.be.equal(true);
    });

    it('should handle verifyUsername with undefined data', () => {
        const callback = sandbox.spy();
        service['handleVerifyUsername'](mockSocket, undefined as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith({ usernames: [] })).to.be.equal(true);
        expect(mockValidationHandler.verifyUsername.called).to.be.equal(false);
    });

    it('should handle verifyUsername with null data', () => {
        const callback = sandbox.spy();
        service['handleVerifyUsername'](mockSocket, null as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith({ usernames: [] })).to.be.equal(true);
        expect(mockValidationHandler.verifyUsername.called).to.be.equal(false);
    });

    it('should handle verifyUsername with missing lobbyId', () => {
        const callback = sandbox.spy();
        service['handleVerifyUsername'](mockSocket, { lobbyId: undefined } as any, callback);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(callback.calledWith({ usernames: [] })).to.be.equal(true);
        expect(mockValidationHandler.verifyUsername.called).to.be.equal(false);
    });

    it('should handle requestStart with valid lobbyId', () => {
        service['handleRequestStart'](mockSocket, 'lobby1');
        expect(mockGameHandler.handleRequestStart.calledWith(mockSocket, 'lobby1')).to.be.equal(true);
    });

    it('should handle requestStart with undefined lobbyId', () => {
        service['handleRequestStart'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(mockGameHandler.handleRequestStart.called).to.be.equal(false);
    });

    it('should handle requestStart with null lobbyId', () => {
        service['handleRequestStart'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(mockGameHandler.handleRequestStart.called).to.be.equal(false);
    });

    it('should handle requestStart with empty string lobbyId', () => {
        service['handleRequestStart'](mockSocket, '');
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(mockGameHandler.handleRequestStart.called).to.be.equal(false);
    });

    it('should handle endTurn with valid data', () => {
        service['handleEndTurn'](mockSocket, { lobbyId: 'lobby1' });
        expect(mockGameHandler.handleEndTurn.calledWith(mockSocket, 'lobby1')).to.be.equal(true);
    });

    it('should handle endTurn with undefined data', () => {
        service['handleEndTurn'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.be.equal(true);
        expect(mockGameHandler.handleEndTurn.called).to.be.equal(false);
    });

    it('should handle endTurn with null data', () => {
        service['handleEndTurn'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.be.equal(true);
        expect(mockGameHandler.handleEndTurn.called).to.be.equal(false);
    });

    it('should handle endTurn with missing lobbyId', () => {
        service['handleEndTurn'](mockSocket, { lobbyId: undefined } as any);
        expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.be.equal(true);
        expect(mockGameHandler.handleEndTurn.called).to.be.equal(false);
    });

    it('should handle endTurn with empty string lobbyId', () => {
        service['handleEndTurn'](mockSocket, { lobbyId: '' });
        expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.be.equal(true);
        expect(mockGameHandler.handleEndTurn.called).to.be.equal(false);
    });

    it('should handle requestMovement with valid data', () => {
        const data = { lobbyId: 'lobby1', coordinates: [{ x: 1, y: 2 }] };
        service['handleRequestMovement'](mockSocket, data);
        expect(mockGameHandler.handleRequestMovement.calledWith(mockSocket, 'lobby1', data.coordinates)).to.be.equal(true);
    });

    it('should handle requestMovement with undefined data', () => {
        service['handleRequestMovement'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.be.equal(true);
        expect(mockGameHandler.handleRequestMovement.called).to.be.equal(false);
    });

    it('should handle requestMovement with null data', () => {
        service['handleRequestMovement'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.be.equal(true);
        expect(mockGameHandler.handleRequestMovement.called).to.be.equal(false);
    });

    it('should handle requestMovement with missing coordinates', () => {
        service['handleRequestMovement'](mockSocket, { lobbyId: 'lobby1', coordinates: undefined } as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.be.equal(true);
        expect(mockGameHandler.handleRequestMovement.called).to.be.equal(false);
    });

    it('should handle requestMovement with null coordinates', () => {
        service['handleRequestMovement'](mockSocket, { lobbyId: 'lobby1', coordinates: null } as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.be.equal(true);
        expect(mockGameHandler.handleRequestMovement.called).to.be.equal(false);
    });

    it('should handle requestMovement with empty coordinates array', () => {
        service['handleRequestMovement'](mockSocket, { lobbyId: 'lobby1', coordinates: [] });
        expect(mockGameHandler.handleRequestMovement.calledWith(mockSocket, 'lobby1', [])).to.be.equal(true);
    });

    it('should handle openDoor with valid data', () => {
        const tile: Tile = { x: 1, y: 1, type: 5, object: 0 };
        service['handleOpenDoor'](mockSocket, { lobbyId: 'lobby1', tile });
        expect(mockGameHandler.openDoor.calledWith(mockSocket, tile, 'lobby1')).to.be.equal(true);
    });

    it('should handle openDoor with undefined data', () => {
        service['handleOpenDoor'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid door data')).to.be.equal(true);
        expect(mockGameHandler.openDoor.called).to.be.equal(false);
    });

    it('should handle openDoor with null data', () => {
        service['handleOpenDoor'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid door data')).to.be.equal(true);
        expect(mockGameHandler.openDoor.called).to.be.equal(false);
    });

    it('should handle openDoor with missing lobbyId', () => {
        const tile: Tile = { x: 1, y: 1, type: 5, object: 0 };
        service['handleOpenDoor'](mockSocket, { lobbyId: undefined, tile } as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(mockGameHandler.openDoor.called).to.be.equal(false);
    });

    it('should handle openDoor with missing tile', () => {
        service['handleOpenDoor'](mockSocket, { lobbyId: 'lobby1', tile: undefined } as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid tile data')).to.be.equal(true);
        expect(mockGameHandler.openDoor.called).to.be.equal(false);
    });

    it('should handle closeDoor with valid data', () => {
        const tile: Tile = { x: 1, y: 1, type: 4, object: 0 };
        service['handleCloseDoor'](mockSocket, { lobbyId: 'lobby1', tile });
        expect(mockGameHandler.closeDoor.calledWith(mockSocket, tile, 'lobby1')).to.be.equal(true);
    });

    it('should handle closeDoor with undefined data', () => {
        service['handleCloseDoor'](mockSocket, undefined as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid door data')).to.be.equal(true);
        expect(mockGameHandler.closeDoor.called).to.be.equal(false);
    });

    it('should handle closeDoor with null data', () => {
        service['handleCloseDoor'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid door data')).to.be.equal(true);
        expect(mockGameHandler.closeDoor.called).to.be.equal(false);
    });

    it('should handle closeDoor with missing lobbyId', () => {
        const tile: Tile = { x: 1, y: 1, type: 4, object: 0 };
        service['handleCloseDoor'](mockSocket, { lobbyId: undefined, tile } as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(mockGameHandler.closeDoor.called).to.be.equal(false);
    });

    it('should handle closeDoor with missing tile', () => {
        service['handleCloseDoor'](mockSocket, { lobbyId: 'lobby1', tile: undefined } as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid tile data')).to.be.equal(true);
        expect(mockGameHandler.closeDoor.called).to.be.equal(false);
    });

    it('should handle disconnect', () => {
        service['handleDisconnect'](mockSocket);
        expect(mockDisconnectHandler.handleDisconnect.calledWith(mockSocket)).to.be.equal(true);
    });
});
