/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';
import { EventBus } from './event-bus';
import { GameLifecycleService } from './game-life-cycle.service';
import { Socket } from 'socket.io';
import { Player } from '@common/player';
import * as sinon from 'sinon';

describe('EventBus', () => {
    let eventBus: EventBus;
    let mockGameLifecycleService: sinon.SinonStubbedInstance<GameLifecycleService>;
    let player: Player;
    let socket: Socket;

    beforeEach(() => {
        mockGameLifecycleService = sinon.createStubInstance(GameLifecycleService);
        eventBus = new EventBus(mockGameLifecycleService);
        player = { id: 'player1', name: 'Test Player' } as Player;
    });

    it('should call handlePlayersUpdate on gameLifeCycle when onPlayerUpdate is called', () => {
        const lobbyId = 'lobby1';
        eventBus.onPlayerUpdate(socket, lobbyId, player);

        expect(mockGameLifecycleService.handlePlayersUpdate.calledOnce).to.be.true;
        expect(mockGameLifecycleService.handlePlayersUpdate.calledWith(socket, lobbyId, player)).to.be.true;
    });

    it('should handle null gameLifeCycle service gracefully', () => {
        eventBus.setService(null);

        expect(() => eventBus.onPlayerUpdate(socket, 'lobby1', player)).to.throw();
    });
});
