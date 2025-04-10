/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Socket } from 'socket.io';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { ObjectsTypes, Tile, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { BoardService } from './board.service';
import { MovementStrategy } from './virtual-player/interfaces/movement-strategy';

const createMockGameState = (players: Player[], positions: Coordinates[], board?: number[][]): GameState => ({
    players,
    playerPositions: positions,
    board: board || [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ],
    currentPlayer: players[0]?.id || 'player1',
    currentPlayerActionPoints: 2,
    debug: false,
    gameMode: 'classic',
    animation: false,
    spawnPoints: positions,
    availableMoves: [],
    shortestMoves: [],
    teams: undefined,
    deletedPlayers: [],
    id: '',
    turnCounter: 0,
    currentPlayerMovementPoints: 0,
});

const createMockPlayer = (id: string, name: string, virtual = false, profile = 'default'): Player => ({
    id,
    name,
    avatar: 'avatar.png',
    isHost: false,
    life: 10,
    maxLife: 10,
    speed: 5,
    attack: 3,
    defense: 2,
    items: [],
    pendingItem: 0,
    currentAP: 2,
    currentMP: 5,
    winCount: 0,
    amountEscape: 0,
    bonus: { attack: 'D6', defense: 'D4' },
    virtualPlayerData: virtual ? { profile: profile as 'aggressive' | 'defensive' } : undefined,
});

describe('VirtualPlayerService', () => {
    let sandbox: sinon.SinonSandbox;
    let service: VirtualPlayerService;
    let mockBoardService: sinon.SinonStubbedInstance<BoardService>;
    let mockAggressiveStrategy: sinon.SinonStubbedInstance<MovementStrategy>;
    let mockDefaultStrategy: sinon.SinonStubbedInstance<MovementStrategy>;
    let mockDefensiveStrategy: sinon.SinonStubbedInstance<MovementStrategy>;
    let mockCallbacks: sinon.SinonStubbedInstance<VirtualMovementConfig['callbacks']>;
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        clock = sandbox.useFakeTimers();

        mockAggressiveStrategy = { determineTarget: sandbox.stub() };
        mockDefaultStrategy = { determineTarget: sandbox.stub() };
        mockDefensiveStrategy = { determineTarget: sandbox.stub() };

        service = new VirtualPlayerService();
        (service as any).aggressiveMovementStrategy = mockAggressiveStrategy;
        (service as any).defaultMovementStrategy = mockDefaultStrategy;
        (service as any).defensiveMovementStrategy = mockDefensiveStrategy;

        mockBoardService = sandbox.createStubInstance(BoardService);
        mockCallbacks = {
            handleRequestMovement: sandbox.stub<[Socket, string, Coordinates[]], Promise<void>>().resolves(),
            handleEndTurn: sandbox.stub<[Socket, string], void>(),
            startBattle: sandbox.stub<[string, Player, Player], void>(),
            delay: sandbox.stub<[number], Promise<void>>().resolves(),
            handleOpenDoor: sandbox.stub<[Socket, Tile, string], Promise<void>>().resolves(),
        };
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    const createMockConfig = (gameState: GameState, virtualPlayer: Player, getGameStateStub?: sinon.SinonStub): VirtualMovementConfig => ({
        lobbyId: 'lobby1',
        virtualPlayer,
        getGameState: getGameStateStub || sandbox.stub().returns(gameState),
        boardService: mockBoardService as unknown as BoardService,
        callbacks: mockCallbacks,
        gameState,
    });

    describe('handleVirtualMovement', () => {
        it('should end turn if prepareTurn returns null', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const config = createMockConfig(gameState, player);
            const prepareTurnStub = sandbox.stub(service as any, 'prepareTurn').resolves(null);

            await service.handleVirtualMovement(config);

            sinon.assert.calledOnce(prepareTurnStub);
            sinon.assert.calledOnce(mockCallbacks.handleEndTurn);
            sinon.assert.calledWith(mockCallbacks.handleEndTurn, { id: player.id } as Socket, config.lobbyId);
        });

        it('should end turn if planMovement returns null', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const config = createMockConfig(gameState, player);
            const prepareTurnStub = sandbox.stub(service as any, 'prepareTurn').resolves({ currentGameState: gameState, playerIndex: 0 });
            const planMovementStub = sandbox.stub(service as any, 'planMovement').returns(null);

            await service.handleVirtualMovement(config);

            sinon.assert.calledOnce(prepareTurnStub);
            sinon.assert.calledOnce(planMovementStub);
            sinon.assert.calledOnce(mockCallbacks.handleEndTurn);
            sinon.assert.calledWith(mockCallbacks.handleEndTurn, { id: player.id } as Socket, config.lobbyId);
        });

        it('should execute movement sequence and complete turn on success', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const target: Coordinates = { x: 1, y: 1 };
            const config = createMockConfig(gameState, player);
            const prepareTurnStub = sandbox.stub(service as any, 'prepareTurn').resolves({ currentGameState: gameState, playerIndex: 0 });
            const planMovementStub = sandbox.stub(service as any, 'planMovement').returns({ target });
            const executeMovementStub = sandbox.stub(service as any, 'executeMovementSequence').resolves();
            const completeTurnStub = sandbox.stub(service as any, 'completeTurn').resolves();

            await service.handleVirtualMovement(config);

            sinon.assert.calledOnce(prepareTurnStub);
            sinon.assert.calledOnce(planMovementStub);
            sinon.assert.calledOnceWithExactly(executeMovementStub, sinon.match.object, target, 0);
            sinon.assert.calledOnceWithExactly(completeTurnStub, sinon.match.object, 0);
            sinon.assert.notCalled(mockCallbacks.handleEndTurn);
        });
    });

    describe('performTurn', () => {
        it('should call the action callback after a delay', async () => {
            const actionCallback = sandbox.stub();
            const promise = service.performTurn(actionCallback);
            sinon.assert.notCalled(actionCallback);
            await clock.runAllAsync();
            sinon.assert.calledOnce(actionCallback);
            await promise;
        });
    });

    describe('getNearestOpponent', () => {
        it('should return null if no opponents', () => {
            const vp = createMockPlayer('vp1', 'VP');
            const gameState = createMockGameState([vp], [{ x: 0, y: 0 }]);
            const result = service.getNearestOpponent(gameState, vp, { x: 0, y: 0 });
            expect(result).to.equal(null);
        });

        it('should return the only opponent if only one exists', () => {
            const vp = createMockPlayer('vp1', 'VP');
            const opp = createMockPlayer('opp1', 'Opponent');
            const gameState = createMockGameState(
                [vp, opp],
                [
                    { x: 0, y: 0 },
                    { x: 2, y: 2 },
                ],
            );
            sandbox.stub(service, 'getAdjacentPositions').returns([]);
            const result = service.getNearestOpponent(gameState, vp, { x: 0, y: 0 });
            expect(result?.player.id).to.equal(opp.id);
            expect(result?.pos).to.deep.equal({ x: 2, y: 2 });
        });

        it('should return the nearest opponent among multiple', () => {
            const vp = createMockPlayer('vp1', 'VP');
            const opp1 = createMockPlayer('opp1', 'Opponent1');
            const opp2 = createMockPlayer('opp2', 'Opponent2');
            const gameState = createMockGameState(
                [vp, opp1, opp2],
                [
                    { x: 0, y: 0 },
                    { x: 5, y: 5 },
                    { x: 1, y: 1 },
                ],
            );
            sandbox.stub(service, 'getAdjacentPositions').returns([]);
            const result = service.getNearestOpponent(gameState, vp, { x: 0, y: 0 });
            expect(result?.player.id).to.equal(opp2.id);
            expect(result?.pos).to.deep.equal({ x: 1, y: 1 });
        });

        it('should return the closest adjacent position to the nearest opponent if adjacents exist', () => {
            const vp = createMockPlayer('vp1', 'VP');
            const opp = createMockPlayer('opp1', 'Opponent');
            const oppPos = { x: 3, y: 3 };
            const vpPos = { x: 0, y: 0 };
            const gameState = createMockGameState([vp, opp], [vpPos, oppPos]);
            const adjacents: Coordinates[] = [
                { x: 2, y: 3 },
                { x: 3, y: 2 },
                { x: 4, y: 3 },
                { x: 3, y: 4 },
            ];
            sandbox.stub(service, 'getAdjacentPositions').returns(adjacents);
            const result = service.getNearestOpponent(gameState, vp, vpPos);
            expect(result?.player.id).to.equal(opp.id);
            expect(result?.pos).to.deep.equal({ x: 2, y: 3 });
        });
    });

    describe('getClosest', () => {
        it('should return the closest position', () => {
            const target: Coordinates = { x: 0, y: 0 };
            const positions: Coordinates[] = [
                { x: 5, y: 5 },
                { x: 1, y: 1 },
                { x: 3, y: 3 },
            ];
            const result = service.getClosest(target, positions);
            expect(result).to.deep.equal({ x: 1, y: 1 });
        });

        it('should throw error if positions array is empty', () => {
            const target: Coordinates = { x: 0, y: 0 };
            expect(() => service.getClosest(target, [])).to.throw('Cannot find closest position from an empty list.');
        });

        it('should throw error if positions array is null', () => {
            const target: Coordinates = { x: 0, y: 0 };
            expect(() => service.getClosest(target, null as any)).to.throw('Cannot find closest position from an empty list.');
        });
    });

    describe('findNearestItemTile', () => {
        it('should return null if no items of specified types are found', () => {
            const vp = createMockPlayer('vp1', 'VP');
            const gameState = createMockGameState(
                [vp],
                [{ x: 0, y: 0 }],
                [
                    [0, 0],
                    [0, 0],
                ],
            );
            const result = service.findNearestItemTile(gameState, { x: 0, y: 0 }, [ObjectsTypes.SWORD]);
            expect(result).to.equal(null);
        });

        it('should return the position of the nearest item', () => {
            const vp = createMockPlayer('vp1', 'VP');
            const board = [
                [0, ObjectsTypes.SWORD * TILE_DELIMITER],
                [0, 0],
                [ObjectsTypes.BOOTS * TILE_DELIMITER, 0],
            ];
            const gameState = createMockGameState([vp], [{ x: 0, y: 0 }], board);
            const result = service.findNearestItemTile(gameState, { x: 0, y: 0 }, [ObjectsTypes.SWORD, ObjectsTypes.BOOTS]);
            expect(result).to.deep.equal({ x: 0, y: 1 });
        });
    });

    describe('getAdjacentPositions', () => {
        const board = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ];

        it('should return 4 adjacent positions for a center tile', () => {
            const pos: Coordinates = { x: 1, y: 1 };
            const result = service.getAdjacentPositions(pos, board);
            expect(result).to.have.deep.members([
                { x: 0, y: 1 },
                { x: 2, y: 1 },
                { x: 1, y: 0 },
                { x: 1, y: 2 },
            ]);
            expect(result.length).to.equal(4);
        });

        it('should return 2 adjacent positions for a corner tile', () => {
            const pos: Coordinates = { x: 0, y: 0 };
            const result = service.getAdjacentPositions(pos, board);
            expect(result).to.have.deep.members([
                { x: 1, y: 0 },
                { x: 0, y: 1 },
            ]);
            expect(result.length).to.equal(2);
        });

        it('should return 3 adjacent positions for an edge tile', () => {
            const pos: Coordinates = { x: 0, y: 1 };
            const result = service.getAdjacentPositions(pos, board);
            expect(result).to.have.deep.members([
                { x: 1, y: 1 },
                { x: 0, y: 0 },
                { x: 0, y: 2 },
            ]);
            expect(result.length).to.equal(3);
        });
    });

    describe('Private Methods (Tested Indirectly or via spies)', () => {
        it('should return original state when no doors found', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const config = createMockConfig(gameState, player);

            const result = await (service as any).checkAndHandleAdjacentDoors(config, { x: 0, y: 0 }, gameState);

            expect(result).to.equal(gameState);
        });
        it('getMovementStrategy should return correct strategy based on profile', () => {
            const aggressivePlayer = createMockPlayer('vp1', 'Aggro', true, 'aggressive');
            const defensivePlayer = createMockPlayer('vp2', 'Def', true, 'defensive');
            const defaultPlayer = createMockPlayer('vp3', 'Norm', true, 'default');
            const unknownPlayer = createMockPlayer('vp4', 'Unk', true, 'unknown');

            expect((service as any).getMovementStrategy(aggressivePlayer)).to.equal(mockAggressiveStrategy);
            expect((service as any).getMovementStrategy(defensivePlayer)).to.equal(mockDefensiveStrategy);
            expect((service as any).getMovementStrategy(defaultPlayer)).to.equal(mockDefaultStrategy);
            expect((service as any).getMovementStrategy(unknownPlayer)).to.equal(mockDefaultStrategy);
        });

        it('planMovement should use the correct strategy and filter moves if inventory is full', () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            player.items = [ObjectsTypes.SWORD, ObjectsTypes.BOOTS];
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const availableMoves: Coordinates[] = [
                { x: 1, y: 0 },
                { x: 0, y: 1 },
            ];
            const target: Coordinates = { x: 1, y: 0 };

            mockBoardService.findAllPaths.returns(availableMoves);
            mockDefaultStrategy.determineTarget.returns(target);

            const config = createMockConfig(gameState, player);
            const result = (service as any).planMovement(config, 0);

            expect(result).to.deep.equal({ target });
            sinon.assert.calledOnce(mockBoardService.findAllPaths);
            sinon.assert.calledWith(mockDefaultStrategy.determineTarget, sinon.match.object, sinon.match.array, 0);
        });

        it('executeMovementSequence should find shortest path and call followPath', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const target: Coordinates = { x: 1, y: 1 };
            const path: Coordinates[] = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
            ];
            const config = createMockConfig(gameState, player);
            mockBoardService.findShortestPath.returns(path);
            const followPathStub = sandbox.stub(service as any, 'followPath').resolves();

            await (service as any).executeMovementSequence(config, target, 0);

            sinon.assert.calledOnce(mockBoardService.findShortestPath);
            sinon.assert.calledOnceWithExactly(followPathStub, path, config);
        });

        it('executeMovementSequence should return if no path or fallback path found', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const target: Coordinates = { x: 1, y: 1 };

            mockBoardService.findShortestPath.returns(null);
            mockBoardService.findAllPaths.returns([]);
            const followPathStub = sandbox.stub(service as any, 'followPath').resolves();

            const config = createMockConfig(gameState, player);
            await (service as any).executeMovementSequence(config, target, 0);

            sinon.assert.calledOnce(mockBoardService.findShortestPath);
            sinon.assert.calledOnce(mockBoardService.findAllPaths);
            sinon.assert.notCalled(followPathStub);
        });

        it('should use fallback target when initial path fails', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const target = { x: 2, y: 2 };
            const fallbackTarget = { x: 1, y: 1 };
            const fallbackPath = [{ x: 0, y: 0 }, fallbackTarget];

            mockBoardService.findShortestPath.onFirstCall().returns(null).onSecondCall().returns(fallbackPath);
            mockBoardService.findAllPaths.returns([fallbackTarget]);

            const config = createMockConfig(gameState, player);
            const getClosestStub = sandbox.stub(service, 'getClosest').returns(fallbackTarget);

            await (service as any).executeMovementSequence(config, target, 0);

            sinon.assert.calledWith(getClosestStub, target, [fallbackTarget]);
            sinon.assert.calledWith(mockBoardService.findShortestPath, gameState, gameState.playerPositions[0], fallbackTarget);
        });

        it('followPath should call handleRequestMovement', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const path: Coordinates[] = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            ];
            const config = createMockConfig(gameState, player);

            await (service as any).followPath(path, config);

            sinon.assert.calledOnceWithExactly(mockCallbacks.handleRequestMovement, { id: player.id } as Socket, config.lobbyId, path);
        });

        it('followPath should call handleOpenDoor if path includes closed door and player has AP', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            player.currentAP = 1;
            const doorPos = { x: 1, y: 0 };
            const board = [
                [0, 0],
                [TileTypes.DoorClosed, 0],
            ];
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }], board);
            const path: Coordinates[] = [{ x: 0, y: 0 }, doorPos];
            const getGameStateStub = sandbox.stub().returns(gameState);
            const config = createMockConfig(gameState, player, getGameStateStub);

            await (service as any).followPath(path, config);

            sinon.assert.calledOnce(mockCallbacks.handleOpenDoor);
            sinon.assert.calledWith(
                mockCallbacks.handleOpenDoor,
                { id: player.id } as Socket,
                sinon.match({ x: doorPos.x, y: doorPos.y }),
                config.lobbyId,
            );
            sinon.assert.calledOnce(mockCallbacks.delay);
            sinon.assert.calledTwice(getGameStateStub);
            sinon.assert.calledOnce(mockCallbacks.handleRequestMovement);
        });

        it('handlePostMovement should start battle if adjacent opponent found', async () => {
            const vp = createMockPlayer('vp1', 'VP', true);
            const opp = createMockPlayer('opp1', 'Opponent');
            const vpPos = { x: 1, y: 1 };
            const oppPos = { x: 1, y: 2 };
            const gameState = createMockGameState([vp, opp], [vpPos, oppPos]);
            const config = createMockConfig(gameState, vp);

            await (service as any).handlePostMovement(config, 0);

            sinon.assert.calledOnce(mockCallbacks.startBattle);
            sinon.assert.calledWith(mockCallbacks.startBattle, config.lobbyId, vp, opp);
            sinon.assert.notCalled(mockCallbacks.handleEndTurn);
        });

        it('handlePostMovement should call handleVirtualMovement again if can open door', async () => {
            const vp = createMockPlayer('vp1', 'VP', true);
            vp.currentAP = 1;
            const vpPos = { x: 0, y: 0 };
            const board = [
                [0, TileTypes.DoorClosed],
                [0, 0],
            ];
            const gameState = createMockGameState([vp], [vpPos], board);
            mockBoardService.findAllPaths.returns([]);
            const config = createMockConfig(gameState, vp);
            const handleVirtualMovementStub = sandbox.stub(service, 'handleVirtualMovement').resolves();
            const performTurnStub = sandbox.stub(service, 'performTurn').callsArg(0);

            await (service as any).handlePostMovement(config, 0);

            sinon.assert.calledOnce(performTurnStub);
            sinon.assert.calledOnce(handleVirtualMovementStub);
            sinon.assert.notCalled(mockCallbacks.handleEndTurn);
        });

        it('handlePostMovement should call handleVirtualMovement again if can move further', async () => {
            const vp = createMockPlayer('vp1', 'VP', true);
            vp.currentMP = 1;
            const vpPos = { x: 0, y: 0 };
            const gameState = createMockGameState([vp], [vpPos]);
            mockBoardService.findAllPaths.returns([{ x: 1, y: 0 }]);
            const config = createMockConfig(gameState, vp);
            const handleVirtualMovementStub = sandbox.stub(service, 'handleVirtualMovement').resolves();
            const performTurnStub = sandbox.stub(service, 'performTurn').callsArg(0);

            await (service as any).handlePostMovement(config, 0);

            sinon.assert.calledOnce(performTurnStub);
            sinon.assert.calledOnce(handleVirtualMovementStub);
            sinon.assert.notCalled(mockCallbacks.handleEndTurn);
        });

        it('handlePostMovement should end turn if no further actions possible', async () => {
            const vp = createMockPlayer('vp1', 'VP', true);
            vp.currentAP = 0;
            vp.currentMP = 0;
            const vpPos = { x: 0, y: 0 };
            const gameState = createMockGameState([vp], [vpPos]);
            mockBoardService.findAllPaths.returns([]);
            const config = createMockConfig(gameState, vp);
            const handleVirtualMovementStub = sandbox.stub(service, 'handleVirtualMovement').resolves();
            const performTurnStub = sandbox.stub(service, 'performTurn');

            await (service as any).handlePostMovement(config, 0);

            sinon.assert.notCalled(performTurnStub);
            sinon.assert.notCalled(handleVirtualMovementStub);
            sinon.assert.calledOnce(mockCallbacks.handleEndTurn);
        });

        it('checkAndHandleAdjacentDoors should call handleDoor if adjacent closed door found and player has AP', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            player.currentAP = 1;
            const currentPos = { x: 0, y: 0 };
            const doorPos = { x: 0, y: 1 };
            const board = [
                [0, TileTypes.DoorClosed],
                [0, 0],
            ];
            const gameState = createMockGameState([player], [currentPos], board);
            const getGameStateStub = sandbox.stub().returns(gameState);
            const config = createMockConfig(gameState, player, getGameStateStub);
            const handleDoorStub = sandbox.stub(service as any, 'handleDoor').resolves();

            await (service as any).checkAndHandleAdjacentDoors(config, currentPos, gameState);

            sinon.assert.calledOnce(handleDoorStub);
            sinon.assert.calledWith(handleDoorStub, config, doorPos);
            sinon.assert.calledOnce(mockCallbacks.delay);
            sinon.assert.calledOnce(getGameStateStub);
        });

        it('checkAndHandleAdjacentDoors should not call handleDoor if no AP', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            player.currentAP = 0;
            const currentPos = { x: 0, y: 0 };
            const board = [
                [0, TileTypes.DoorClosed],
                [0, 0],
            ];
            const gameState = createMockGameState([player], [currentPos], board);
            const config = createMockConfig(gameState, player);
            const handleDoorStub = sandbox.stub(service as any, 'handleDoor').resolves();

            const resultState = await (service as any).checkAndHandleAdjacentDoors(config, currentPos, gameState);

            sinon.assert.notCalled(handleDoorStub);
            expect(resultState).to.equal(gameState);
        });

        it('handleDoor should call handleOpenDoor callback if player has AP', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            player.currentAP = 1;
            const doorPos = { x: 1, y: 1 };
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const config = createMockConfig(gameState, player);

            await (service as any).handleDoor(config, doorPos);

            sinon.assert.calledOnce(mockCallbacks.handleOpenDoor);
            sinon.assert.calledWith(
                mockCallbacks.handleOpenDoor,
                { id: player.id } as Socket,
                sinon.match({ x: doorPos.x, y: doorPos.y }),
                config.lobbyId,
            );
        });

        it('handleDoor should not call handleOpenDoor callback if player has no AP', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            player.currentAP = 0;
            const doorPos = { x: 1, y: 1 };
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const config = createMockConfig(gameState, player);

            await (service as any).handleDoor(config, doorPos);

            sinon.assert.notCalled(mockCallbacks.handleOpenDoor);
        });
        it('should return null when getGameState returns null', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const getGameStateStub = sandbox.stub().returns(null);
            const config = createMockConfig({} as GameState, player, getGameStateStub);

            const result = await (service as any).prepareTurn(config);

            expect(result).to.equal(null);
        });

        it('should return null when virtual player not found in game state', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([], []);
            const config = createMockConfig(gameState, player);

            const result = await (service as any).prepareTurn(config);

            expect(result).to.equal(null);
        });

        it('should handle adjacent doors when AP > 0 and return updated state', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const initialGameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const updatedGameState = createMockGameState([player], [{ x: 0, y: 0 }]);

            const checkAndHandleStub = sandbox.stub(service as any, 'checkAndHandleAdjacentDoors').resolves(updatedGameState);

            const config = createMockConfig(initialGameState, player);

            const result = await (service as any).prepareTurn(config);

            expect(result).to.deep.equal({
                currentGameState: updatedGameState,
                playerIndex: 0,
            });
            sinon.assert.calledOnce(checkAndHandleStub);
        });

        it('should return null if player removed after door handling', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const initialGameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const updatedGameState = createMockGameState([], []);

            sandbox.stub(service as any, 'checkAndHandleAdjacentDoors').resolves(updatedGameState);

            const config = createMockConfig(initialGameState, player);

            const result = await (service as any).prepareTurn(config);

            expect(result).to.equal(null);
        });

        it('should return original state when AP <= 0', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            player.currentAP = 0;
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);

            const config = createMockConfig(gameState, player);

            const result = await (service as any).prepareTurn(config);

            expect(result).to.deep.equal({
                currentGameState: gameState,
                playerIndex: 0,
            });
        });
        it('should return null when no available moves exist', () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            mockBoardService.findAllPaths.returns([]);
            const config = createMockConfig(gameState, player);

            const result = (service as any).planMovement(config, 0);

            expect(result).to.equal(null);
        });

        it('should return null when inventory full and no valid moves', () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            player.items = [ObjectsTypes.SWORD, ObjectsTypes.BOOTS];
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            mockBoardService.findAllPaths.returns([{ x: 1, y: 0 }]);
            const config = createMockConfig(gameState, player);

            sandbox.stub(gameState.board[1], 0).value(ObjectsTypes.SWORD * TILE_DELIMITER);

            const result = (service as any).planMovement(config, 0);
            expect(result).to.equal(null);
        });
        it('should call handlePostMovement with final state', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const gameState = createMockGameState([player], [{ x: 0, y: 0 }]);
            const config = createMockConfig(gameState, player);
            const handlePostStub = sandbox.stub(service as any, 'handlePostMovement').resolves();

            await (service as any).completeTurn(config, 0);

            sinon.assert.calledWith(handlePostStub, sinon.match({ gameState }), 0);
        });
        it('should call handleEndTurn when finalState is null', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);
            const config = {
                lobbyId: 'lobby1',
                virtualPlayer: player,
                getGameState: sandbox.stub().returns(null),
                boardService: mockBoardService,
                callbacks: mockCallbacks,
                gameState: {} as GameState,
            };

            await (service as any).completeTurn(config, 0);

            sinon.assert.calledOnce(mockCallbacks.handleEndTurn);
        });
        it('should break loop and return original state when newGameState is null after door handling', async () => {
            const player = createMockPlayer('vp1', 'Virtual', true);

            const config: VirtualMovementConfig = {
                lobbyId: 'lobby1',
                virtualPlayer: player,
                getGameState: sandbox.stub().returns(null),
                boardService: mockBoardService as unknown as BoardService,
                callbacks: {
                    handleRequestMovement: mockCallbacks.handleRequestMovement,
                    handleEndTurn: mockCallbacks.handleEndTurn,
                    startBattle: mockCallbacks.startBattle,
                    delay: sandbox.stub<[number], Promise<void>>().resolves(),
                    handleOpenDoor: mockCallbacks.handleOpenDoor,
                },
                gameState: createMockGameState(
                    [player],
                    [{ x: 0, y: 0 }],
                    [
                        [TileTypes.Floor, TileTypes.DoorClosed],
                        [TileTypes.DoorClosed, TileTypes.Floor],
                    ],
                ),
            };

            const handleDoorStub = sandbox.stub(service as any, 'handleDoor').resolves();

            const result = await (service as any).checkAndHandleAdjacentDoors(config, { x: 0, y: 0 }, config.gameState);

            sinon.assert.calledOnce((config.callbacks.delay as sinon.SinonStub).withArgs(500));
            sinon.assert.calledOnce(handleDoorStub);
            sinon.assert.calledOnce(config.getGameState as sinon.SinonStub);

            expect(result).to.equal(config.gameState);
            sinon.assert.callCount(handleDoorStub, 1);
        });
    });
});
