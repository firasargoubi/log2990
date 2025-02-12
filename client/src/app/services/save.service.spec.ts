import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game.model';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';
import { GameService } from '@app/services/game.service';
import { of, throwError } from 'rxjs';
import { SaveService } from './save.service';

describe('SaveService', () => {
    let service: SaveService;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['createGame', 'updateGame']);

        TestBed.configureTestingModule({
            providers: [{ provide: GameService, provideHttpClientTesting, useValue: gameServiceSpy }],
        });

        service = TestBed.inject(SaveService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('get boardSize()', () => {
        it('should return the size of the board', () => {
            service.board = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
            ];
            expect(service.boardSize).toBe(3);
        });
    });

    describe('get boardTerrainTiles()', () => {
        it('should return the number of terrain tiles on the board', () => {
            service.board = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
            ];
            expect(service.boardTerrainTiles).toBe(2);
        });
    });

    describe('get intBoard()', () => {
        it('should return a 2D array of integers representing the board', () => {
            service.board = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 },
                    { type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 1, id: '1', object: 0 },
                    { type: TileTypes.Wall, x: 1, y: 1, id: '2', object: 0 },
                ],
            ];
            expect(service.intBoard).toEqual([
                [1, 6],
                [1, 6],
            ]);
        });
        it('should return a 2D array of integers representing the board with objects', () => {
            service.board = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 1, id: '1', object: 0 },
                    { type: TileTypes.Wall, x: 1, y: 1, id: '2', object: 0 },
                ],
            ];
            expect(service.intBoard).toEqual([
                [61, 6],
                [1, 6],
            ]);
        });
    });

    describe('verifyBoard()', () => {
        it('should set currentStatus to the verification results', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 6 },
                    { type: TileTypes.Wall, x: 3, y: 0, id: '4', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 1, id: '1', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 1, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 1, id: '3', object: 0 },
                    { type: TileTypes.Wall, x: 3, y: 1, id: '4', object: 0 },
                ],
            ];
            service.verifyBoard(board);
            expect(service.currentStatus).toEqual({
                doors: true,
                minTerrain: true,
                accessible: false,
                allSpawnPoints: true,
            });
        });
    });

    describe('verifyDoors()', () => {
        it('should return true for a board with correctly placed doors', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 },
                ],
                [
                    { type: TileTypes.Wall, x: 0, y: 1, id: '4', object: 0 },
                    { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5', object: 0 },
                    { type: TileTypes.Wall, x: 2, y: 1, id: '6', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 2, id: '7', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 2, id: '8', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 2, id: '9', object: 6 },
                ],
            ];
            service.board = board;
            expect(service.verifyDoors()).toBe(true);
        });

        it('should return false for a door on the edge of the board', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.DoorClosed, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 }],
            ];
            service.board = board;
            expect(service.verifyDoors()).toBe(false);
        });

        it('should return false for missing walls door', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 1, id: '4', object: 0 },
                    { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 1, id: '6', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 2, id: '7', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 2, id: '8', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 2, id: '9', object: 6 },
                ],
            ];
            service.board = board;
            expect(service.verifyDoors()).toBe(false);
        });

        it('should verify connecting doors correctly', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 1, id: '4', object: 0 },
                    { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 1, id: '6', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 2, id: '7', object: 0 },
                    { type: TileTypes.Wall, x: 1, y: 2, id: '8', object: 0 },
                    { type: TileTypes.Grass, x: 2, y: 2, id: '9', object: 6 },
                ],
            ];

            service.board = board;

            const result = service.verifyDoors();
            expect(result).toBeTrue();
        });
    });

    describe('verifySpawnPoints()', () => {
        it('should return true if there are at least 2 spawn points', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 }],
                [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 6 }],
            ];
            service.board = board;
            expect(service.verifySpawnPoints()).toBe(true);
        });

        it('should return false if there are less than 2 spawn points', () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 }]];
            service.board = board;
            expect(service.verifySpawnPoints()).toBe(false);
        });
    });

    describe('saveGame()', () => {
        it('should call createGame() if game has no ID', () => {
            const game: Game = {
                id: '',
                name: 'Test Game',
                mapSize: 'medium',
                mode: 'normal',
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
        });

        it('should call updateGame() if game has an ID', () => {
            const game: Game = {
                id: '123',
                name: 'Test Game',
                mapSize: 'medium',
                mode: 'normal',
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
        });

        it('should fallback to createGame() if updateGame() fails', () => {
            const game: Game = {
                id: '123',
                name: 'Test Game',
                mapSize: 'medium',
                mode: 'normal',
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

    describe('Observables', () => {
        it('should emit true when alertBoardForVerification is called', (done) => {
            service.isSave$.subscribe((value) => {
                expect(value).toBe(true);
                done();
            });
            service.alertBoardForVerification(true);
        });

        it('should emit false when alertBoardForVerification is called with false', (done) => {
            service.isSave$.subscribe((value) => {
                expect(value).toBe(false);
                done();
            });
            service.alertBoardForVerification(false);
        });

        it('should emit true when alertBoardForReset is called', (done) => {
            service.isReset$.subscribe((value) => {
                expect(value).toBe(true);
                done();
            });
            service.alertBoardForReset(true);
        });

        it('should emit false when alertBoardForReset is called with false', (done) => {
            service.isReset$.subscribe((value) => {
                expect(value).toBe(false);
                done();
            });
            service.alertBoardForReset(false);
        });
    });

    describe('verifyAccessible', () => {
        it('should return true for a fully accessible board', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 1, id: '4', object: 0 },
                    { type: TileTypes.Grass, x: 1, y: 1, id: '5', object: 0 },
                ],
            ];
            service.verifyBoard(board);
            expect(service.verifyAccessible()).toBeTrue();
        });

        it('should return false for a board with inaccessible tiles', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Wall, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 },
                ],
            ];
            service.verifyBoard(board);
            expect(service.verifyAccessible()).toBeFalse();
        });

        it('should return true for a board with multiple accessible areas', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 },
                    { type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 1, id: '4', object: 0 },
                    { type: TileTypes.Wall, x: 1, y: 1, id: '5', object: 0 },
                ],
            ];

            service.verifyBoard(board);
            expect(service.verifyAccessible()).toBeTrue();
        });

        it('should mark the left tile as seen if it is accessible', () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0, seen: false },
                    { type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0, seen: false },
                ],
                [
                    { type: TileTypes.Grass, x: 0, y: 1, id: '4', object: 0, seen: false },
                    { type: TileTypes.Grass, x: 1, y: 1, id: '5', object: 0, seen: false },
                ],
            ];

            service.board = board;
            service.countSeen = 0;

            service.verifyAccessibleDFS(1, 1);
            expect(service.board[1][0].seen).toBeTrue();
        });
    });
});
