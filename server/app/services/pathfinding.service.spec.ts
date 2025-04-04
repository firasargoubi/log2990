/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PathfindingService } from '@app/services/pathfinding.service';
import { GameState } from '@common/game-state';
import { TileTypes } from '@common/game.interface';
import { expect } from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';

describe('PathfindingService', () => {
    let service: PathfindingService;
    let sandbox: SinonSandbox;
    let mockGameState: GameState;

    beforeEach(() => {
        sandbox = createSandbox();
        service = new PathfindingService();

        mockGameState = {
            id: 'test-game',
            board: [
                [TileTypes.Grass, TileTypes.Grass, TileTypes.Water, TileTypes.Wall],
                [TileTypes.Grass, TileTypes.Ice, TileTypes.DoorOpen, TileTypes.DoorClosed],
                [TileTypes.Water, TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                [TileTypes.Wall, TileTypes.DoorClosed, TileTypes.Grass, TileTypes.Grass],
            ],
            currentPlayer: 'player1',
            playerPositions: [],
            players: [{ id: 'player1', name: 'Player 1', isHost: true, life: 100, speed: 3, attack: 10, defense: 5, avatar: '' }],
            turnCounter: 0,
            availableMoves: [],
            shortestMoves: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 3,
        } as any;

        mockGameState.playerPositions = [];
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getMovementCost', () => {
        it('should return correct cost for different tile types', () => {
            expect(service.getMovementCost(mockGameState, { x: 0, y: 0 })).to.equal(1);
            expect(service.getMovementCost(mockGameState, { x: 1, y: 1 })).to.equal(0);
            expect(service.getMovementCost(mockGameState, { x: 0, y: 2 })).to.equal(2);
            expect(service.getMovementCost(mockGameState, { x: 0, y: 3 })).to.equal(Infinity);
            expect(service.getMovementCost(mockGameState, { x: 1, y: 2 })).to.equal(1);
            expect(service.getMovementCost(mockGameState, { x: 1, y: 3 })).to.equal(Infinity);
        });

        it('should return Infinity for out of bounds positions', () => {
            expect(service.getMovementCost(mockGameState, { x: -1, y: 0 })).to.equal(Infinity);
            expect(service.getMovementCost(mockGameState, { x: 0, y: -1 })).to.equal(Infinity);
            expect(service.getMovementCost(mockGameState, { x: 4, y: 0 })).to.equal(Infinity);
            expect(service.getMovementCost(mockGameState, { x: 0, y: 4 })).to.equal(Infinity);
        });

        it('should return Infinity for undefined game state', () => {
            expect(service.getMovementCost(undefined as any, { x: 0, y: 0 })).to.equal(Infinity);
        });

        it('should return Infinity for game state with no board', () => {
            const noBoard = { ...mockGameState, board: undefined as any };
            expect(service.getMovementCost(noBoard as any, { x: 0, y: 0 })).to.equal(Infinity);
        });

        it('should return Infinity on error', () => {
            const errorGameState = {
                board: null,
            } as any;
            expect(service.getMovementCost(errorGameState, { x: 0, y: 0 })).to.equal(Infinity);
        });
    });

    describe('isPositionInBounds', () => {
        it('should return true for valid positions', () => {
            expect(service.isPositionInBounds(mockGameState, { x: 0, y: 0 })).to.be.true;
            expect(service.isPositionInBounds(mockGameState, { x: 3, y: 3 })).to.be.true;
            expect(service.isPositionInBounds(mockGameState, { x: 1, y: 2 })).to.be.true;
        });

        it('should return false for out of bounds positions', () => {
            expect(service.isPositionInBounds(mockGameState, { x: -1, y: 0 })).to.be.false;
            expect(service.isPositionInBounds(mockGameState, { x: 0, y: -1 })).to.be.false;
            expect(service.isPositionInBounds(mockGameState, { x: 4, y: 0 })).to.be.false;
            expect(service.isPositionInBounds(mockGameState, { x: 0, y: 4 })).to.be.false;
        });
    });

    describe('isPositionOccupied', () => {
        it('should return true if position is occupied by another player', () => {
            const gameState = { ...mockGameState };
            gameState.players = [{ id: 'player1', name: 'Player 1' } as any, { id: 'player2', name: 'Player 2' } as any];
            gameState.currentPlayer = 'player1';

            gameState.playerPositions = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ];

            expect(service.isPositionOccupied(gameState, { x: 1, y: 1 })).to.be.true;
        });

        it('should return false if position is not occupied by any player', () => {
            const gameState = { ...mockGameState };
            gameState.players = [{ id: 'player1', name: 'Player 1' } as any];
            gameState.currentPlayer = 'player1';
            gameState.playerPositions = [{ x: 0, y: 0 }];

            expect(service.isPositionOccupied(gameState, { x: 1, y: 1 })).to.be.false;
        });

        it('should return false if position is occupied by the current player', () => {
            const gameState = { ...mockGameState };
            gameState.players = [{ id: 'player1', name: 'Player 1' } as any];
            gameState.currentPlayer = 'player1';
            gameState.playerPositions = [{ x: 0, y: 0 }];

            expect(service.isPositionOccupied(gameState, { x: 0, y: 0 })).to.be.false;
        });
    });

    describe('isValidPosition', () => {
        it('should return false for out of bounds positions', () => {
            expect(service.isValidPosition(mockGameState, { x: -1, y: 0 })).to.be.false;
        });

        it('should return false for occupied positions', () => {
            const gameState = { ...mockGameState };
            gameState.players = [{ id: 'player1', name: 'Player 1' } as any, { id: 'player2', name: 'Player 2' } as any];
            gameState.currentPlayer = 'player1';
            gameState.playerPositions = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ];

            expect(service.isValidPosition(gameState, { x: 1, y: 1 })).to.be.false;
        });

        it('should return false for impassable tiles', () => {
            expect(service.isValidPosition(mockGameState, { x: 0, y: 3 })).to.be.false;
        });

        it('should return true for valid, unoccupied, passable tiles', () => {
            expect(service.isValidPosition(mockGameState, { x: 0, y: 1 })).to.be.true;
        });
    });

    describe('findShortestPath', () => {
        it('should return empty array for invalid end positions', () => {
            expect(service.findShortestPath(mockGameState, { x: 0, y: 0 }, { x: -1, y: 0 }, 5)).to.deep.equal([]);

            expect(service.findShortestPath(mockGameState, { x: 0, y: 0 }, { x: 0, y: 3 }, 5)).to.deep.equal([]);
        });

        it('should find a direct path when possible', () => {
            const path = service.findShortestPath(mockGameState, { x: 0, y: 0 }, { x: 0, y: 1 }, 5);

            expect(path.length).to.be.at.least(2);
            expect(path[0]).to.deep.equal({ x: 0, y: 0 });
            expect(path[path.length - 1]).to.deep.equal({ x: 0, y: 1 });
        });

        it('should find a path around obstacles', () => {
            const smallGameState = {
                ...mockGameState,
                board: [
                    [TileTypes.Grass, TileTypes.Wall, TileTypes.Grass],
                    [TileTypes.Grass, TileTypes.Wall, TileTypes.Grass],
                    [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                ],
            };

            const path = service.findShortestPath(smallGameState, { x: 0, y: 0 }, { x: 2, y: 0 }, 5);

            expect(path.length).to.be.at.least(2);
            expect(path[0]).to.deep.equal({ x: 0, y: 0 });
            expect(path[path.length - 1]).to.deep.equal({ x: 2, y: 0 });
        });

        it('should respect movement point limits', () => {
            const smallGameState = {
                ...mockGameState,
                board: [
                    [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                    [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                    [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                ],
            };

            const pathLimited = service.findShortestPath(smallGameState, { x: 0, y: 0 }, { x: 2, y: 2 }, 1);
            expect(pathLimited).to.deep.equal([]);

            const pathUnlimited = service.findShortestPath(smallGameState, { x: 0, y: 0 }, { x: 2, y: 2 }, 4);
            expect(pathUnlimited.length).to.be.at.least(2);
            expect(pathUnlimited[0]).to.deep.equal({ x: 0, y: 0 });
            expect(pathUnlimited[pathUnlimited.length - 1]).to.deep.equal({ x: 2, y: 2 });
        });
    });

    describe('findReachablePositions', () => {
        it('should return empty array for invalid inputs', () => {
            expect(service.findReachablePositions(mockGameState, null as any, 3)).to.deep.equal([]);
            expect(service.findReachablePositions(mockGameState, { x: 0, y: 0 }, 0)).to.deep.equal([]);
            expect(service.findReachablePositions(mockGameState, { x: 0, y: 0 }, -1)).to.deep.equal([]);
        });

        it('should find all reachable positions within movement points', () => {
            const smallGameState = {
                ...mockGameState,
                board: [
                    [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                    [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                    [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                ],
            };

            const positions = service.findReachablePositions(smallGameState, { x: 1, y: 1 }, 1);

            expect(positions).to.have.lengthOf(4);
            expect(positions).to.deep.include({ x: 0, y: 1 });
            expect(positions).to.deep.include({ x: 1, y: 0 });
            expect(positions).to.deep.include({ x: 2, y: 1 });
            expect(positions).to.deep.include({ x: 1, y: 2 });

            expect(positions).to.not.deep.include({ x: 1, y: 1 });
            expect(positions).to.not.deep.include({ x: 0, y: 0 });
            expect(positions).to.not.deep.include({ x: 2, y: 2 });

            const positions2 = service.findReachablePositions(smallGameState, { x: 1, y: 1 }, 2);
            expect(positions2.length).to.be.at.least(8);
            expect(positions2).to.deep.include({ x: 0, y: 0 });
            expect(positions2).to.deep.include({ x: 2, y: 2 });
        });

        it('should respect tile costs when finding reachable positions', () => {
            const mixedCostGameState = {
                ...mockGameState,
                board: [
                    [TileTypes.Ice, TileTypes.Grass, TileTypes.Water],
                    [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                    [TileTypes.Water, TileTypes.Grass, TileTypes.Wall],
                ],
            };

            const positions = service.findReachablePositions(mixedCostGameState, { x: 1, y: 1 }, 1);

            expect(positions.length).to.be.at.least(4);

            expect(positions).to.not.deep.include({ x: 0, y: 2 });

            const positions2 = service.findReachablePositions(mixedCostGameState, { x: 1, y: 1 }, 2);

            expect(positions2).to.deep.include({ x: 0, y: 0 });

            expect(positions2).to.not.deep.include({ x: 2, y: 2 });
        });

        it('should exclude occupied positions', () => {
            const gameStateWithPlayers = { ...mockGameState };
            gameStateWithPlayers.players = [{ id: 'player1', name: 'Player 1' } as any, { id: 'player2', name: 'Player 2' } as any];
            gameStateWithPlayers.currentPlayer = 'player1';
            gameStateWithPlayers.playerPositions = [
                { x: 1, y: 1 },
                { x: 0, y: 1 },
            ];

            const positions = service.findReachablePositions(gameStateWithPlayers, { x: 1, y: 1 }, 5);

            expect(positions).to.not.deep.include({ x: 0, y: 1 });
        });

        it('should return infinite cost for invalid tile type', () => {
            const invalidTileGameState = {
                ...mockGameState,
                board: [
                    [TileTypes.Grass, TileTypes.Grass],
                    [TileTypes.Grass, 99],
                ],
            };

            const tileCost = service.getMovementCost(invalidTileGameState, { x: 1, y: 1 });
            expect(tileCost).to.equal(Infinity);
        });
    });

    describe('findClosestAvailableSpot', () => {
        it('should find nearest empty spot when starting position is occupied', () => {
            const gameState = {
                ...mockGameState,
                board: [
                    [0, 0],
                    [0, 0],
                ],
                playerPositions: [{ x: 0, y: 0 }],
            };

            const result = service.findClosestAvailableSpot(gameState as any, { x: 0, y: 0 });

            const validResults = [
                { x: 1, y: 0 },
                { x: 0, y: 1 },
            ];

            const isValidResult = validResults.some((pos) => pos.x === result.x && pos.y === result.y);

            expect(isValidResult).to.be.true;
        });

        it('should return starting position if it is valid', () => {
            const gameState = {
                ...mockGameState,
                board: [
                    [0, 0],
                    [0, 0],
                ],
                playerPositions: [{ x: 1, y: 1 }],
            };

            const result = service.findClosestAvailableSpot(gameState as any, { x: 0, y: 0 });

            expect(result).to.deep.equal({ x: 0, y: 0 });
        });

        it('should handle no valid spots found', () => {
            const gameState = {
                ...mockGameState,
                board: [
                    [TileTypes.Wall, TileTypes.Wall],
                    [TileTypes.Wall, TileTypes.Wall],
                ],
                playerPositions: [] as any,
            };

            const result = service.findClosestAvailableSpot(gameState as any, { x: 0, y: 0 });

            expect(result).to.deep.equal({ x: -1, y: -1 });
        });

        it('should handle searching beyond board boundaries', () => {
            const gameState = {
                ...mockGameState,
                board: [[TileTypes.Grass]],
                playerPositions: [{ x: 0, y: 0 }],
            };

            const result = service.findClosestAvailableSpot(gameState as any, { x: 0, y: 0 });

            expect(result).to.deep.equal({ x: -1, y: -1 });
        });
    });

    describe('Private method coverage through public interfaces', () => {
        describe('isTileValid and isWithinBounds (via findClosestAvailableSpot)', () => {
            it('should check if tile is within bounds and valid', () => {
                const smallBoardState = {
                    ...mockGameState,
                    board: [[0]],
                    playerPositions: [{ x: 0, y: 0 }],
                };

                const outOfBoundsResult = service.findClosestAvailableSpot(smallBoardState as any, { x: 0, y: 0 });

                expect(outOfBoundsResult).to.deep.equal({ x: -1, y: -1 });

                const twoByTwoState = {
                    ...mockGameState,
                    board: [
                        [TileTypes.Wall, 0],
                        [0, 0],
                    ],
                    playerPositions: [] as any,
                };

                const wallResult = service.findClosestAvailableSpot(twoByTwoState as any, { x: 0, y: 0 });

                const validSpots = [
                    { x: 0, y: 1 },
                    { x: 1, y: 0 },
                    { x: 1, y: 1 },
                ];

                const isValidSpot = validSpots.some((spot) => spot.x === wallResult.x && spot.y === wallResult.y);

                expect(isValidSpot).to.be.true;
            });
        });

        describe('Complex path finding with node comparison', () => {
            it('should find path with same cost but different distances', () => {
                const gameState = {
                    ...mockGameState,
                    board: [
                        [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                        [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                        [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                    ],
                };

                const path = service.findShortestPath(gameState as any, { x: 0, y: 0 }, { x: 2, y: 2 }, 5);

                expect(path.length).to.be.at.most(5);
                expect(path[0]).to.deep.equal({ x: 0, y: 0 });
                expect(path[path.length - 1]).to.deep.equal({ x: 2, y: 2 });
            });

            it('should handle paths through mixed terrains', () => {
                const gameState = {
                    ...mockGameState,
                    board: [
                        [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                        [TileTypes.Grass, TileTypes.Ice, TileTypes.Grass],
                        [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                    ],
                };

                const path = service.findShortestPath(gameState as any, { x: 0, y: 0 }, { x: 2, y: 2 }, 5);

                expect(path).to.deep.include({ x: 1, y: 1 });
            });
        });

        describe('createNode and getNodeKey (via findShortestPath)', () => {
            it('should create nodes and track them by key in visited map', () => {
                const smallGameState = {
                    ...mockGameState,
                    board: [
                        [TileTypes.Grass, TileTypes.Grass],
                        [TileTypes.Grass, TileTypes.Grass],
                    ],
                };

                const path = service.findShortestPath(smallGameState as any, { x: 0, y: 0 }, { x: 1, y: 1 }, 5);

                expect(path.length).to.be.at.least(2);
                expect(path[0]).to.deep.equal({ x: 0, y: 0 });
                expect(path[path.length - 1]).to.deep.equal({ x: 1, y: 1 });
            });
        });

        describe('processPotentialNode (via findShortestPath)', () => {
            it('should not add nodes that exceed movement points', () => {
                const gameState = {
                    ...mockGameState,
                    board: [
                        [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                        [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                        [TileTypes.Grass, TileTypes.Grass, TileTypes.Grass],
                    ],
                };

                const path = service.findShortestPath(gameState as any, { x: 0, y: 0 }, { x: 2, y: 2 }, 1);

                expect(path).to.deep.equal([]);
            });

            it('should not add nodes that are already visited with better cost/distance', () => {
                const gameState = {
                    ...mockGameState,
                    board: [
                        [TileTypes.Grass, TileTypes.Ice, TileTypes.Grass],
                        [TileTypes.Ice, TileTypes.Grass, TileTypes.Ice],
                        [TileTypes.Grass, TileTypes.Ice, TileTypes.Grass],
                    ],
                };

                const path = service.findShortestPath(gameState as any, { x: 0, y: 0 }, { x: 2, y: 2 }, 5);

                const iceTileCount = path.filter((pos) => gameState.board[pos.x][pos.y] === TileTypes.Ice).length;

                expect(iceTileCount).to.be.at.least(2);
            });
        });
    });
});
