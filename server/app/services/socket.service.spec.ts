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
import { Socket } from 'socket.io';

describe('SocketService', () => {
    let sandbox: SinonSandbox;
    let httpServer: HttpServer;
    let socketService: SocketService;
    let mockSocket: SinonStubbedInstance<Socket>;
    let lobbyHandler: SinonStubbedInstance<LobbySocketHandlerService>;
    let gameHandler: SinonStubbedInstance<GameSocketHandlerService>;
    let validationHandler: SinonStubbedInstance<ValidationSocketHandlerService>;
    let disconnectHandler: SinonStubbedInstance<DisconnectHandlerService>;

    beforeEach(() => {
        sandbox = createSandbox();
        httpServer = createServer();
        mockSocket = createStubInstance<Socket>(Socket);
        lobbyHandler = createStubInstance(LobbySocketHandlerService);
        gameHandler = createStubInstance(GameSocketHandlerService);
        validationHandler = createStubInstance(ValidationSocketHandlerService);
        disconnectHandler = createStubInstance(DisconnectHandlerService);

        socketService = new SocketService(httpServer, lobbyHandler, gameHandler, validationHandler, disconnectHandler);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should set server instances in constructor', () => {
        expect(lobbyHandler.setServer.calledOnce).to.be.equal(true);
        expect(gameHandler.setServer.calledOnce).to.be.equal(true);
    });

    it('should register all socket events on connection', () => {
        const socketOn = sandbox.spy();
        const ioOn = sandbox.stub();
        (socketService as any).io = { on: ioOn };

        ioOn.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb({ on: socketOn });
        });

        socketService.init();

        const expectedEvents = [
            'createLobby',
            'joinLobby',
            'leaveLobby',
            'leaveGame',
            'lockLobby',
            'getLobby',
            'getGameId',
            'verifyRoom',
            'verifyAvatars',
            'verifyUsername',
            'requestStart',
            'endTurn',
            'requestMovement',
            'updatePlayers',
            'openDoor',
            'closeDoor',
            'disconnect',
            'disconnectFromRoom',
        ];

        expectedEvents.forEach((evt) => {
            const called = socketOn.getCalls().some((call) => call.args[0] === evt);
            expect(called, `Missing event: ${evt}`).to.be.equal(true);
        });

        expect(ioOn.calledWith('connection')).to.be.equal(true);
    });

    it('should emit error for invalid createLobby data', () => {
        socketService['handleCreateLobby'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid game data')).to.be.equal(true);
    });

    it('should create lobby and emit lobbyCreated', () => {
        const gameLobby = { id: 'lobby123' } as GameLobby;
        lobbyHandler.createLobby.returns(gameLobby);

        socketService['handleCreateLobby'](mockSocket, {} as Game);

        expect(mockSocket.emit.calledWith('lobbyCreated', { lobby: gameLobby })).to.equal(true);
    });

    it('should emit error for invalid joinLobby data', () => {
        socketService['handleJoinLobby'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid player data')).to.be.equal(true);
    });

    it('should handle valid joinLobby request', () => {
        const data = { lobbyId: 'l1', player: {} as Player };
        socketService['handleJoinLobby'](mockSocket, data);
        expect(lobbyHandler.handleJoinLobbyRequest.calledWith(mockSocket, 'l1', data.player)).to.be.equal(true);
    });

    it('should emit error for invalid leaveLobby data', () => {
        socketService['handleLeaveLobby'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby or player data')).to.be.equal(true);
    });

    it('should handle valid leaveLobby', () => {
        const data = { lobbyId: 'l1', playerName: 'p' };
        socketService['handleLeaveLobby'](mockSocket, data);
        expect(lobbyHandler.leaveLobby.calledWith(mockSocket, 'l1', 'p')).to.be.equal(true);
    });

    it('should handle valid leaveGame', () => {
        const data = { lobbyId: 'l1', playerName: 'p' };
        socketService['handleLeaveGame'](mockSocket, data.lobbyId, data.playerName);
        expect(lobbyHandler.leaveGame.calledWith(mockSocket, 'l1', 'p')).to.be.equal(true);
    });

    it('should handle lockLobby and emit error on invalid ID', () => {
        socketService['handleLockLobby'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
    });

    it('should lock valid lobby', () => {
        socketService['handleLockLobby'](mockSocket, 'l1');
        expect(lobbyHandler.lockLobby.calledWith(mockSocket, 'l1')).to.be.equal(true);
    });

    it('should get lobby and handle errors', () => {
        const cb = sandbox.spy();
        socketService['handleGetLobby'](mockSocket, null as any, cb);
        expect(cb.calledWith(null)).to.be.equal(true);

        lobbyHandler.getLobby.returns(undefined);
        socketService['handleGetLobby'](mockSocket, 'l1', cb);
        expect(cb.calledWith(null)).to.be.equal(true);
    });

    it('should get valid lobby', () => {
        const lobby = {} as GameLobby;
        lobbyHandler.getLobby.returns(lobby);
        const cb = sandbox.spy();
        socketService['handleGetLobby'](mockSocket, 'l1', cb);
        expect(cb.calledWith(lobby)).to.be.equal(true);
    });

    it('should get gameId and handle error', () => {
        const cb = sandbox.spy();
        socketService['handleGetGameId'](mockSocket, null as any, cb);
        expect(cb.calledWith(null)).to.be.equal(true);
    });

    it('should verify callback behavior in handleGetGameId', () => {
        const callback = sandbox.spy();

        socketService['handleGetGameId'](mockSocket, null as any, callback);
        expect(callback.calledWith(null)).to.be.equal(true);
        callback.resetHistory();

        lobbyHandler.getLobby.returns(undefined);
        socketService['handleGetGameId'](mockSocket, 'nonexistentLobby', callback);
        expect(callback.calledWith(null)).to.be.equal(true);
        callback.resetHistory();

        lobbyHandler.getLobby.returns({} as GameLobby);
        socketService['handleGetGameId'](mockSocket, 'lobbyWithoutGameId', callback);
        expect(callback.calledWith(null)).to.be.equal(true);
        callback.resetHistory();

        lobbyHandler.getLobby.returns({ gameId: 'game123' } as GameLobby);
        socketService['handleGetGameId'](mockSocket, 'validLobby', callback);
        expect(callback.calledWith('game123')).to.be.equal(true);
    });

    it('should handle verifyRoom with and without gameId', () => {
        const cb = sandbox.spy();
        socketService['handleVerifyRoom'](mockSocket, null as any, cb);
        expect(cb.calledWith({ exists: false })).to.be.equal(true);

        const response = { exists: true };
        validationHandler.verifyRoom.callsFake((s, id, c) => c(response));
        socketService['handleVerifyRoom'](mockSocket, { gameId: 'g1' }, cb);
        expect(cb.calledWith(response)).to.be.equal(true);
    });

    it('should handle verifyAvatars and fallback', () => {
        const cb = sandbox.spy();
        socketService['handleVerifyAvatars'](mockSocket, null as any, cb);
        expect(cb.calledWith({ avatars: [] })).to.be.equal(true);

        const res = { avatars: ['a'] };
        validationHandler.verifyAvatars.callsFake((s, id, c) => c(res));
        socketService['handleVerifyAvatars'](mockSocket, { lobbyId: 'l1' }, cb);
        expect(cb.calledWith(res)).to.be.equal(true);
    });

    it('should handle verifyUsername and fallback', () => {
        const cb = sandbox.spy();
        socketService['handleVerifyUsername'](mockSocket, null as any, cb);
        expect(cb.calledWith({ usernames: [] })).to.be.equal(true);

        const res = { usernames: ['u'] };
        validationHandler.verifyUsername.callsFake((s, id, c) => c(res));
        socketService['handleVerifyUsername'](mockSocket, { lobbyId: 'l1' }, cb);
        expect(cb.calledWith(res)).to.be.equal(true);
    });

    it('should handle requestStart and fallback', () => {
        socketService['handleRequestStart'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);

        socketService['handleRequestStart'](mockSocket, 'l1');
        expect(gameHandler.handleRequestStart.calledWith(mockSocket, 'l1')).to.be.equal(true);
    });

    it('should handle endTurn and fallback', () => {
        socketService['handleEndTurn'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.be.equal(true);

        socketService['handleEndTurn'](mockSocket, { lobbyId: 'l1' });
        expect(gameHandler.handleEndTurn.calledWith(mockSocket, 'l1')).to.be.equal(true);
    });

    it('should handle requestMovement and fallback', () => {
        socketService['handleRequestMovement'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.be.equal(true);

        const data = { lobbyId: 'l1', coordinates: [{ x: 1, y: 1 }] };
        socketService['handleRequestMovement'](mockSocket, data);
        expect(gameHandler.handleRequestMovement.calledWith(mockSocket, 'l1', data.coordinates)).to.be.equal(true);
    });

    it('should handle openDoor and fallback', () => {
        socketService['handleOpenDoor'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid door data')).to.be.equal(true);

        const tile: Tile = { x: 1, y: 1, type: 1, object: 1 };
        socketService['handleOpenDoor'](mockSocket, { lobbyId: 'l1', tile });
        expect(gameHandler.openDoor.calledWith(mockSocket, tile, 'l1')).to.be.equal(true);
    });

    it('should handle disconnectFromRoom', () => {
        socketService['handleDisconnectFromRoom'](mockSocket, 'lobbyId123');
        expect(disconnectHandler.handleDisconnectFromRoom.calledWith(mockSocket, 'lobbyId123')).to.be.equal(true);
    });

    it('should handle playersUpdate', () => {
        const players = [{ id: 'player1' }, { id: 'player2' }] as Player[];
        socketService['handlePlayersUpdate'](mockSocket, 'lobbyId123', players);
        expect(gameHandler.handlePlayersUpdate.calledWith(mockSocket, 'lobbyId123', players)).to.be.equal(true);
    });

    it('should handle closeDoor and fallback', () => {
        socketService['handleCloseDoor'](mockSocket, null as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid door data')).to.be.equal(true);

        const tile: Tile = { x: 2, y: 2, type: 2, object: 2 };
        socketService['handleCloseDoor'](mockSocket, { lobbyId: 'l1', tile });
        expect(gameHandler.closeDoor.calledWith(mockSocket, tile, 'l1')).to.be.equal(true);
    });

    it('should handle disconnect', () => {
        socketService['handleDisconnect'](mockSocket);
        expect(disconnectHandler.handleDisconnect.calledWith(mockSocket)).to.be.equal(true);
    });
    it('should emit error if openDoor data.tile is missing', () => {
        socketService['handleOpenDoor'](mockSocket, { lobbyId: 'l1', tile: null } as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid tile data')).to.be.equal(true);
    });
    it('should get gameId from valid lobby', () => {
        const lobby = { gameId: 'game1' } as GameLobby;
        lobbyHandler.getLobby.returns(lobby);
        const cb = sandbox.spy();
        socketService['handleGetGameId'](mockSocket, 'l1', cb);
        expect(cb.calledWith('game1')).to.be.equal(true);
    });

    it('should return null if lobby exists but gameId is missing', () => {
        const lobby = {} as GameLobby;
        lobbyHandler.getLobby.returns(lobby);
        const cb = sandbox.spy();
        socketService['handleGetGameId'](mockSocket, 'l1', cb);
        expect(cb.calledWith(null)).to.be.equal(true);
    });

    it('should emit error if openDoor data.lobbyId is missing', () => {
        const data: { lobbyId: string | null; tile: Tile } = { lobbyId: null, tile: {} as Tile };
        socketService['handleOpenDoor'](mockSocket, data as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
    });

    it('should emit error if openDoor data.tile is missing', () => {
        const data: { lobbyId: string; tile: Tile | null } = { lobbyId: 'l1', tile: null };
        socketService['handleOpenDoor'](mockSocket, data as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid tile data')).to.be.equal(true);
    });

    it('should emit error if closeDoor data.lobbyId is missing', () => {
        const data: { lobbyId: string | null; tile: Tile } = { lobbyId: null, tile: {} as Tile };
        socketService['handleCloseDoor'](mockSocket, data as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
    });

    it('should emit error if closeDoor data.tile is missing', () => {
        const data: { lobbyId: string; tile: Tile | null } = { lobbyId: 'l1', tile: null };
        socketService['handleCloseDoor'](mockSocket, data as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid tile data')).to.be.equal(true);
    });

    it('should emit error if endTurn data.lobbyId is missing', () => {
        socketService['handleEndTurn'](mockSocket, { lobbyId: null } as any);
        expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.be.equal(true);
    });

    it('should emit error if requestMovement data.coordinates is missing', () => {
        const data: { lobbyId: string; coordinates: { x: number; y: number }[] | null } = { lobbyId: 'l1', coordinates: null };
        socketService['handleRequestMovement'](mockSocket, data as any);
        expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.be.equal(true);
    });

    it('should handle verifyAvatars with invalid lobbyId in data', () => {
        const cb = sandbox.spy();
        socketService['handleVerifyAvatars'](mockSocket, { lobbyId: null }, cb);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(cb.calledWith({ avatars: [] })).to.be.equal(true);
    });

    it('should handle verifyUsername with invalid lobbyId in data', () => {
        const cb = sandbox.spy();
        socketService['handleVerifyUsername'](mockSocket, { lobbyId: null }, cb);
        expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.equal(true);
        expect(cb.calledWith({ usernames: [] })).to.be.equal(true);
    });

    it('should call handleVerifyUsername when verifyUsername event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'verifyUsername')?.args[1];
        const callback = sandbox.spy();

        handler({ lobbyId: 'lobbyXYZ' }, callback);
        expect(validationHandler.verifyUsername.calledWith(socketMock, 'lobbyXYZ', callback)).to.be.equal(true);
    });
    it('should call handleVerifyRoom when verifyRoom event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'verifyRoom')?.args[1];
        const callback = sandbox.spy();

        handler({ gameId: 'gameXYZ' }, callback);
        expect(validationHandler.verifyRoom.calledWith(socketMock, 'gameXYZ', callback)).to.be.equal(true);
    });
    it('should call handleCreateLobby when createLobby event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'createLobby')?.args[1];
        const game = { id: 'gameX' } as Game;

        handler(game);
        expect(lobbyHandler.createLobby.calledWith(game)).to.be.equal(true);
    });
    it('should call handleJoinLobby when joinLobby event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'joinLobby')?.args[1];
        const data = { lobbyId: 'lobby123', player: { id: 'player1' } as Player };

        handler(data);
        expect(lobbyHandler.handleJoinLobbyRequest.calledWith(socketMock, data.lobbyId, data.player)).to.be.equal(true);
    });
    it('should call handleLeaveLobby when leaveLobby event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'leaveLobby')?.args[1];
        const data = { lobbyId: 'lobby123', playerName: 'Rita' };

        handler(data);
        expect(lobbyHandler.leaveLobby.calledWith(socketMock, data.lobbyId, data.playerName)).to.be.equal(true);
    });
    it('should call handleLockLobby when lockLobby event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'lockLobby')?.args[1];
        const lobbyId = 'lobbyXYZ';

        handler(lobbyId);
        expect(lobbyHandler.lockLobby.calledWith(socketMock, lobbyId)).to.be.equal(true);
    });
    it('should call handleGetLobby when getLobby event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'getLobby')?.args[1];
        const callback = sandbox.spy();

        lobbyHandler.getLobby.returns({ id: 'lobbyABC' } as GameLobby);

        handler('lobbyABC', callback);
        expect(callback.calledWith({ id: 'lobbyABC' })).to.be.equal(true);
    });
    it('should call handleGetGameId when getGameId event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, connectionHandler: any) => {
            if (event === 'connection') connectionHandler(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'getGameId')?.args[1];
        const callback = sandbox.spy();

        lobbyHandler.getLobby.returns({ gameId: 'gameXYZ' } as GameLobby);

        handler('lobbyABC', callback);
        expect(callback.calledWith('gameXYZ')).to.be.equal(true);
    });
    it('should call handleRequestStart when requestStart event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'requestStart')?.args[1];
        handler('lobbyABC');
        expect(gameHandler.handleRequestStart.calledWith(socketMock, 'lobbyABC')).to.be.equal(true);
    });
    it('should call handleEndTurn when endTurn event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'endTurn')?.args[1];
        handler({ lobbyId: 'lobbyXYZ' });
        expect(gameHandler.handleEndTurn.calledWith(socketMock, 'lobbyXYZ')).to.be.equal(true);
    });
    it('should call handleRequestMovement when requestMovement event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'requestMovement')?.args[1];
        const coords = [{ x: 1, y: 2 }];
        handler({ lobbyId: 'lobbyXYZ', coordinates: coords });
        expect(gameHandler.handleRequestMovement.calledWith(socketMock, 'lobbyXYZ', coords)).to.be.equal(true);
    });
    it('should call handleOpenDoor when openDoor event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'openDoor')?.args[1];
        const tile = { x: 3, y: 3, type: 1, object: 1 };
        handler({ lobbyId: 'lobbyXYZ', tile });
        expect(gameHandler.openDoor.calledWith(socketMock, tile, 'lobbyXYZ')).to.be.equal(true);
    });
    it('should call handleCloseDoor when closeDoor event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'closeDoor')?.args[1];
        const tile = { x: 5, y: 5, type: 2, object: 2 };
        handler({ lobbyId: 'lobbyXYZ', tile });
        expect(gameHandler.closeDoor.calledWith(socketMock, tile, 'lobbyXYZ')).to.be.equal(true);
    });
    it('should call handleDisconnect when disconnect event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'disconnect')?.args[1];
        handler();
        expect(disconnectHandler.handleDisconnect.calledWith(socketMock)).to.be.equal(true);
    });
    it('should call handleVerifyAvatars when verifyAvatars event is received', () => {
        const socketMock: any = { on: sandbox.spy(), emit: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, callBack: any) => {
            if (event === 'connection') callBack(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'verifyAvatars')?.args[1];
        const callback = sandbox.spy();

        handler({ lobbyId: 'lobbyABC' }, callback);
        expect(validationHandler.verifyAvatars.calledWith(socketMock, 'lobbyABC', callback)).to.be.equal(true);
    });
    it('should call handleBattleInitialization when initializeBattle event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'initializeBattle')?.args[1];
        const data = {
            currentPlayer: { id: 'p1' },
            opponent: { id: 'p2' },
            lobbyId: 'lobby123',
        };
        handler(data);
        expect(gameHandler.initializeBattle.calledWith(socketMock, data.currentPlayer, data.opponent)).to.be.equal(true);
    });

    it('should call handleStartBattle when startBattle event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'startBattle')?.args[1];
        const data = {
            lobbyId: 'lobby1',
            currentPlayer: { id: 'p1' },
            opponent: { id: 'p2' },
            time: 5,
        };
        handler(data);
        expect(gameHandler.startBattle.calledWith(data.lobbyId, data.currentPlayer, data.opponent, data.time)).to.be.equal(true);
    });

    it('should call handleChangeTurnEnd when changeTurnEndTimer event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'changeTurnEndTimer')?.args[1];
        const data = {
            currentPlayer: { id: 'p1' },
            opponent: { id: 'p2' },
            playerTurn: 'p1',
            gameState: {} as any,
        };
        handler(data);
        expect(gameHandler.changeTurnEnd.calledWith(data.currentPlayer, data.opponent, data.playerTurn, data.gameState)).to.be.equal(true);
    });

    it('should call handleDefeat when playerDefeated event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'playerDefeated')?.args[1];
        const data = {
            winner: { id: 'p2' }, // Add the winner
            loser: { id: 'p1' }, // Rename player to loser for clarity
            lobbyId: 'lobby123',
        };
        handler(data);
        expect(gameHandler.handleDefeat.calledWith(data.lobbyId, data.winner, data.loser)).to.be.equal(true);
    });

    it('should call handleFlee when fleeCombat event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'fleeCombat')?.args[1];
        const data = {
            lobbyId: 'lobby123',
            player: { id: 'p1' },
            success: true,
        };
        handler(data);
        expect(gameHandler.handleFlee.calledWith(data.lobbyId, data.player)).to.be.equal(true);
    });

    it('should call terminateAttack when terminateAttack event is received', () => {
        const socketMock: any = { on: sandbox.spy() };
        const ioOnSpy = sandbox.stub();
        (socketService as any).io = { on: ioOnSpy };

        ioOnSpy.callsFake((event: string, cb: any) => {
            if (event === 'connection') cb(socketMock);
        });

        socketService.init();

        const handler = socketMock.on.getCalls().find((c: { args: [string, any] }) => c.args[0] === 'terminateAttack')?.args[1];
        const data = { lobbyId: 'lobbyXYZ' };
        handler(data);
        expect(gameHandler.handleTerminateAttack.calledWith(data.lobbyId)).to.be.equal(true);
    });
});
