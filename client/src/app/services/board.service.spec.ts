/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { MapSize } from '@app/Consts/app-constants';
import { Game, GameSize, GameType } from '@common/game.interface';
import { Tile } from '@common/tile';
import { BoardService } from './board.service';

describe('BoardService', () => {
    let service: BoardService;

    const mockGame: Game = {
        id: '1',
        name: 'Test Game',
        mapSize: GameSize.small,
        mode: GameType.classic,
        previewImage: '',
        description: 'Test description',
        lastModified: new Date(),
        isVisible: true,
        board: [
            [1, 2],
            [3, 4],
        ],
        objects: [],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [BoardService],
        });
        service = TestBed.inject(BoardService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize board from game data', () => {
        service.initializeBoard(mockGame, 2);

        expect(service.board.length).toBe(2);
        expect(service.board[0].length).toBe(2);
    });

    it('should initialize an empty board when no game data exists', () => {
        const emptyGame = { ...mockGame, id: '', board: [] };
        service.initializeBoard(emptyGame, MapSize.SMALL);

        expect(service.board.length).toBe(MapSize.SMALL);
        expect(service.board[0].length).toBe(MapSize.SMALL);

        for (let i = 0; i < MapSize.SMALL; i++) {
            for (let j = 0; j < MapSize.SMALL; j++) {
                expect(service.board[i][j].type).toBe(0);
                expect(service.board[i][j].object).toBe(0);
            }
        }
    });

    it('should load an existing board', () => {
        const mockBoard: Tile[][] = [[{ type: 1, x: 0, y: 0, id: '0-0', object: 0 }], [{ type: 2, x: 1, y: 0, id: '1-0', object: 0 }]];

        service.loadBoard(mockBoard);
        expect(service.board).toEqual(mockBoard);
    });

    it('should return correct map size for different string sizes', () => {
        expect(service.getMapSize('small')).toBe(MapSize.SMALL);
        expect(service.getMapSize('medium')).toBe(MapSize.MEDIUM);
        expect(service.getMapSize('large')).toBe(MapSize.LARGE);
        expect(service.getMapSize('invalid')).toBe(MapSize.SMALL);
    });

    it('should delete an object from a tile', () => {
        const mockTile: Tile = { type: 1, x: 0, y: 0, id: '0-0', object: 5 };
        service.deleteObject(mockTile);
        expect(mockTile.object).toBe(0);
    });

    it('should notify subscribers when board changes', () => {
        const testBoard: Tile[][] = [[{ type: 1, x: 0, y: 0, id: '0-0', object: 0 }]];
        service.loadBoard(testBoard);

        let receivedBoard: Tile[][] | undefined;
        service.board$.subscribe((board) => {
            receivedBoard = board;
        });

        service.notifyBoardChange();
        expect(receivedBoard).toEqual(testBoard);
    });

    it('should update a specific tile', () => {
        const testBoard: Tile[][] = [[{ type: 1, x: 0, y: 0, id: '0-0', object: 0 }]];
        service.loadBoard(testBoard);

        service.updateTile(0, 0, { type: 2, object: 3 });
        expect(service.board[0][0].type).toBe(2);
        expect(service.board[0][0].object).toBe(3);
    });

    it('should get a specific tile', () => {
        const testBoard: Tile[][] = [[{ type: 1, x: 0, y: 0, id: '0-0', object: 0 }]];
        service.loadBoard(testBoard);

        const tile = service.getTile(0, 0);
        expect(tile).toEqual(testBoard[0][0]);
    });

    it('should return undefined for out-of-bounds tile coordinates', () => {
        const testBoard: Tile[][] = [[{ type: 1, x: 0, y: 0, id: '0-0', object: 0 }]];
        service.loadBoard(testBoard);

        expect(service.getTile(-1, 0)).toBeUndefined();
        expect(service.getTile(0, -1)).toBeUndefined();
        expect(service.getTile(1, 0)).toBeUndefined();
        expect(service.getTile(0, 1)).toBeUndefined();
    });

    it('should update and track object held state', () => {
        service.objectHeld = true;
        expect(service.objectHeld).toBeTrue();

        let receivedValue: boolean | undefined;
        service.objectHeld$.subscribe((value) => {
            receivedValue = value;
        });

        service.objectHeld = false;
        expect(receivedValue).toBeFalse();
    });

    it('should update and track selected tiles', () => {
        const mockTiles = [{ x: 1, y: 2 }];
        service.selectedTiles = mockTiles;
        expect(service.selectedTiles).toEqual(mockTiles);

        let receivedTiles: any;
        service.selectedTiles$.subscribe((tiles) => {
            receivedTiles = tiles;
        });

        const newTiles = [{ x: 3, y: 4 }];
        service.selectedTiles = newTiles;
        expect(receivedTiles).toEqual(newTiles);
    });
});
