import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game.model';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tileTypes';
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
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
            ];
            expect(service.intBoard).toEqual([
                [0, 1, 0],
                [0, 10, 0],
                [0, 1, 0],
            ]);
        });
    });

    describe('verifyBoard()', () => {
        it('should set currentStatus to the verification results', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.Wall, x: 1, y: 0, id: '2', object: 0 }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
            ];
            service.verifyBoard(board);
            expect(service.currentStatus).toEqual({
                doors: false,
                minTerrain: false,
                accessible: false,
                allSpawnPoints: false,
            });
        });
    });

    describe('verifyDoors()', () => {
        it('should return true for a board with correctly placed doors', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Wall, x: 0, y: 1, id: '1', object: 0 }],
                [{ type: TileTypes.DoorClosed, x: 1, y: 1, id: '2', object: 0 }],
                [{ type: TileTypes.Wall, x: 2, y: 1, id: '3', object: 0 }],
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

        it('should return false for an improperly connected door', () => {
            const board: Tile[][] = [
                [{ type: TileTypes.Grass, x: 0, y: 0, id: '1', object: 0 }],
                [{ type: TileTypes.DoorClosed, x: 1, y: 0, id: '2', object: 0 }],
                [{ type: TileTypes.Grass, x: 2, y: 0, id: '3', object: 0 }],
            ];
            service.board = board;
            expect(service.verifyDoors()).toBe(false);
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
});
