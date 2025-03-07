/* eslint-disable @typescript-eslint/no-magic-numbers */
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@common/game.interface';
import { MapSize } from '@app/interfaces/map-size';
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

    it('should return the size of the board', () => {
        service.board = [
            [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
            [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 }],
            [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
        ];
        expect(service.boardSize).toBe(3);
    });

    it('should return the number of terrain tiles on the board', () => {
        service.board = [
            [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
            [{ type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 }],
            [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
        ];
        expect(service.boardTerrainTiles).toBe(2);
    });

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

    it('should return true for a board with correctly placed doors horizontally', () => {
        const board: Tile[][] = [
            [
                { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 },
                { type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 },
                { type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 },
            ],
            [
                { type: TileTypes.Wall, x: 0, y: 1, id: '4', object: 0 },
                { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5', object: 0 }, // Door in the middle
                { type: TileTypes.Wall, x: 2, y: 1, id: '6', object: 0 },
            ],
            [
                { type: TileTypes.Grass, x: 0, y: 2, id: '7', object: 0 },
                { type: TileTypes.Grass, x: 1, y: 2, id: '8', object: 0 },
                { type: TileTypes.Grass, x: 2, y: 2, id: '9', object: 0 },
            ],
        ];
        service.board = board;
        expect(service.verifyConnectingDoors(1, 1)).toBeTrue();
    });

    it('should return false for a door on the edge of the board', () => {
        const board: Tile[][] = [
            [{ type: TileTypes.DoorClosed, x: 0, y: 0, id: '1', object: 0 }],
            [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 0 }],
        ];
        service.board = board;
        expect(service.verifyDoors()).toBeFalse();
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
        expect(service.verifyDoors()).toBeFalse();
    });

    it('should verify vertical connecting doors correctly', () => {
        const board: Tile[][] = [
            [
                { type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 },
                { type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 },
                { type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 },
            ],
            [
                { type: TileTypes.Grass, x: 0, y: 1, id: '4', object: 0 },
                { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5', object: 0 }, // Door in the middle
                { type: TileTypes.Grass, x: 2, y: 1, id: '6', object: 0 },
            ],
            [
                { type: TileTypes.Grass, x: 0, y: 2, id: '7', object: 0 },
                { type: TileTypes.Wall, x: 1, y: 2, id: '8', object: 0 },
                { type: TileTypes.Grass, x: 2, y: 2, id: '9', object: 0 },
            ],
        ];
        service.board = board;
        expect(service.verifyConnectingDoors(1, 1)).toBeTrue();
    });

    it('should return true if there are enough spawn points for a small map', () => {
        const board: Tile[][] = [
            [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 }],
            [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 6 }],
        ];
        service.board = board;
        expect(service.verifySpawnPoints(MapSize.SMALL)).toBeTrue();
    });

    it('should return true if there are enough spawn points for a medium map', () => {
        const board: Tile[][] = [
            [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 }],
            [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 6 }],
            [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 6 }],
            [{ type: TileTypes.Grass, x: 3, y: 0, id: '4', object: 6 }],
        ];
        service.board = board;
        expect(service.verifySpawnPoints(MapSize.MEDIUM)).toBeTrue();
    });

    it('should return true if there are enough spawn points for a large map', () => {
        const board: Tile[][] = [
            [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 6 }],
            [{ type: TileTypes.Grass, x: 1, y: 0, id: '2', object: 6 }],
            [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 6 }],
            [{ type: TileTypes.Grass, x: 3, y: 0, id: '4', object: 6 }],
            [{ type: TileTypes.Grass, x: 4, y: 0, id: '5', object: 6 }],
            [{ type: TileTypes.Grass, x: 5, y: 0, id: '6', object: 6 }],
        ];
        service.board = board;
        expect(service.verifySpawnPoints(MapSize.LARGE)).toBeTrue();
    });

    it('should return false if there are not enough spawn points for a small map', () => {
        const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }]];
        service.board = board;
        expect(service.verifySpawnPoints(MapSize.SMALL)).toBeFalse();
    });

    it('should return false if there are enough spawn points for a medium map', () => {
        const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }]];
        service.board = board;
        expect(service.verifySpawnPoints(MapSize.MEDIUM)).toBeFalse();
    });

    it('should return false if there are enough spawn points for a large map', () => {
        const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }]];
        service.board = board;
        expect(service.verifySpawnPoints(MapSize.LARGE)).toBeFalse();
    });

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

    it('should emit true when alertBoardForVerification is called', (done) => {
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

    it('should emit true when alertBoardForReset is called', (done) => {
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
