/* eslint-disable @typescript-eslint/no-explicit-any */
import { DisconnectHandlerService } from '@app/services/disconnect-handler.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { SocketService } from '@app/services/socket.service';
import { ValidationSocketHandlerService } from '@app/services/validation-socket-handler.service';
import { expect } from 'chai';
import { createServer, Server as HttpServer } from 'http';
import { createSandbox, createStubInstance, SinonSandbox, SinonStubbedInstance } from 'sinon';
import { Socket } from 'socket.io';

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

    it('should call setServer on construction', () => {
        expect(mockLobbyHandler.setServer.calledOnce).to.equal(true);
        expect(mockGameHandler.setServer.calledOnce).to.equal(true);
        expect(mockDisconnectHandler.setServer.calledOnce).to.equal(true);
    });

    it('should handle createLobby and emit lobbyCreated', () => {
        const game: any = { id: 'game123', mapSize: 'medium' };
        const fakeSocket: any = { emit: sandbox.spy() };
        mockLobbyHandler.createLobby.returns('lobby123');

        service['handleCreateLobby'](fakeSocket, game);

        expect(mockLobbyHandler.createLobby.calledWith(game)).to.equal(true);
        expect(fakeSocket.emit.calledWith('lobbyCreated', { lobbyId: 'lobby123' })).to.equal(true);
    });

    it('should handle joinLobby', () => {
        const data = {
            lobbyId: 'lobby1',
            player: {
                id: 'player1',
                name: 'TestPlayer',
                avatar: 'avatar.png',
                life: 100,
                speed: 10,
                attack: 5,
                defense: 5,
                isHost: false,
            },
        };
        service['handleJoinLobby'](mockSocket, data);
        expect(mockLobbyHandler.handleJoinLobbyRequest.calledWith(mockSocket, data.lobbyId, data.player)).to.equal(true);
    });

    it('should handle leaveLobby', () => {
        const data = { lobbyId: 'lobby1', playerName: 'Alice' };
        service['handleLeaveLobby'](mockSocket, data);
        expect(mockLobbyHandler.leaveLobby.calledWith(mockSocket, data.lobbyId, data.playerName)).to.equal(true);
    });

    it('should handle lockLobby', () => {
        service['handleLockLobby'](mockSocket, 'lobby1');
        expect(mockLobbyHandler.lockLobby.calledWith(mockSocket, 'lobby1')).to.equal(true);
    });

    it('should handle getLobby', () => {
        const callback = sandbox.spy();
        const fakeLobby: any = { id: 'lobby1' };
        mockLobbyHandler.getLobby.returns(fakeLobby);
        service['handleGetLobby'](mockSocket, 'lobby1', callback);
        expect(callback.calledWith(fakeLobby)).to.equal(true);
    });

    it('should handle getGameId', () => {
        const callback = sandbox.spy();
        mockLobbyHandler.getLobby.returns({
            gameId: 'game123',
            id: '',
            players: [],
            isLocked: false,
            maxPlayers: 0,
        });
        service['handleGetGameId'](mockSocket, 'lobby1', callback);
        expect(callback.calledWith('game123')).to.equal(true);
    });

    it('should handle verifyRoom', () => {
        const callback = sandbox.spy();
        const data = { gameId: 'game123' };
        service['handleVerifyRoom'](mockSocket, data, callback);
        expect(mockValidationHandler.verifyRoom.calledWith(mockSocket, data.gameId, callback)).to.equal(true);
    });

    it('should handle verifyAvatars', () => {
        const callback = sandbox.spy();
        const data = { lobbyId: 'lobby1' };
        service['handleVerifyAvatars'](mockSocket, data, callback);
        expect(mockValidationHandler.verifyAvatars.calledWith(mockSocket, data.lobbyId, callback)).to.equal(true);
    });

    it('should handle verifyUsername', () => {
        const callback = sandbox.spy();
        const data = { lobbyId: 'lobby1' };
        service['handleVerifyUsername'](mockSocket, data, callback);
        expect(mockValidationHandler.verifyUsername.calledWith(mockSocket, data.lobbyId, callback)).to.equal(true);
    });

    it('should handle requestStart', () => {
        service['handleRequestStart'](mockSocket, 'lobby1');
        expect(mockGameHandler.handleRequestStart.calledWith(mockSocket, 'lobby1')).to.equal(true);
    });

    it('should handle endTurn', () => {
        service['handleEndTurn'](mockSocket, { lobbyId: 'lobby1' });
        expect(mockGameHandler.handleEndTurn.calledWith(mockSocket, 'lobby1')).to.equal(true);
    });

    it('should handle requestMovement', () => {
        const data = { lobbyId: 'lobby1', coordinate: { x: 1, y: 1 } };
        service['handleRequestMovement'](mockSocket, data);
        expect(mockGameHandler.handleRequestMovement.calledWith(mockSocket, data.lobbyId, data.coordinate)).to.equal(true);
    });

    it('should handle requestPath', () => {
        const data = { lobbyId: 'lobby1', destination: { x: 2, y: 3 } };
        service['handleRequestPath'](mockSocket, data);
        expect(mockGameHandler.handlePathRequest.calledWith(mockSocket, data.lobbyId, data.destination)).to.equal(true);
    });

    it('should handle disconnect', () => {
        service['handleDisconnect'](mockSocket);
        expect(mockDisconnectHandler.handleDisconnect.calledWith(mockSocket)).to.equal(true);
    });
});
