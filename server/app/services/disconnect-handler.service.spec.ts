/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { expect } from 'chai';
import { createSandbox, SinonStubbedInstance } from 'sinon';
import { Socket } from 'socket.io';
import { DisconnectHandlerService } from './disconnect-handler.service';
import { ItemService } from './item.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';

describe('DisconnectHandlerService', () => {
    const sandbox = createSandbox();

    let disconnectHandlerService: DisconnectHandlerService;
    let lobbySocketHandlerMock: SinonStubbedInstance<LobbySocketHandlerService>;
    let lobbiesMock: Map<string, GameLobby>;

    beforeEach(() => {
        lobbySocketHandlerMock = {
            leaveGame: sandbox.stub(),
            leaveLobby: sandbox.stub(),
        } as unknown as SinonStubbedInstance<LobbySocketHandlerService>;

        lobbiesMock = new Map<string, GameLobby>([
            ['lobby1', { players: [{ id: 'socket1', name: 'Player1' }] } as GameLobby],
            ['lobby2', { players: [{ id: 'socket2', name: 'Player2' }] } as GameLobby],
        ]);

        const gameStatesMock = new Map<string, GameState>([
            ['lobby1', { playerPositions: [] } as GameState],
            ['lobby2', { playerPositions: [] } as GameState],
        ]);
        const itemServiceMock = sandbox.createStubInstance(ItemService);

        disconnectHandlerService = new DisconnectHandlerService(lobbiesMock, lobbySocketHandlerMock, gameStatesMock, itemServiceMock);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should call leaveGame and leaveLobby when a player is found in a lobby', () => {
        const mockSocket: Partial<Socket> = { id: 'socket1' };

        disconnectHandlerService.handleDisconnect(mockSocket as Socket);

        expect(lobbySocketHandlerMock.leaveGame.calledOnceWith(mockSocket, 'lobby1', 'Player1')).to.be.true;
        expect(lobbySocketHandlerMock.leaveLobby.calledOnceWith(mockSocket, 'lobby1', 'Player1')).to.be.true;
    });

    it('should not call leaveGame or leaveLobby if the player is not in any lobby', () => {
        const mockSocket: Partial<Socket> = { id: 'unknownSocket' };

        disconnectHandlerService.handleDisconnect(mockSocket as Socket);

        expect(lobbySocketHandlerMock.leaveGame.called).to.be.false;
        expect(lobbySocketHandlerMock.leaveLobby.called).to.be.false;
    });

    it('should handle undefined room ID gracefully', () => {
        const leaveStub = sandbox.stub();
        const mockSocket: Partial<Socket> = { id: 'socket1', leave: leaveStub };

        disconnectHandlerService.handleDisconnectFromRoom(mockSocket as Socket, undefined);

        expect(leaveStub.called).to.be.false;
    });

    it('should handle empty room ID gracefully', () => {
        const leaveStub = sandbox.stub();
        const mockSocket: Partial<Socket> = { id: 'socket1', leave: leaveStub };

        disconnectHandlerService.handleDisconnectFromRoom(mockSocket as Socket, '');

        expect(leaveStub.called).to.be.false;
    });

    it('should remove the socket from the room when the player disconnects from a room', () => {
        const leaveStub = sandbox.stub();
        const mockSocket: Partial<Socket> = { id: 'socket1', leave: leaveStub };

        disconnectHandlerService.handleDisconnectFromRoom(mockSocket as Socket, 'lobby1');

        expect(leaveStub.calledOnceWith('lobby1')).to.be.true;
    });
});
