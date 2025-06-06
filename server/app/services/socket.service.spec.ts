/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameLobby } from '@common/game-lobby';
import { Game, Tile } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createServer, Server as HttpServer } from 'http';
import { createSandbox, SinonSandbox } from 'sinon';
import { Socket } from 'socket.io';
import { SocketService } from './socket.service';

describe('SocketService', () => {
    let sandbox: SinonSandbox;
    let httpServer: HttpServer;
    let socketService: SocketService;
    let mockSocket: any;
    let ioStub: any;

    let lobbyHandler: any;
    let gameLifecycleService: any;
    let gameActionService: any;
    let validationHandler: any;
    let disconnectHandler: any;
    let boardService: any;
    let itemService: any;

    beforeEach(() => {
        sandbox = createSandbox();
        httpServer = createServer();

        lobbyHandler = {
            setServer: sandbox.stub(),
            createLobby: sandbox.stub(),
            handleJoinLobbyRequest: sandbox.stub(),
            leaveLobby: sandbox.stub(),
            leaveGame: sandbox.stub(),
            lockLobby: sandbox.stub(),
            getLobby: sandbox.stub(),
        };
        gameLifecycleService = {
            setServer: sandbox.stub(),
            handleRequestStart: sandbox.stub(),
            handleEndTurn: sandbox.stub(),
            handleSetDebug: sandbox.stub(),
            handlePlayersUpdate: sandbox.stub(),
            handleRequestMovement: sandbox.stub(),
            handleFlee: sandbox.stub(),
            getGameStateOrEmitError: sandbox.stub(),
            createTeams: sandbox.stub(),
        };

        gameActionService = {
            setServer: sandbox.stub(),
            startBattle: sandbox.stub(),
            handleAttackAction: sandbox.stub(),
            handleTeleport: sandbox.stub(),
            openDoor: sandbox.stub(),
            closeDoor: sandbox.stub(),
            handleFlee: sandbox.stub(),
        };
        validationHandler = { verifyRoom: sandbox.stub(), verifyAvatars: sandbox.stub(), verifyUsername: sandbox.stub() };
        disconnectHandler = { handleDisconnect: sandbox.stub(), handleDisconnectFromRoom: sandbox.stub() };
        boardService = { findAllPaths: sandbox.stub(), calculateShortestMoves: sandbox.stub() };
        itemService = { removeAttributeEffects: sandbox.stub() };

        mockSocket = {
            emit: sandbox.stub(),
            on: sandbox.stub(),
            id: 'socket1',
        };

        ioStub = {
            on: sandbox.stub(),
            to: sandbox.stub().returns({ emit: sandbox.stub() }),
        };

        socketService = new SocketService(
            httpServer,
            lobbyHandler,
            validationHandler,
            disconnectHandler,
            boardService,
            itemService,
            gameActionService,
            gameLifecycleService,
        );

        (socketService as any).io = ioStub;
    });

    afterEach(() => {
        sandbox.restore();
    });
    it('should set server instances in constructor', () => {
        expect(lobbyHandler.setServer.calledOnce).to.equal(true);
        expect(gameActionService.setServer.calledOnce).to.equal(true);
        expect(gameLifecycleService.setServer.calledOnce).to.equal(true);
    });

    it('should register connection event on init', () => {
        socketService.init();
        expect(ioStub.on.calledWith('connection')).to.equal(true);
    });

    it('should properly set up socket connection handlers', () => {
        socketService.init();
        expect(ioStub.on.calledWith('connection')).to.equal(true);

        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

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
            'teleport',
            'setDebug',
            'updatePlayers',
            'openDoor',
            'closeDoor',
            'disconnect',
            'disconnectFromRoom',
            'startBattle',
            'attack',
            'flee',
        ];

        expectedEvents.forEach((event) => {
            expect(mockSocket.on.calledWith(event)).to.equal(true, `Expected event ${event} to be registered`);
        });
    });

    it('should handle createLobby event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const createLobbyHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'createLobby')?.args[1];
        const game = { id: 'game1', name: 'Test Game' } as Game;
        const lobby = { id: 'lobby1', gameId: 'game1' } as GameLobby;

        lobbyHandler.createLobby.returns(lobby);

        if (createLobbyHandler) {
            createLobbyHandler(game);
            expect(lobbyHandler.createLobby.calledWith(game)).to.equal(true);
            expect(mockSocket.emit.calledWith('lobbyCreated', { lobby })).to.equal(true);

            mockSocket.emit.resetHistory();
            createLobbyHandler(null);
            expect(mockSocket.emit.calledWith('error', 'Invalid game data')).to.equal(true);
        }
    });

    it('should handle joinLobby event', () => {
        socketService.init();
        (mockSocket as any).join = sandbox.stub();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const joinLobbyHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'joinLobby')?.args[1];
        const player = { id: 'player1', name: 'Player 1' } as Player;

        if (joinLobbyHandler) {
            joinLobbyHandler({ lobbyId: 'lobby1', player });
            expect(lobbyHandler.handleJoinLobbyRequest.calledWith(mockSocket, 'lobby1', player)).to.equal(true);
        }
    });

    it('should handle leaveLobby event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const leaveLobbyHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'leaveLobby')?.args[1];

        if (leaveLobbyHandler) {
            leaveLobbyHandler({ lobbyId: 'lobby1', playerName: 'Player 1' });
            expect(lobbyHandler.leaveLobby.calledWith(mockSocket, 'lobby1', 'Player 1')).to.equal(true);

            mockSocket.emit.resetHistory();
            leaveLobbyHandler(null);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby or player data')).to.equal(true);
        }
    });

    it('should handle leaveGame event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const leaveGameHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'leaveGame')?.args[1];

        if (leaveGameHandler) {
            leaveGameHandler('lobby1', 'Player 1');
            expect(lobbyHandler.leaveGame.calledWith(mockSocket, 'lobby1', 'Player 1')).to.equal(true);
        }
    });

    it('should handle lockLobby event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const lockLobbyHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'lockLobby')?.args[1];

        if (lockLobbyHandler) {
            lockLobbyHandler('lobby1');
            expect(lobbyHandler.lockLobby.calledWith(mockSocket, 'lobby1')).to.equal(true);

            mockSocket.emit.resetHistory();
            lockLobbyHandler(null);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.equal(true);
        }
    });

    it('should handle getLobby event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const getLobbyHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'getLobby')?.args[1];
        const callbackStub = sandbox.stub();
        const lobby = { id: 'lobby1', gameId: 'game1' } as GameLobby;

        lobbyHandler.getLobby.returns(lobby);

        if (getLobbyHandler) {
            getLobbyHandler('lobby1', callbackStub);
            expect(lobbyHandler.getLobby.calledWith('lobby1')).to.equal(true);
            expect(callbackStub.calledWith(lobby)).to.equal(true);

            callbackStub.resetHistory();
            mockSocket.emit.resetHistory();
            getLobbyHandler(null, callbackStub);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.equal(true);
            expect(callbackStub.calledWith(null)).to.equal(true);

            callbackStub.resetHistory();
            lobbyHandler.getLobby.returns(null);
            getLobbyHandler('nonexistent', callbackStub);
            expect(callbackStub.calledWith(null)).to.equal(true);
        }
    });

    it('should handle getGameId event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const getGameIdHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'getGameId')?.args[1];
        const callbackStub = sandbox.stub();
        const lobby = { id: 'lobby1', gameId: 'game1' } as GameLobby;

        lobbyHandler.getLobby.returns(lobby);

        if (getGameIdHandler) {
            getGameIdHandler('lobby1', callbackStub);
            expect(lobbyHandler.getLobby.calledWith('lobby1')).to.equal(true);
            expect(callbackStub.calledWith('game1')).to.equal(true);

            callbackStub.resetHistory();
            mockSocket.emit.resetHistory();
            getGameIdHandler(null, callbackStub);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.equal(true);
            expect(callbackStub.calledWith(null)).to.equal(true);

            callbackStub.resetHistory();
            lobbyHandler.getLobby.returns({ id: 'lobby2' } as GameLobby);
            getGameIdHandler('lobby2', callbackStub);
            expect(callbackStub.calledWith(null)).to.equal(true);

            callbackStub.resetHistory();
            lobbyHandler.getLobby.returns(null);
            getGameIdHandler('nonexistent', callbackStub);
            expect(callbackStub.calledWith(null)).to.equal(true);
        }
    });

    it('should handle verifyRoom event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const verifyRoomHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'verifyRoom')?.args[1];
        const callbackStub = sandbox.stub();

        validationHandler.verifyRoom.callsFake(
            (socket: Socket, gameId: string, callback: (response: { exists: boolean; isLocked?: boolean }) => void) => {
                callback({ exists: true, isLocked: false });
            },
        );

        if (verifyRoomHandler) {
            verifyRoomHandler({ gameId: 'game1' }, callbackStub);
            expect(validationHandler.verifyRoom.calledWith(mockSocket, 'game1')).to.equal(true);
            expect(callbackStub.calledWith({ exists: true, isLocked: false })).to.equal(true);

            callbackStub.resetHistory();
            validationHandler.verifyRoom.resetHistory();
            verifyRoomHandler(null, callbackStub);
            expect(mockSocket.emit.calledWith('error', 'Invalid game ID')).to.equal(true);
            expect(callbackStub.calledWith({ exists: false })).to.equal(true);

            callbackStub.resetHistory();
            mockSocket.emit.resetHistory();
            verifyRoomHandler({ gameId: undefined }, callbackStub);
            expect(mockSocket.emit.calledWith('error', 'Invalid game ID')).to.equal(true);
            expect(callbackStub.calledWith({ exists: false })).to.equal(true);
        }
    });

    it('should handle verifyAvatars event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const verifyAvatarsHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'verifyAvatars')?.args[1];
        const callbackStub = sandbox.stub();

        validationHandler.verifyAvatars.callsFake((socket: Socket, lobbyId: string, callback: (response: { avatars: string[] }) => void) => {
            callback({ avatars: ['avatar1', 'avatar2'] });
        });

        if (verifyAvatarsHandler) {
            verifyAvatarsHandler({ lobbyId: 'lobby1' }, callbackStub);
            expect(validationHandler.verifyAvatars.calledWith(mockSocket, 'lobby1')).to.equal(true);
            expect(callbackStub.calledWith({ avatars: ['avatar1', 'avatar2'] })).to.equal(true);

            callbackStub.resetHistory();
            mockSocket.emit.resetHistory();
            verifyAvatarsHandler(null, callbackStub);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.equal(true);
            expect(callbackStub.calledWith({ avatars: [] })).to.equal(true);

            callbackStub.resetHistory();
            mockSocket.emit.resetHistory();
            verifyAvatarsHandler({ lobbyId: undefined }, callbackStub);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.equal(true);
            expect(callbackStub.calledWith({ avatars: [] })).to.equal(true);
        }
    });

    it('should handle verifyUsername event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const verifyUsernameHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'verifyUsername')?.args[1];
        const callbackStub = sandbox.stub();

        validationHandler.verifyUsername.callsFake((socket: Socket, lobbyId: string, callback: (response: { usernames: string[] }) => void) => {
            callback({ usernames: ['user1', 'user2'] });
        });

        if (verifyUsernameHandler) {
            verifyUsernameHandler({ lobbyId: 'lobby1' }, callbackStub);
            expect(validationHandler.verifyUsername.calledWith(mockSocket, 'lobby1')).to.equal(true);
            expect(callbackStub.calledWith({ usernames: ['user1', 'user2'] })).to.equal(true);

            callbackStub.resetHistory();
            mockSocket.emit.resetHistory();
            verifyUsernameHandler(null, callbackStub);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.equal(true);
            expect(callbackStub.calledWith({ usernames: [] })).to.equal(true);

            callbackStub.resetHistory();
            mockSocket.emit.resetHistory();
            verifyUsernameHandler({ lobbyId: undefined }, callbackStub);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.equal(true);
            expect(callbackStub.calledWith({ usernames: [] })).to.equal(true);
        }
    });

    it('should handle requestStart event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const requestStartHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'requestStart')?.args[1];

        if (requestStartHandler) {
            requestStartHandler('lobby1');
            expect(gameLifecycleService.handleRequestStart.calledWith(mockSocket, 'lobby1')).to.equal(true);

            mockSocket.emit.resetHistory();
            requestStartHandler(null);
            expect(mockSocket.emit.calledWith('error', 'Invalid lobby ID')).to.equal(true);
        }
    });

    it('should handle endTurn event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const endTurnHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'endTurn')?.args[1];

        if (endTurnHandler) {
            endTurnHandler({ lobbyId: 'lobby1' });
            expect(gameLifecycleService.handleEndTurn.calledWith(mockSocket, 'lobby1')).to.equal(true);

            mockSocket.emit.resetHistory();
            endTurnHandler(null);
            expect(mockSocket.emit.calledWith('error', 'Game not found.')).to.equal(true);
        }
    });

    it('should handle requestMovement event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const requestMovementHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'requestMovement')?.args[1];

        if (requestMovementHandler) {
            const coordinates = [{ x: 1, y: 2 }];
            requestMovementHandler({ lobbyId: 'lobby1', coordinates });
            expect(gameLifecycleService.handleRequestMovement.calledWith(mockSocket, 'lobby1', coordinates)).to.equal(true);

            mockSocket.emit.resetHistory();
            requestMovementHandler({ lobbyId: 'lobby1', coordinates: null });
            expect(mockSocket.emit.calledWith('error', 'Invalid coordinates')).to.equal(true);
        }
    });

    it('should handle teleport event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const teleportHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'teleport')?.args[1];

        if (teleportHandler) {
            const coordinates = { x: 3, y: 4 };
            teleportHandler({ lobbyId: 'lobby1', coordinates });
            expect(gameActionService.handleTeleport.calledWith(mockSocket, 'lobby1', coordinates)).to.equal(true);
        }
    });

    describe('SocketService', () => {
        let openDoorStub: any;

        beforeEach(() => {
            openDoorStub = gameActionService.openDoor;
        });
        it('should handle openDoor event', () => {
            socketService.init();
            const connectionHandler = ioStub.on.firstCall.args[1];
            connectionHandler(mockSocket);

            const openDoorHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'openDoor')?.args[1];
            const tile: Tile = { x: 1, y: 2, type: 1, object: 1 };

            if (openDoorHandler) {
                openDoorHandler({ lobbyId: 'lobby1', tile });
                expect(openDoorStub.calledWith(mockSocket, tile, 'lobby1')).to.equal(true);
            } else {
                throw new Error('openDoor handler not found on socket');
            }
        });
    });

    it('should handle closeDoor event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const closeDoorHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'closeDoor')?.args[1];
        const tile: Tile = { x: 1, y: 2, type: 1, object: 1 };

        if (closeDoorHandler) {
            closeDoorHandler({ lobbyId: 'lobby1', tile });
            expect(gameActionService.closeDoor.calledWith(mockSocket, tile, 'lobby1')).to.equal(true);
        }
    });

    it('should handle setDebug event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const setDebugHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'setDebug')?.args[1];

        if (setDebugHandler) {
            setDebugHandler({ lobbyId: 'lobby1', debug: true });
            expect(gameLifecycleService.handleSetDebug.calledWith(mockSocket, 'lobby1', true)).to.equal(true);
        }
    });

    it('should handle updatePlayers event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const updatePlayersHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'updatePlayers')?.args[1];
        const players = [{ id: 'player1' }, { id: 'player2' }] as Player[];

        if (updatePlayersHandler) {
            updatePlayersHandler('lobby1', players);
            expect(gameLifecycleService.handlePlayersUpdate.calledWith(mockSocket, 'lobby1', players)).to.equal(true);
        }
    });

    it('should handle startBattle event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const startBattleHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'startBattle')?.args[1];
        const battleData = {
            lobbyId: 'lobby1',
            currentPlayer: { id: 'player1' } as Player,
            opponent: { id: 'player2' } as Player,
        };

        if (startBattleHandler) {
            startBattleHandler(battleData);
            expect(gameActionService.startBattle.calledWith('lobby1', battleData.currentPlayer, battleData.opponent)).to.equal(true);
        }
    });

    it('should handle attack event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const attackHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'attack')?.args[1];
        const attackData = {
            lobbyId: 'lobby1',
            attacker: { id: 'player1' } as Player,
            defender: { id: 'player2' } as Player,
        };

        if (attackHandler) {
            attackHandler(attackData);
            expect(gameActionService.handleAttackAction.calledWith('lobby1', attackData.attacker, attackData.defender)).to.equal(true);
        }
    });

    it('should handle flee event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const fleeHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'flee')?.args[1];
        const fleeData = {
            lobbyId: 'lobby1',
            player: { id: 'player1' } as Player,
        };

        if (fleeHandler) {
            fleeHandler(fleeData);
            expect(gameActionService.handleFlee.calledWith('lobby1', fleeData.player)).to.equal(true);
        }
    });
    it('should handle disconnect event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const disconnHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'disconnect')?.args[1];

        if (disconnHandler) {
            disconnHandler();
            expect(disconnectHandler.handleDisconnect.calledWith(mockSocket)).to.equal(true);
        }
    });

    it('should handle disconnectFromRoom event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const disconnectFromRoomHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'disconnectFromRoom')?.args[1];

        if (disconnectFromRoomHandler) {
            disconnectFromRoomHandler('lobby1');
            expect(disconnectHandler.handleDisconnectFromRoom.calledWith(mockSocket, 'lobby1')).to.equal(true);
        }
    });
    it('should handle createTeams event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const createTeamsHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'createTeams')?.args[1];

        if (createTeamsHandler) {
            const players = [{ id: 'p1', name: 'Player 1' }] as Player[];
            createTeamsHandler({ lobbyId: 'lobby1', players });
            expect(gameLifecycleService.createTeams.calledWith('lobby1', players)).to.equal(true);
        }
    });
    it('should handle resolveInventory event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const resolveHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'resolveInventory')?.args[1];

        const mockGameState = {
            players: [{ id: 'socket1', items: [1], pendingItem: 2 }],
            playerPositions: [{ x: 0, y: 0 }],
            board: [[0]],
        };
        gameLifecycleService.getGameStateOrEmitError.returns(mockGameState);
        boardService.findAllPaths.returns([]);
        boardService.calculateShortestMoves.returns([]);

        if (resolveHandler) {
            resolveHandler({ lobbyId: 'lobby1', keptItems: [1] });
            expect(mockSocket.emit.notCalled).to.be.equal(true);
        }
    });
    it('should handle cancelInventoryChoice event', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const cancelHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'cancelInventoryChoice')?.args[1];

        const mockGameState = {
            players: [{ id: 'socket1', pendingItem: 5 }],
            playerPositions: [{ x: 1, y: 2 }],
            board: [
                [0, 0, 0],
                [0, 0, 0],
            ],
        };

        boardService.findAllPaths.returns([]);
        boardService.calculateShortestMoves.returns([]);

        gameLifecycleService.getGameStateOrEmitError.returns(mockGameState);

        if (cancelHandler) {
            cancelHandler({ lobbyId: 'lobby1' });
            expect(ioStub.to().emit.calledWith('boardModified')).to.be.equal(true);
        }
    });
    it('should call removeAttributeEffects when refused item is in player.items', () => {
        socketService.init();
        const connectionHandler = ioStub.on.firstCall.args[1];
        connectionHandler(mockSocket);

        const resolveHandler = mockSocket.on.getCalls().find((call: any) => call.args[0] === 'resolveInventory')?.args[1];

        const mockGameState = {
            players: [{ id: 'socket1', items: [1, 2], pendingItem: 3 }],
            playerPositions: [{ x: 0, y: 0 }],
            board: [[0]],
        };
        gameLifecycleService.getGameStateOrEmitError.returns(mockGameState);
        boardService.findAllPaths.returns([]);
        boardService.calculateShortestMoves.returns([]);

        if (resolveHandler) {
            resolveHandler({ lobbyId: 'lobby1', keptItems: [1, 3] });
            expect(itemService.removeAttributeEffects.calledOnceWith(mockGameState.players[0], 2)).to.equal(true);
        }
    });
});
