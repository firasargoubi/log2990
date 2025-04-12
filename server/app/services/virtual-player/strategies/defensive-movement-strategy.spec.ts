/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from 'chai';
import { DefensiveMovementStrategy } from './defensive-movement-strategy';
import { DefaultMovementStrategy } from './default-movement-strategy';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { Coordinates } from '@common/coordinates';
import { ObjectsTypes } from '@common/game.interface';
import * as sinon from 'sinon';
import { Player } from '@common/player';

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
        expect(serviceStub.findNearestItemTile.calledWith(config.gameState, { x: 0, y: 0 }, [ObjectsTypes.POTION, ObjectsTypes.JUICE])).to.equal(
            true,
        );
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
        expect(defaultStrategyStub.calledOnce).to.equal(true);
    });
    it('should return spawn point when virtual player is the flag carrier', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { id: 'vp1', items: [] } as Player,
            gameState: {
                gameMode: 'capture',
                playerPositions: [{ x: 3, y: 3 }],
                spawnPoints: [{ x: 0, y: 0 }],
                players: [{ id: 'vp1' }],
            },
        } as unknown as VirtualMovementConfig;

        const availableMoves = [{ x: 0, y: 0 }];
        const playerIndex = 0;

        serviceStub.findFlagCarrier.returns({ id: 'vp1' } as Player);
        serviceStub.getClosest.returns({ x: 0, y: 0 });

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 0, y: 0 });
    });
    it('should return opponent spawn point when flag carrier is an opponent', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { id: 'vp1', items: [] } as Player,
            gameState: {
                gameMode: 'capture',
                playerPositions: [{ x: 5, y: 5 }],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 10, y: 10 },
                ],
                players: [{ id: 'vp1' }, { id: 'op1' }],
            },
        } as unknown as VirtualMovementConfig;

        const availableMoves = [{ x: 10, y: 10 }];
        const playerIndex = 0;

        serviceStub.findFlagCarrier.returns({ id: 'op1' } as Player);
        serviceStub.isOpponent.returns(true);
        serviceStub.getClosest.returns({ x: 10, y: 10 });

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 10, y: 10 });
    });
    it('should move toward reachable opponent near teammate flag carrier', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { id: 'vp1', items: [] },
            gameState: {
                gameMode: 'capture',
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 3, y: 3 },
                ],
                spawnPoints: [{ x: 0, y: 0 }],
                players: [{ id: 'vp1' }, { id: 'tm1' }],
            },
        } as unknown as VirtualMovementConfig;

        const availableMoves = [{ x: 4, y: 4 }];
        const playerIndex = 0;

        const flagCarrier = { id: 'tm1' } as Player;
        const opponentNearCarrier = [{ pos: { x: 4, y: 4 }, player: { id: 'op1' } as Player }];

        serviceStub.findFlagCarrier.returns(flagCarrier);
        serviceStub.isTeammate.returns(true);
        serviceStub.getOpponentsNearTarget.returns(opponentNearCarrier);

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 4, y: 4 });
    });

    it('should return flag position when flag is not carried', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { id: 'vp1', items: [] },
            gameState: {
                gameMode: 'capture',
                playerPositions: [{ x: 0, y: 0 }],
                spawnPoints: [{ x: 0, y: 0 }],
            },
        } as unknown as VirtualMovementConfig;

        const availableMoves = [{ x: 7, y: 7 }];
        const playerIndex = 0;

        serviceStub.findFlagCarrier.returns(null);
        serviceStub.findFlagPosition.returns({ x: 7, y: 7 });
        serviceStub.getClosest.returns({ x: 7, y: 7 });

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 7, y: 7 });
    });
    it('should return moveTowardsOpponent when closestOpponentNearCarrier branch returns a move different from teammate position', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { id: 'vp1', items: [] },
            gameState: {
                gameMode: 'capture',
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 5, y: 5 },
                ],
                spawnPoints: [{ x: 0, y: 0 }],
                players: [{ id: 'vp1' }, { id: 'tm1' }],
            },
        } as unknown as VirtualMovementConfig;

        const availableMoves: Coordinates[] = [
            { x: 4, y: 4 },
            { x: 6, y: 6 },
        ];
        const playerIndex = 0;

        const flagCarrier = { id: 'tm1' } as Player;
        serviceStub.findFlagCarrier.returns(flagCarrier);
        serviceStub.isTeammate.returns(true);

        const opponentsNearCarrier = [{ pos: { x: 10, y: 10 }, player: { id: 'op1' } as Player }];
        serviceStub.getOpponentsNearTarget.returns(opponentsNearCarrier);

        serviceStub.getClosest
            .withArgs(
                { x: 0, y: 0 },
                opponentsNearCarrier.map((o) => o.pos),
            )
            .returns({ x: 10, y: 10 });

        serviceStub.getClosest.withArgs({ x: 10, y: 10 }, availableMoves).returns({ x: 4, y: 4 });

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 4, y: 4 });
    });

    it('should fallback to filtering moves towards carrier if moveTowardsOpponent equals teammate position', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { id: 'vp1', items: [] },
            gameState: {
                gameMode: 'capture',
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 5, y: 5 },
                ],
                spawnPoints: [{ x: 0, y: 0 }],
                players: [{ id: 'vp1' }, { id: 'tm1' }],
            },
        } as unknown as VirtualMovementConfig;

        const availableMoves: Coordinates[] = [
            { x: 5, y: 5 },
            { x: 7, y: 7 },
        ];
        const playerIndex = 0;

        const flagCarrier = { id: 'tm1' } as Player;
        serviceStub.findFlagCarrier.returns(flagCarrier);
        serviceStub.isTeammate.returns(true);

        const opponentsNearCarrier = [{ pos: { x: 10, y: 10 }, player: { id: 'op1' } as Player }];
        serviceStub.getOpponentsNearTarget.returns(opponentsNearCarrier);

        serviceStub.getClosest
            .withArgs(
                { x: 0, y: 0 },
                opponentsNearCarrier.map((o) => o.pos),
            )
            .returns({ x: 10, y: 10 });

        serviceStub.getClosest.withArgs({ x: 10, y: 10 }, availableMoves).returns({ x: 5, y: 5 });

        serviceStub.getClosest.withArgs({ x: 5, y: 5 }, [{ x: 7, y: 7 }]).returns({ x: 7, y: 7 });

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 7, y: 7 });
    });

    it('should return null in determineCaptureTarget when neither flagCarrier nor flagPos exists', () => {
        const defaultStrategyStub = sinon.stub(DefaultMovementStrategy.prototype, 'determineTarget').returns({ x: 99, y: 99 });

        const config: VirtualMovementConfig = {
            virtualPlayer: { id: 'vp1', items: [] },
            gameState: {
                gameMode: 'capture',
                playerPositions: [{ x: 0, y: 0 }],
                spawnPoints: [{ x: 10, y: 10 }],
                players: [{ id: 'vp1' }],
            },
        } as unknown as VirtualMovementConfig;

        const availableMoves: Coordinates[] = [{ x: 1, y: 1 }];
        const playerIndex = 0;

        serviceStub.findFlagCarrier.returns(null);
        serviceStub.findFlagPosition.returns(undefined);

        serviceStub.findNearestItemTile.returns(null);

        serviceStub.getNearestOpponent.returns(null);

        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 99, y: 99 });

        defaultStrategyStub.restore();
    });
    it('should return null when all available moves are closer to the opponent than current position', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { items: [] },
            gameState: {
                playerPositions: [{ x: 0, y: 0 }],
                players: [{ id: 'vp1' }, { id: 'opponent' }],
            },
        } as unknown as VirtualMovementConfig;
        const availableMoves: Coordinates[] = [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
        ];
        const playerIndex = 0;

        serviceStub.getNearestOpponent.returns({ pos: { x: 2, y: 2 }, player: { id: 'opponent' } } as any);
        serviceStub['distance'].callsFake((a: Coordinates, b: Coordinates) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y));

        const target = strategy['findMoveAwayFromOpponent'](config, availableMoves, playerIndex);

        expect(target).to.equal(null);
    });
    it('should handle undefined virtualPlayer.items as empty inventory', () => {
        const config: VirtualMovementConfig = {
            virtualPlayer: { items: undefined },
            gameState: {
                gameMode: 'defense',
                playerPositions: [{ x: 0, y: 0 }],
                items: [{ type: ObjectsTypes.POTION, position: { x: 1, y: 1 } }],
            },
        } as unknown as VirtualMovementConfig;
        const availableMoves: Coordinates[] = [{ x: 1, y: 1 }];
        const playerIndex = 0;

        serviceStub.findNearestItemTile.returns({ x: 1, y: 1 });
        const target = strategy.determineTarget(config, availableMoves, playerIndex);

        expect(target).to.deep.equal({ x: 1, y: 1 });
        expect(serviceStub.findNearestItemTile.calledWith(config.gameState, { x: 0, y: 0 }, [ObjectsTypes.POTION, ObjectsTypes.JUICE])).to.equal(
            true,
        );
    });
});
