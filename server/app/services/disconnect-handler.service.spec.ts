/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import { createSandbox, SinonStubbedInstance } from 'sinon';
import { DisconnectHandlerService } from './disconnect-handler.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { Socket } from 'socket.io';

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

        disconnectHandlerService = new DisconnectHandlerService(lobbiesMock, lobbySocketHandlerMock);
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
});
