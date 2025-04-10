/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MapSize } from '@app/consts/app-constants';
import { Game, GameSize, GameType, ObjectsTypes, TileTypes } from '@common/game.interface';
import { Tile } from '@common/tile';
import { of, throwError } from 'rxjs';
import { GameService } from './game.service';
import { SaveService } from './save.service';

describe('SaveService', () => {
    let service: SaveService;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['createGame', 'updateGame']);

        TestBed.configureTestingModule({
            providers: [SaveService, { provide: GameService, useValue: gameServiceSpy }, provideHttpClientTesting()],
        });

        service = TestBed.inject(SaveService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Board calculations through verifyBoard', () => {
        it('should calculate the board size correctly', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
            ];

            service.verifyBoard(board);

            const result = service.intBoard;
            expect(result.length).toBe(3);
            expect(result[0].length).toBe(1);
        });

        it('should convert terrain tiles correctly for intBoard', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
            ];

            service.verifyBoard(board);

            const result = service.intBoard;
            expect(result).toEqual([[1], [6], [1]]);
        });

        it('should return a 2D array of integers representing the board with objects', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Wall, x: 0, y: 1, id: '2', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 1, y: 0, id: '3', object: 0 },
                    { type: TileTypes.Wall, x: 1, y: 1, id: '4', object: 0 },
                ],
            ];

            service.verifyBoard(board);

            expect(service.intBoard).toEqual([
                [61, 6],
                [1, 6],
            ]);
        });

        it('should set currentStatus with the correct verifications', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Wall, x: 0, y: 1, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 0, y: 2, id: '3', object: 6 },
                    { type: TileTypes.Wall, x: 0, y: 3, id: '4', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 1, y: 0, id: '5', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 1, id: '6', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 2, id: '7', object: 0 },
                    { type: TileTypes.Wall, x: 1, y: 3, id: '8', object: 0 },
                ],
            ];

            service.verifyBoard(board);

            expect(service.currentStatus.doors).toBeTrue();
            expect(service.currentStatus.minTerrain).toBeTrue();
        });
    });

    describe('Door verification with verifyConnectingDoors', () => {
        it('should correctly identify horizontally connected doors', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 },
                    { type: TileTypes.Grass, x: 0, y: 1, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 0, y: 2, id: '3', object: 0 },
                ],
                [
                    { type: TileTypes.Wall, x: 1, y: 0, id: '4', object: 0 },
                    { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5', object: 0 },
                    { type: TileTypes.Wall, x: 1, y: 2, id: '6', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 2, y: 0, id: '7', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 1, id: '8', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 2, id: '9', object: 0 },
                ],
            ];

            service.verifyBoard(board);

            expect(service.verifyConnectingDoors(1, 1)).toBeTrue();
        });

        it('should correctly identify vertically connected doors', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 },
                    { type: TileTypes.Wall, x: 0, y: 1, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 0, y: 2, id: '3', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 1, y: 0, id: '4', object: 0 },
                    { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 2, id: '6', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 2, y: 0, id: '7', object: 0 },
                    { type: TileTypes.Wall, x: 2, y: 1, id: '8', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 2, id: '9', object: 0 },
                ],
            ];

            service.verifyBoard(board);

            expect(service.verifyConnectingDoors(1, 1)).toBeTrue();
        });
    });

    describe('Door edge cases with verifyDoors', () => {
        it('should detect doors on the edge of the board', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.DoorClosed, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 }],
            ];

            service.verifyBoard(board);

            expect(service.verifyDoors()).toBeFalse();
        });

        it('should detect doors without proper wall connections', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Grass, x: 0, y: 1, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 0, y: 2, id: '3', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 1, y: 0, id: '4', object: 0 },
                    { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 2, id: '6', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 2, y: 0, id: '7', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 1, id: '8', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 2, id: '9', object: 6 },
                ],
            ];

            service.verifyBoard(board);

            expect(service.verifyDoors()).toBeFalse();
        });
    });

    describe('Spawn points verification', () => {
        it('should verify spawn points for a small map', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: ObjectsTypes.SPAWN }],
            ];

            service.verifyBoard(board);

            expect(service.verifySpawnPoints(MapSize.SMALL)).toBeTrue();
        });

        it('should verify spawn points for a medium map', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 3, y: 0, id: '4', object: ObjectsTypes.SPAWN }],
            ];

            service.verifyBoard(board);

            expect(service.verifySpawnPoints(MapSize.MEDIUM)).toBeTrue();
        });

        it('should verify spawn points for a large map', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 3, y: 0, id: '4', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 4, y: 0, id: '5', object: ObjectsTypes.SPAWN }],
                [{ type: TileTypes.Grass, x: 5, y: 0, id: '6', object: ObjectsTypes.SPAWN }],
            ];

            service.verifyBoard(board);

            expect(service.verifySpawnPoints(MapSize.LARGE)).toBeTrue();
        });

        it('should detect insufficient spawn points', () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }]];

            service.verifyBoard(board);

            expect(service.verifySpawnPoints(MapSize.SMALL)).toBeFalse();
        });
    });

    describe('verifyFlag', () => {
        it('should return false if flag is not on the board', () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }]];
            service.verifyBoard(board);

            expect(service.verifyFlag()).toBeFalse();
        });
        it('should return true if flag is on the board', () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 9 }]];
            service.verifyBoard(board);

            expect(service.verifyFlag()).toBeTrue();
        });
    });
    describe('Game saving operations', () => {
        it('should call createGame() if game has no ID', () => {
            const game: Game = {
                id: '',
                name: 'Test Game',
                mapSize: GameSize.medium,
                mode: GameType.classic,
                previewImage: 'test-image.png',
                description: 'This is a test game.',
                lastModified: new Date(),
                isVisible: false,
                board: [],
                objects: [],
            };
            gameServiceSpy.createGame.and.returnValue(of(game));

            service.saveGame(game);

            expect(gameServiceSpy.createGame).toHaveBeenCalled();
            expect(gameServiceSpy.updateGame).not.toHaveBeenCalled();
        });

        it('should call updateGame() if game has an ID', () => {
            const game: Game = {
                id: '123',
                name: 'Test Game',
                mapSize: GameSize.medium,
                mode: GameType.classic,
                previewImage: 'test-image.png',
                description: 'This is a test game.',
                lastModified: new Date(),
                isVisible: false,
                board: [],
                objects: [],
            };
            gameServiceSpy.updateGame.and.returnValue(of(game));

            service.saveGame(game);

            expect(gameServiceSpy.updateGame).toHaveBeenCalledWith('123', jasmine.any(Object));
            expect(gameServiceSpy.createGame).not.toHaveBeenCalled();
        });

        it('should fallback to createGame() if updateGame() fails', () => {
            const game: Game = {
                id: '123',
                name: 'Test Game',
                mapSize: GameSize.medium,
                mode: GameType.classic,
                previewImage: 'test-image.png',
                description: 'This is a test game.',
                lastModified: new Date(),
                isVisible: false,
                board: [],
                objects: [],
            };
            gameServiceSpy.updateGame.and.returnValue(throwError(() => new Error('Update failed')));
            gameServiceSpy.createGame.and.returnValue(of(game));

            service.saveGame(game);

            expect(gameServiceSpy.updateGame).toHaveBeenCalled();
            expect(gameServiceSpy.createGame).toHaveBeenCalled();
        });
    });

    describe('Observable emissions', () => {
        it('should emit true when alertBoardForVerification is called with true', (done) => {
            service.isSave$.subscribe((value) => {
                expect(value).toBeTrue();
                done();
            });
            service.alertBoardForVerification(true);
        });

        it('should emit false when alertBoardForVerification is called with false', (done) => {
            service.isSave$.subscribe((value) => {
                expect(value).toBeFalse();
                done();
            });
            service.alertBoardForVerification(false);
        });

        it('should emit true when alertBoardForReset is called with true', (done) => {
            service.isReset$.subscribe((value) => {
                expect(value).toBeTrue();
                done();
            });
            service.alertBoardForReset(true);
        });

        it('should emit false when alertBoardForReset is called with false', (done) => {
            service.isReset$.subscribe((value) => {
                expect(value).toBeFalse();
                done();
            });
            service.alertBoardForReset(false);
        });
    });

    describe('Accessibility verification', () => {
        it('should detect boards with inaccessible tiles', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Wall, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Wall, x: 0, y: 1, id: '2', object: 0 },
                ],
            ];

            service.verifyBoard(board);

            expect(service.verifyAccessible()).toBeFalse();
        });

        it('should verify DFS traversal works correctly', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0, seen: false },
                    { type: TileTypes.Grass, x: 0, y: 1, id: '2', object: 0, seen: false },
                ],
                [
                    { type: TileTypes.Grass, x: 1, y: 0, id: '3', object: 0, seen: false },
                    { type: TileTypes.Grass, x: 1, y: 1, id: '4', object: 0, seen: true },
                ],
            ];

            service.verifyBoard(board);
            expect(service.verifyAccessible()).toBeTrue();
        });
    });

    describe('Game management functions', () => {
        it('should return game names excluding the specified ID', () => {
            Object.defineProperty(service, 'games', {
                value: [{ id: '1', name: 'Game 1' } as Game, { id: '2', name: 'Game 2' } as Game, { id: '3', name: 'Game 3' } as Game],
            });

            const result = service.getGameNames('2');

            expect(result).toEqual(['Game 1', 'Game 3']);
        });

        it('should update the games list correctly', () => {
            const games = [{ id: '1', name: 'Game 1' } as Game, { id: '2', name: 'Game 2' } as Game];

            service.updateGames(games);

            const result = service.getGameNames('3');
            expect(result).toEqual(['Game 1', 'Game 2']);
        });

        it('should verify tile percentage correctly', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 },
                    { type: TileTypes.Wall, x: 0, y: 1, id: '2', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 1, y: 0, id: '3', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 1, id: '4', object: 0 },
                ],
            ];

            service.verifyBoard(board);

            expect(service.verifyTilePercentage()).toBeTrue();
        });

        it('should detect insufficient tile percentage', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Wall, x: 0, y: 0, id: '1', object: 0 },
                    { type: TileTypes.Wall, x: 0, y: 1, id: '2', object: 0 },
                ],
                [
                    { type: TileTypes.Wall, x: 1, y: 0, id: '3', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 1, id: '4', object: 0 },
                ],
            ];

            service.verifyBoard(board);

            expect(service.verifyTilePercentage()).toBeFalse();
        });
    });
});
