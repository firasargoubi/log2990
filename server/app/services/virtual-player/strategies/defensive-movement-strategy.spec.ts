/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';
import { DefensiveMovementStrategy } from './defensive-movement-strategy';
import { DefaultMovementStrategy } from './default-movement-strategy';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { Coordinates } from '@common/coordinates';
import { ObjectsTypes } from '@common/game.interface';
import * as sinon from 'sinon';

describe('DefensiveMovementStrategy', () => {
    let serviceStub: sinon.SinonStubbedInstance<VirtualPlayerService>;
    let strategy: DefensiveMovementStrategy;

    beforeEach(() => {
        serviceStub = sinon.createStubInstance(VirtualPlayerService);
        strategy = new DefensiveMovementStrategy(serviceStub as unknown as VirtualPlayerService);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should target a defensive item if inventory is not full and item is reachable', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { items: [] },
            gameState: { playerPositions: [{ x: 0, y: 0 }] },
        } as unknown as VirtualMovementConfig;
        const availableMoves: Coordinates[] = [{ x: 1, y: 1 }];
        const playerIndex = 0;

        serviceStub.findNearestItemTile.returns({ x: 1, y: 1 });

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 1, y: 1 });
        expect(serviceStub.findNearestItemTile.calledWith(config.gameState, { x: 0, y: 0 }, [ObjectsTypes.POTION, ObjectsTypes.JUICE])).to.be.true;
    });

    it('should target another item type if inventory is not full and no defensive item is reachable', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { items: [] },
            gameState: { playerPositions: [{ x: 0, y: 0 }] },
        } as unknown as VirtualMovementConfig;
        const availableMoves: Coordinates[] = [{ x: 2, y: 2 }];
        const playerIndex = 0;

        serviceStub.findNearestItemTile.onFirstCall().returns(null);
        serviceStub.findNearestItemTile.onSecondCall().returns({ x: 2, y: 2 });

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 2, y: 2 });
    });

    it('should move away from the nearest opponent if no items are reachable', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { items: [] },
            gameState: { playerPositions: [{ x: 0, y: 0 }] },
        } as unknown as VirtualMovementConfig;
        const availableMoves: Coordinates[] = [
            { x: 3, y: 3 },
            { x: 4, y: 4 },
        ];
        const playerIndex = 0;

        serviceStub.findNearestItemTile.returns(null);
        serviceStub.getNearestOpponent.returns({ pos: { x: 1, y: 1 } } as any);
        serviceStub['distance'].callsFake((a: Coordinates, b: Coordinates) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y));

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 4, y: 4 });
    });

    it('should fallback to DefaultMovementStrategy if no other moves are possible', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { items: [] },
            gameState: { playerPositions: [{ x: 0, y: 0 }] },
        } as unknown as VirtualMovementConfig;
        const availableMoves: Coordinates[] = [];
        const playerIndex = 0;

        const defaultStrategyStub = sinon.stub(DefaultMovementStrategy.prototype, 'determineTarget').returns({ x: 5, y: 5 });

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 5, y: 5 });
        expect(defaultStrategyStub.calledOnce).to.be.true;
    });
});
