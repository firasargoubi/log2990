/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { DisconnectHandlerService } from '@app/services/disconnect-handler.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { SocketService } from '@app/services/socket.service';
import { ValidationSocketHandlerService } from '@app/services/validation-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { Game, Tile } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { Server as HttpServer } from 'http';
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
    let socketIOStub: any;

    beforeEach(() => {
        sandbox = createSandbox();
        httpServer = {} as HttpServer;

        // Create stubbed instances for all dependencies
        mockSocket = createStubInstance<Socket>(Socket);
        lobbyHandler = createStubInstance(LobbySocketHandlerService);
        gameHandler = createStubInstance(GameSocketHandlerService);
        validationHandler = createStubInstance(ValidationSocketHandlerService);
        disconnectHandler = createStubInstance(DisconnectHandlerService);

        // Create a stub for Socket.IO Server
        socketIOStub = {
            on: sandbox.stub().returnsThis(),
            emit: sandbox.stub(),
            to: sandbox.stub().returnsThis(),
        };

        // Skip stubbing the Socket.IO constructor
        socketService = new SocketService(
            httpServer,
            lobbyHandler as unknown as LobbySocketHandlerService,
            gameHandler as unknown as GameSocketHandlerService,
            validationHandler as unknown as ValidationSocketHandlerService,
            disconnectHandler as unknown as DisconnectHandlerService,
        );

        // Replace the io property with our stub
        (socketService as any).io = socketIOStub;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor and init', () => {
        it('should set up server and handlers in constructor', () => {
            // Create a new instance to test constructor
            const newSocketService = new SocketService(
                httpServer,
                lobbyHandler as unknown as LobbySocketHandlerService,
                gameHandler as unknown as GameSocketHandlerService,
                validationHandler as unknown as ValidationSocketHandlerService,
                disconnectHandler as unknown as DisconnectHandlerService,
            );

            // Replace io to avoid actual initialization
            (newSocketService as any).io = socketIOStub;

            // Verify that handlers were set up
            expect(lobbyHandler.setServer.calledOnce).to.be.true;
            expect(gameHandler.setServer.calledOnce).to.be.true;
            expect(disconnectHandler.setServer.calledOnce).to.be.true;
        });

        it('should register connection event handler', () => {
            socketService.init();
            expect(socketIOStub.on.calledWith('connection')).to.be.true;
        });

        it('should register all event handlers when a socket connects', () => {
            const onStub = sandbox.stub();
            const socket = { on: onStub };

            // Use firstCall.args to get the callback
            socketService.init();
            const connectionHandler = socketIOStub.on.firstCall.args[1];
            connectionHandler(socket);

            // Verify that all expected event handlers are registered
            expect(onStub.calledWith('createLobby')).to.be.true;
            expect(onStub.calledWith('joinLobby')).to.be.true;
            expect(onStub.calledWith('leaveLobby')).to.be.true;
            expect(onStub.calledWith('leaveGame')).to.be.true;
            expect(onStub.calledWith('lockLobby')).to.be.true;
            expect(onStub.calledWith('getLobby')).to.be.true;
            expect(onStub.calledWith('getGameId')).to.be.true;
            expect(onStub.calledWith('verifyRoom')).to.be.true;
            expect(onStub.calledWith('verifyAvatars')).to.be.true;
            expect(onStub.calledWith('verifyUsername')).to.be.true;
            expect(onStub.calledWith('requestStart')).to.be.true;
            expect(onStub.calledWith('endTurn')).to.be.true;
            expect(onStub.calledWith('requestMovement')).to.be.true;
            expect(onStub.calledWith('updatePlayers')).to.be.true;
            expect(onStub.calledWith('openDoor')).to.be.true;
            expect(onStub.calledWith('closeDoor')).to.be.true;
            expect(onStub.calledWith('disconnect')).to.be.true;
            expect(onStub.calledWith('disconnectFromRoom')).to.be.true;
        });
    });

    describe('handleCreateLobby', () => {
        it('should emit error if game data is invalid', () => {
            (socketService as any).handleCreateLobby(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Invalid game data')).to.be.true;
        });

        it('should create a lobby and emit result', () => {
            const game = { id: 'game1' } as Game;
            const lobby = { id: 'lobby1' } as GameLobby;

            lobbyHandler.createLobby.returns(lobby);

            (socketService as any).handleCreateLobby(mockSocket, game);

            expect(lobbyHandler.createLobby.calledWith(game)).to.be.true;
            expect(mockSocket.emit.calledWith('lobbyCreated', { lobby })).to.be.true;
        });
    });

    describe('handleJoinLobby', () => {
        it('should emit error if data is invalid', () => {
            (socketService as any).handleJoinLobby(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Invalid player data')).to.be.true;
        });

        it('should call lobbyHandler with correct parameters', () => {
            const data = {
                lobbyId: 'lobby1',
                player: { id: 'player1' } as Player,
            };

            (socketService as any).handleJoinLobby(mockSocket, data);

            expect(lobbyHandler.handleJoinLobbyRequest.calledWith(mockSocket, data.lobbyId, data.player)).to.be.true;
        });
    });

    describe('handleLeaveLobby', () => {
        it('should emit error if data is invalid', () => {
            (socketService as any).handleLeaveLobby(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby or player data')).to.be.true;
        });

        it('should call lobbyHandler with correct parameters', () => {
            const data = {
                lobbyId: 'lobby1',
                playerName: 'player1',
            };

            (socketService as any).handleLeaveLobby(mockSocket, data);

            expect(lobbyHandler.leaveLobby.calledWith(mockSocket, data.lobbyId, data.playerName)).to.be.true;
        });
    });

    describe('handleLeaveGame', () => {
        it('should call lobbyHandler with correct parameters', () => {
            const lobbyId = 'lobby1';
            const playerName = 'player1';

            (socketService as any).handleLeaveGame(mockSocket, lobbyId, playerName);

            expect(lobbyHandler.leaveGame.calledWith(mockSocket, lobbyId, playerName)).to.be.true;
        });
    });

    describe('handleLockLobby', () => {
        it('should emit error if lobby ID is invalid', () => {
            (socketService as any).handleLockLobby(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.true;
        });

        it('should call lobbyHandler with correct parameters', () => {
            const lobbyId = 'lobby1';

            (socketService as any).handleLockLobby(mockSocket, lobbyId);

            expect(lobbyHandler.lockLobby.calledWith(mockSocket, lobbyId)).to.be.true;
        });
    });

    describe('handleGetLobby', () => {
        it('should emit error and call callback with null if lobby ID is invalid', () => {
            const callback = sandbox.stub();

            (socketService as any).handleGetLobby(mockSocket, null, callback);

            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.true;
            expect(callback.calledWith(null)).to.be.true;
        });

        it('should call lobbyHandler and callback with result', () => {
            const lobbyId = 'lobby1';
            const lobby = { id: lobbyId } as GameLobby;
            const callback = sandbox.stub();

            lobbyHandler.getLobby.returns(lobby);

            (socketService as any).handleGetLobby(mockSocket, lobbyId, callback);

            expect(lobbyHandler.getLobby.calledWith(lobbyId)).to.be.true;
            expect(callback.calledWith(lobby)).to.be.true;
        });

        it('should call callback with null if lobby not found', () => {
            const lobbyId = 'lobby1';
            const callback = sandbox.stub();

            lobbyHandler.getLobby.returns(undefined);

            (socketService as any).handleGetLobby(mockSocket, lobbyId, callback);

            expect(callback.calledWith(null)).to.be.true;
        });
    });

    describe('handleGetGameId', () => {
        it('should emit error and call callback with null if lobby ID is invalid', () => {
            const callback = sandbox.stub();

            (socketService as any).handleGetGameId(mockSocket, null, callback);

            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.true;
            expect(callback.calledWith(null)).to.be.true;
        });

        it('should call callback with gameId if lobby found', () => {
            const lobbyId = 'lobby1';
            const gameId = 'game1';
            const lobby = { id: lobbyId, gameId } as GameLobby;
            const callback = sandbox.stub();

            lobbyHandler.getLobby.returns(lobby);

            (socketService as any).handleGetGameId(mockSocket, lobbyId, callback);

            expect(lobbyHandler.getLobby.calledWith(lobbyId)).to.be.true;
            expect(callback.calledWith(gameId)).to.be.true;
        });

        it('should call callback with null if lobby not found or has no gameId', () => {
            const lobbyId = 'lobby1';
            const callback = sandbox.stub();

            // Lobby without gameId
            lobbyHandler.getLobby.returns({} as GameLobby);

            (socketService as any).handleGetGameId(mockSocket, lobbyId, callback);

            expect(callback.calledWith(null)).to.be.true;
        });
    });

    describe('handleVerifyRoom', () => {
        it('should emit error and call callback with default result if data is invalid', () => {
            const callback = sandbox.stub();

            (socketService as any).handleVerifyRoom(mockSocket, null, callback);

            expect(mockSocket.emit.calledWith('error', 'Invalid game ID')).to.be.true;
            expect(callback.calledWith({ exists: false })).to.be.true;
        });

        it('should call validationHandler with correct parameters', () => {
            const data = { gameId: 'game1' };
            const callback = sandbox.stub();

            validationHandler.verifyRoom.callsFake((socket, id, cb) => {
                cb({ exists: true });
                return;
            });

            (socketService as any).handleVerifyRoom(mockSocket, data, callback);

            expect(validationHandler.verifyRoom.calledWith(mockSocket, data.gameId, callback)).to.be.true;
            expect(callback.calledWith({ exists: true })).to.be.true;
        });
    });

    describe('handleVerifyAvatars', () => {
        it('should emit error and call callback with default result if data is invalid', () => {
            const callback = sandbox.stub();

            (socketService as any).handleVerifyAvatars(mockSocket, null, callback);

            expect(mockSocket.emit.calledWith('error')).to.be.true;
            expect(callback.calledWith({ avatars: [] })).to.be.true;
        });

        it('should emit error and call callback with default result if lobbyId is missing', () => {
            const data = { lobbyId: null as any };
            const callback = sandbox.stub();

            (socketService as any).handleVerifyAvatars(mockSocket, data, callback);

            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.true;
            expect(callback.calledWith({ avatars: [] })).to.be.true;
        });

        it('should call validationHandler with correct parameters', () => {
            const data = { lobbyId: 'lobby1' };
            const callback = sandbox.stub();
            const result = { avatars: ['avatar1'] };

            validationHandler.verifyAvatars.callsFake((socket, id, cb) => {
                cb(result);
                return;
            });

            (socketService as any).handleVerifyAvatars(mockSocket, data, callback);

            expect(validationHandler.verifyAvatars.calledWith(mockSocket, data.lobbyId, callback)).to.be.true;
            expect(callback.calledWith(result)).to.be.true;
        });
    });

    describe('handleVerifyUsername', () => {
        it('should emit error and call callback with default result if data is invalid', () => {
            const callback = sandbox.stub();

            (socketService as any).handleVerifyUsername(mockSocket, null, callback);

            expect(mockSocket.emit.calledWith('error')).to.be.true;
            expect(callback.calledWith({ usernames: [] })).to.be.true;
        });

        it('should emit error and call callback with default result if lobbyId is missing', () => {
            const data = { lobbyId: null as any };
            const callback = sandbox.stub();

            (socketService as any).handleVerifyUsername(mockSocket, data, callback);

            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.true;
            expect(callback.calledWith({ usernames: [] })).to.be.true;
        });

        it('should call validationHandler with correct parameters', () => {
            const data = { lobbyId: 'lobby1' };
            const callback = sandbox.stub();
            const result = { usernames: ['username1'] };

            validationHandler.verifyUsername.callsFake((socket, id, cb) => {
                cb(result);
                return;
            });

            (socketService as any).handleVerifyUsername(mockSocket, data, callback);

            expect(validationHandler.verifyUsername.calledWith(mockSocket, data.lobbyId, callback)).to.be.true;
            expect(callback.calledWith(result)).to.be.true;
        });
    });

    describe('handleRequestStart', () => {
        it('should emit error if lobby ID is invalid', () => {
            (socketService as any).handleRequestStart(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.true;
        });

        it('should call gameHandler with correct parameters', () => {
            const lobbyId = 'lobby1';

            (socketService as any).handleRequestStart(mockSocket, lobbyId);

            expect(gameHandler.handleRequestStart.calledWith(mockSocket, lobbyId)).to.be.true;
        });
    });

    describe('handleEndTurn', () => {
        it('should emit error if data is invalid', () => {
            (socketService as any).handleEndTurn(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.be.true;
        });

        it('should emit error if lobbyId is missing', () => {
            const data = { lobbyId: null as any };
            (socketService as any).handleEndTurn(mockSocket, data);
            expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.be.true;
        });

        it('should call gameHandler with correct parameters', () => {
            const data = { lobbyId: 'lobby1' };

            (socketService as any).handleEndTurn(mockSocket, data);

            expect(gameHandler.handleEndTurn.calledWith(mockSocket, data.lobbyId)).to.be.true;
        });
    });

    describe('handleRequestMovement', () => {
        it('should emit error if data is invalid', () => {
            (socketService as any).handleRequestMovement(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.be.true;
        });

        it('should emit error if coordinates are missing', () => {
            const data = { lobbyId: 'lobby1', coordinates: null as any };

            (socketService as any).handleRequestMovement(mockSocket, data);

            expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.be.true;
        });

        it('should call gameHandler with correct parameters', () => {
            const data = {
                lobbyId: 'lobby1',
                coordinates: [{ x: 1, y: 1 }],
            };

            (socketService as any).handleRequestMovement(mockSocket, data);

            expect(gameHandler.handleRequestMovement.calledWith(mockSocket, data.lobbyId, data.coordinates)).to.be.true;
        });
    });

    describe('handleOpenDoor', () => {
        it('should emit error if data is invalid', () => {
            (socketService as any).handleOpenDoor(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Invalid door data')).to.be.true;
        });

        it('should emit error if lobby ID is missing', () => {
            const data = { lobbyId: null as any, tile: {} as Tile };

            (socketService as any).handleOpenDoor(mockSocket, data);

            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.true;
        });

        it('should emit error if tile is missing', () => {
            const data = { lobbyId: 'lobby1', tile: null as any };

            (socketService as any).handleOpenDoor(mockSocket, data);

            expect(mockSocket.emit.calledWith('error', 'Invalid tile data')).to.be.true;
        });

        it('should call gameHandler with correct parameters', () => {
            const tile = { x: 1, y: 1, type: 1, object: 1 } as Tile;
            const data = { lobbyId: 'lobby1', tile };

            (socketService as any).handleOpenDoor(mockSocket, data);

            expect(gameHandler.openDoor.calledWith(mockSocket, tile, data.lobbyId)).to.be.true;
        });
    });

    describe('handleCloseDoor', () => {
        it('should emit error if data is invalid', () => {
            (socketService as any).handleCloseDoor(mockSocket, null);
            expect(mockSocket.emit.calledWith('error', 'Invalid door data')).to.be.true;
        });

        it('should emit error if lobby ID is missing', () => {
            const data = { lobbyId: null as any, tile: {} as Tile };

            (socketService as any).handleCloseDoor(mockSocket, data);

            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.be.true;
        });

        it('should emit error if tile is missing', () => {
            const data = { lobbyId: 'lobby1', tile: null as any };

            (socketService as any).handleCloseDoor(mockSocket, data);

            expect(mockSocket.emit.calledWith('error', 'Invalid tile data')).to.be.true;
        });

        it('should call gameHandler with correct parameters', () => {
            const tile = { x: 1, y: 1, type: 1, object: 1 } as Tile;
            const data = { lobbyId: 'lobby1', tile };

            (socketService as any).handleCloseDoor(mockSocket, data);

            expect(gameHandler.closeDoor.calledWith(mockSocket, tile, data.lobbyId)).to.be.true;
        });
    });

    describe('handlePlayersUpdate', () => {
        it('should call gameHandler with correct parameters', () => {
            const lobbyId = 'lobby1';
            const players = [{ id: 'player1' }] as Player[];

            (socketService as any).handlePlayersUpdate(mockSocket, lobbyId, players);

            expect(gameHandler.handlePlayersUpdate.calledWith(mockSocket, lobbyId, players)).to.be.true;
        });
    });

    describe('handleDisconnect', () => {
        it('should call disconnectHandler with correct parameters', () => {
            (socketService as any).handleDisconnect(mockSocket);
            expect(disconnectHandler.handleDisconnect.calledWith(mockSocket)).to.be.true;
        });
    });

    describe('handleDisconnectFromRoom', () => {
        it('should call disconnectHandler with correct parameters', () => {
            const lobbyId = 'lobby1';

            (socketService as any).handleDisconnectFromRoom(mockSocket, lobbyId);

            expect(disconnectHandler.handleDisconnectFromRoom.calledWith(mockSocket, lobbyId)).to.be.true;
        });
    });
});
