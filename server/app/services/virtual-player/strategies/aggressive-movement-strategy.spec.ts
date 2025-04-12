/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { ObjectsTypes } from '@common/game.interface';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { AggressiveMovementStrategy } from './aggressive-movement-strategy';
import { DefaultMovementStrategy } from './default-movement-strategy';
import { Player } from '@common/player';
import { GameState } from '@common/game-state';

describe('AggressiveMovementStrategy', () => {
    let strategy: AggressiveMovementStrategy;
    let mockService: sinon.SinonStubbedInstance<VirtualPlayerService>;
    let config: VirtualMovementConfig;
    const playerIndex = 0;

    beforeEach(() => {
        mockService = sinon.createStubInstance(VirtualPlayerService);
        strategy = new AggressiveMovementStrategy(mockService as unknown as VirtualPlayerService);

        config = {
            gameState: {
                board: [],
                playerPositions: [{ x: 0, y: 0 }],
                teams: {
                    team1: [],
                    team2: [],
                },
                players: [],
                id: '',
                turnCounter: 0,
                currentPlayer: '',
                availableMoves: [],
                shortestMoves: [],
                spawnPoints: [],
                currentPlayerMovementPoints: 0,
                currentPlayerActionPoints: 0,
                debug: false,
                gameMode: '',
            },
            virtualPlayer: {
                items: [] as any[],
                name: 'TestBot',
                pendingItem: 0,
                id: '',
                avatar: '',
                isHost: false,
                life: 0,
                maxLife: 0,
                speed: 0,
                attack: 0,
                defense: 0,
                winCount: 0,
            },
            lobbyId: 'test-lobby',
            getGameState: () => config.gameState,
            boardService: {} as any,
            callbacks: {} as any,
        };
    });

    describe('determineTarget', () => {
        it('should prioritize attacking reachable opponents', () => {
            const availableMoves = [
                { x: 1, y: 0 },
                { x: 0, y: 1 },
            ];
            const opponentPos = { x: 1, y: 0 };

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: {
                    items: [] as any,
                    name: 'Opponent',
                    pendingItem: 0,
                    id: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            });

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(opponentPos);
        });

        it('should move adjacent to opponent if not directly reachable', () => {
            const availableMoves = [
                { x: 1, y: 1 },
                { x: 2, y: 0 },
            ];
            const opponentPos = { x: 2, y: 1 };
            const adjacentPos = { x: 2, y: 0 };

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: {
                    items: [] as any[],
                    name: 'Opponent',
                    pendingItem: 0,
                    id: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            });
            mockService.getAdjacentPositions.returns([
                { x: 1, y: 1 },
                { x: 2, y: 0 },
                { x: 3, y: 1 },
            ]);
            mockService.getClosest.withArgs(opponentPos, availableMoves).returns(adjacentPos);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(adjacentPos);
        });

        it('should collect desired items when inventory is not full', () => {
            config.virtualPlayer.items = [];
            const availableMoves = [{ x: 3, y: 3 }];
            const itemPos = { x: 3, y: 3 };

            mockService.getNearestOpponent.returns(null);
            mockService.findNearestItemTile
                .withArgs(config.gameState, config.gameState.playerPositions[playerIndex], [
                    ObjectsTypes.SWORD,
                    ObjectsTypes.BOOTS,
                    ObjectsTypes.CRYSTAL,
                ])
                .returns(itemPos);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(itemPos);
        });

        it('should collect other items when desired items are not available', () => {
            config.virtualPlayer.items = [];
            const availableMoves = [{ x: 4, y: 4 }];
            const itemPos = { x: 4, y: 4 };

            mockService.getNearestOpponent.returns(null);
            mockService.findNearestItemTile
                .withArgs(config.gameState, config.gameState.playerPositions[playerIndex], [
                    ObjectsTypes.SWORD,
                    ObjectsTypes.BOOTS,
                    ObjectsTypes.CRYSTAL,
                ])
                .returns(null);
            mockService.findNearestItemTile.withArgs(config.gameState, config.gameState.playerPositions[playerIndex]).returns(itemPos);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(itemPos);
        });

        it('should fall back to default strategy when no targets are available', () => {
            const availableMoves = [
                { x: 1, y: 0 },
                { x: 0, y: 1 },
            ];
            const defaultMove = { x: 0, y: 1 };

            mockService.getNearestOpponent.returns(null);
            mockService.findNearestItemTile.returns(null);

            const originalDefaultStrategy = DefaultMovementStrategy.prototype.determineTarget;
            DefaultMovementStrategy.prototype.determineTarget = () => defaultMove;

            const result = strategy.determineTarget(config, availableMoves, playerIndex);

            expect(result).to.deep.equal(defaultMove);

            DefaultMovementStrategy.prototype.determineTarget = originalDefaultStrategy;
        });
        it('should not collect items when inventory is full', () => {
            const availableMoves = [{ x: 3, y: 3 }];
            const opponentPos = { x: 5, y: 5 };
            const closestMove = { x: 3, y: 3 };

            config = {
                virtualPlayer: {
                    id: 'vp1',
                    name: 'AggroBot',
                    items: [ObjectsTypes.SWORD, ObjectsTypes.BOOTS],
                    pendingItem: 0,
                    avatar: '',
                    isHost: false,
                    life: 100,
                    maxLife: 100,
                    speed: 10,
                    attack: 15,
                    defense: 5,
                    winCount: 0,
                },
                gameState: {
                    board: [
                        [0, 0],
                        [0, 0],
                    ],
                    playerPositions: [{ x: 0, y: 0 }],
                    players: [],
                    currentPlayer: 'vp1',
                    id: 'game-id',
                    turnCounter: 0,
                    availableMoves: [],
                    shortestMoves: [],
                    spawnPoints: [],
                    currentPlayerMovementPoints: 0,
                    currentPlayerActionPoints: 0,
                    debug: false,
                    gameMode: 'default',
                    teams: {
                        team1: [],
                        team2: [],
                    },
                },
                lobbyId: 'test-lobby',
                getGameState: () => config.gameState,
                boardService: {} as any,
                callbacks: {} as any,
            };

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: {
                    items: [],
                    name: 'Opponent',
                    pendingItem: 0,
                    id: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            });

            mockService.getAdjacentPositions.returns([]);
            mockService.getClosest.withArgs(opponentPos, availableMoves).returns(closestMove);

            const result = strategy.determineTarget(config, availableMoves, 0);

            expect(result).to.deep.equal(closestMove);
        });
        it('should treat undefined items as inventory not full and then collect desired items', () => {
            config.virtualPlayer.items = undefined;

            const availableMoves = [{ x: 7, y: 7 }];
            const desiredItemPos = { x: 7, y: 7 };

            mockService.getNearestOpponent.returns(null);

            mockService.findNearestItemTile
                .withArgs(config.gameState, config.gameState.playerPositions[playerIndex], [
                    ObjectsTypes.SWORD,
                    ObjectsTypes.BOOTS,
                    ObjectsTypes.CRYSTAL,
                ])
                .returns(desiredItemPos);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(desiredItemPos);
        });
    });
    describe('determineTarget (Capture Mode)', () => {
        beforeEach(() => {
            config.gameState.gameMode = 'capture';
            config.gameState.spawnPoints = [
                { x: 0, y: 0 },
                { x: 9, y: 9 },
            ];

            config.gameState.teams = {
                team1: [{ id: 'vp1' } as Player, { id: 'teammate' } as Player],
                team2: [{ id: 'opponent' } as Player],
            };
        });

        it('should return spawn point when virtual player is flag carrier', () => {
            config.virtualPlayer.id = 'vp1';
            const spawnPoint = config.gameState.spawnPoints[playerIndex];
            const availableMoves = [spawnPoint, { x: 1, y: 1 }];

            mockService.isOpponent = sinon.stub<[Player, Player, GameState], boolean>().returns(false);
            mockService.isTeammate = sinon.stub<[Player, Player, GameState], boolean>().returns(true);

            mockService.findFlagPosition.returns(null);
            mockService.findFlagCarrier.returns({ id: 'vp1' } as Player);
            mockService.getClosest.withArgs(spawnPoint, availableMoves).returns(spawnPoint);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(spawnPoint);
        });

        it('should chase opponent flag carrier', () => {
            const opponentPos = { x: 5, y: 5 };
            const availableMoves = [opponentPos, { x: 4, y: 5 }];

            const opponentPlayer = { id: 'opponent' } as Player;
            config.gameState.players = [config.virtualPlayer, opponentPlayer];
            config.gameState.playerPositions = [{ x: 0, y: 0 }, opponentPos];

            mockService.findFlagCarrier.returns(opponentPlayer);
            mockService.isOpponent = sinon.stub<[Player, Player, GameState], boolean>().returns(true);
            mockService.getClosest.withArgs(opponentPos, availableMoves).returns(opponentPos);

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: opponentPlayer,
            });

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(opponentPos);
        });
        it('should defend teammate flag carrier by targeting nearest opponent', () => {
            const opponentPos = { x: 5, y: 5 };
            const availableMoves = [{ x: 5, y: 5 }];

            mockService.findFlagCarrier.returns({ id: 'teammate' } as Player);
            mockService.isTeammate = sinon.stub<[Player, Player, GameState], boolean>().returns(true);
            mockService.getNearestOpponent.returns({ pos: opponentPos, player: {} as Player });
            mockService.getClosest.withArgs(opponentPos, availableMoves).returns(opponentPos);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(opponentPos);
        });
    });
    describe('determineCaptureTarget flag position handling', () => {
        beforeEach(() => {
            config.gameState.gameMode = 'capture';
            config.virtualPlayer.id = 'vp1';
        });

        it('should move to closest available position when flag is on ground', () => {
            const flagPos = { x: 3, y: 3 };
            const availableMoves = [
                { x: 2, y: 3 },
                { x: 3, y: 2 },
                { x: 4, y: 3 },
            ];
            const expectedMove = { x: 2, y: 3 };

            mockService.findFlagCarrier.returns(null);
            mockService.findFlagPosition.returns(flagPos);
            mockService.getClosest.withArgs(flagPos, availableMoves).returns(expectedMove);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(expectedMove);
        });

        it('should return null when no flag position exists', () => {
            const availableMoves = [{ x: 1, y: 1 }];

            mockService.findFlagCarrier.returns(null);
            mockService.findFlagPosition.returns(null);

            const defaultMove = { x: 1, y: 1 };
            const stub = sinon.stub(DefaultMovementStrategy.prototype, 'determineTarget').returns(defaultMove);

            const result = strategy.determineTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(defaultMove);
            stub.restore();
        });
    });
    describe('findReachableOpponentTarget', () => {
        it('should return null when no opponents are available', () => {
            mockService.getNearestOpponent.returns(null);
            const result = (strategy as any).findReachableOpponentTarget(config, [], playerIndex);
            return expect(result).to.be.null;
        });

        it('should return opponent position when directly reachable', () => {
            const availableMoves = [{ x: 1, y: 0 }];
            const opponentPos = { x: 1, y: 0 };

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: {
                    items: [],
                    name: 'Opponent',
                    pendingItem: 0,
                    id: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            });

            const result = (strategy as any).findReachableOpponentTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(opponentPos);
        });

        it('should return closest adjacent position when opponent is not directly reachable', () => {
            const availableMoves = [
                { x: 1, y: 1 },
                { x: 2, y: 0 },
            ];
            const opponentPos = { x: 2, y: 1 };
            const adjacentPos = { x: 2, y: 0 };

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: {
                    items: [],
                    name: 'Opponent',
                    pendingItem: 0,
                    id: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            });
            mockService.getAdjacentPositions.returns([
                { x: 1, y: 1 },
                { x: 2, y: 0 },
                { x: 3, y: 1 },
            ]);
            mockService.getClosest
                .withArgs(opponentPos, [
                    { x: 1, y: 1 },
                    { x: 2, y: 0 },
                ])
                .returns(adjacentPos);

            const result = (strategy as any).findReachableOpponentTarget(config, availableMoves, playerIndex);
            expect(result).to.deep.equal(adjacentPos);
        });
    });

    describe('findReachableItemTarget', () => {
        it('should return null when no items of specified types are available', () => {
            mockService.findNearestItemTile.returns(null);
            const result = (strategy as any).findReachableItemTarget(config, [], playerIndex, [ObjectsTypes.SWORD, ObjectsTypes.BOOTS]);
            return expect(result).to.be.null;
        });

        it('should return item position when directly reachable', () => {
            const availableMoves = [{ x: 3, y: 3 }];
            const itemPos = { x: 3, y: 3 };

            mockService.findNearestItemTile.returns(itemPos);

            const result = (strategy as any).findReachableItemTarget(config, availableMoves, playerIndex, [ObjectsTypes.SWORD]);
            expect(result).to.deep.equal(itemPos);
        });

        it('should return null when item is not reachable', () => {
            const availableMoves = [{ x: 1, y: 1 }];
            const itemPos = { x: 3, y: 3 };

            mockService.findNearestItemTile.returns(itemPos);

            const result = (strategy as any).findReachableItemTarget(config, availableMoves, playerIndex, [ObjectsTypes.SWORD]);
            return expect(result).to.be.null;
        });
    });

    describe('determinePrimaryTargetAndMove', () => {
        it('should prioritize opponent when closest', () => {
            const availableMoves = [{ x: 1, y: 0 }];
            const opponentPos = { x: 5, y: 5 };
            const closestMove = { x: 1, y: 0 };

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: {
                    items: [],
                    name: 'Opponent',
                    pendingItem: 0,
                    id: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            });
            mockService.findNearestItemTile.returns(null);
            mockService.distance.withArgs(config.gameState.playerPositions[playerIndex], opponentPos).returns(5);
            mockService.getClosest.withArgs(opponentPos, availableMoves).returns(closestMove);

            const result = (strategy as any).determinePrimaryTargetAndMove(config, availableMoves, playerIndex, false);
            expect(result).to.deep.equal(closestMove);
        });

        it('should prioritize desired items when closer than opponent', () => {
            const availableMoves = [{ x: 2, y: 2 }];
            const opponentPos = { x: 5, y: 5 };
            const itemPos = { x: 2, y: 2 };
            const closestMove = { x: 2, y: 2 };

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: {
                    items: [],
                    name: 'Opponent',
                    pendingItem: 0,
                    id: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            });
            mockService.findNearestItemTile
                .withArgs(config.gameState, config.gameState.playerPositions[playerIndex], [
                    ObjectsTypes.SWORD,
                    ObjectsTypes.BOOTS,
                    ObjectsTypes.CRYSTAL,
                ])
                .returns(itemPos);
            mockService.distance
                .withArgs(config.gameState.playerPositions[playerIndex], opponentPos)
                .returns(10)
                .withArgs(config.gameState.playerPositions[playerIndex], itemPos)
                .returns(3);
            mockService.getClosest.withArgs(itemPos, availableMoves).returns(closestMove);

            const result = (strategy as any).determinePrimaryTargetAndMove(config, availableMoves, playerIndex, false);
            expect(result).to.deep.equal(closestMove);
        });

        it('should not consider items when inventory is full', () => {
            const availableMoves = [{ x: 1, y: 0 }];
            const opponentPos = { x: 5, y: 5 };
            const closestMove = { x: 1, y: 0 };

            mockService.getNearestOpponent.returns({
                pos: opponentPos,
                player: {
                    items: [],
                    name: 'Opponent',
                    pendingItem: 0,
                    id: '',
                    avatar: '',
                    isHost: false,
                    life: 0,
                    maxLife: 0,
                    speed: 0,
                    attack: 0,
                    defense: 0,
                    winCount: 0,
                },
            });
            mockService.distance.withArgs(config.gameState.playerPositions[playerIndex], opponentPos).returns(5);
            mockService.getClosest.withArgs(opponentPos, availableMoves).returns(closestMove);

            const result = (strategy as any).determinePrimaryTargetAndMove(config, availableMoves, playerIndex, true);
            expect(result).to.deep.equal(closestMove);
            return expect(mockService.findNearestItemTile.called).to.be.false;
        });
    });

    describe('getOtherItemTypes', () => {
        it('should return all item types except excluded ones', () => {
            const result = (strategy as any).getOtherItemTypes();

            expect(result).to.be.an('array');
            expect(result).to.not.include(ObjectsTypes.SWORD);
            expect(result).to.not.include(ObjectsTypes.BOOTS);
            expect(result).to.not.include(ObjectsTypes.CRYSTAL);
            expect(result).to.not.include(ObjectsTypes.EMPTY);
            expect(result).to.not.include(ObjectsTypes.SPAWN);
            expect(result).to.not.include(ObjectsTypes.RANDOM);
        });
    });
    it('should prioritize other items when desired items are not available and they are closer than the opponent', () => {
        const availableMoves = [{ x: 2, y: 2 }];
        const opponentPos = { x: 7, y: 7 };
        const otherItemPos = { x: 2, y: 2 };
        const closestMove = otherItemPos;

        mockService.getNearestOpponent.returns({
            pos: opponentPos,
            player: {
                items: [],
                name: 'Opponent',
                pendingItem: 0,
                id: '',
                avatar: '',
                isHost: false,
                life: 0,
                maxLife: 0,
                speed: 0,
                attack: 0,
                defense: 0,
                winCount: 0,
            },
        });

        mockService.findNearestItemTile.onCall(0).returns(null);
        mockService.findNearestItemTile.onCall(1).returns(otherItemPos);

        mockService.distance.withArgs(config.gameState.playerPositions[playerIndex], opponentPos).returns(10);
        mockService.distance.withArgs(config.gameState.playerPositions[playerIndex], otherItemPos).returns(3);

        mockService.getClosest.withArgs(otherItemPos, availableMoves).returns(closestMove);

        const result = (strategy as any).determinePrimaryTargetAndMove(config, availableMoves, playerIndex, false);
        expect(result).to.deep.equal(closestMove);
    });
});
