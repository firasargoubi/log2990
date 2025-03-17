/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardComponent } from './board.component';
import { TileComponent } from '@app/components/tile/tile.component';
import { MouseService } from '@app/services/mouse.service';
import { TileService } from '@app/services/tile.service';
import { SaveService } from '@app/services/save.service';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { BoardService } from '@app/services/board.service';
import { of, Subject } from 'rxjs';
import { Tile } from '@app/interfaces/tile';
import { Game, GameSize, GameType } from '@common/game.interface';
import { Coordinates } from '@app/interfaces/coordinates';
import { MapSize } from '@app/Consts/app.constants';

const MAP_SIZE = 10;
const TILE_VALUE = 12;
const CUSTOM_GAME = {
    id: 'abcd',
    name: 'Wow',
    description: 'Avec Item',
    mapSize: GameSize.small,
    board: Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(TILE_VALUE)),
};

describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let saveServiceSpy: jasmine.SpyObj<SaveService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let boardServiceSpy: jasmine.SpyObj<BoardService>;

    beforeEach(async () => {
        mouseServiceSpy = jasmine.createSpyObj('MouseService', ['onMouseUp', 'onMouseDown', 'onMouseMove']);
        tileServiceSpy = jasmine.createSpyObj('TileService', ['modifyTile', 'copyTileTool', 'getToolSaved', 'resetTool', 'deleteTool', 'saveTool'], {
            currentTool: -1,
            toolSaved: -1,
        });
        saveServiceSpy = jasmine.createSpyObj('SaveService', ['verifyBoard', 'getGameNames'], {
            isSave$: new Subject<boolean>(),
            isReset$: of(false),
        });
        boardServiceSpy = jasmine.createSpyObj(
            'BoardService',
            ['initializeBoard', 'loadBoard', 'deleteObject', 'notifyBoardChange', 'getMapSize', 'updateTile'],
            {
                board: Array.from({ length: MAP_SIZE }, (a, i) =>
                    Array.from({ length: MAP_SIZE }, (b, j) => ({
                        type: 0,
                        object: 0,
                        x: i,
                        y: j,
                        id: `${i}-${j}`,
                    })),
                ),
                objectHeld: false,
                selectedTiles: [],
            },
        );

        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGames']);
        errorServiceSpy = jasmine.createSpyObj('ErrorService', ['handleError']);

        await TestBed.configureTestingModule({
            imports: [TileComponent],
            providers: [
                provideHttpClientTesting(),
                { provide: MouseService, useValue: mouseServiceSpy },
                { provide: TileService, useValue: tileServiceSpy },
                { provide: SaveService, useValue: saveServiceSpy },
                { provide: ErrorService, useValue: errorServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: BoardService, useValue: boardServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        component.tileComponents = { get: () => ({ refreshObject: jasmine.createSpy('refreshObject') }), reset: jasmine.createSpy('reset') } as any;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize board with default tiles if no game ID is provided', () => {
        component.game.id = '';
        component.initializeBoard();
        expect(boardServiceSpy.initializeBoard).toHaveBeenCalledWith(component.game, component.mapSize);
    });

    it('should initialize board with values of board if id provided', () => {
        component.game.id = CUSTOM_GAME.id;
        component.game.board = CUSTOM_GAME.board;
        component.game.mapSize = CUSTOM_GAME.mapSize;
        component.initializeBoard();
        expect(boardServiceSpy.initializeBoard).toHaveBeenCalledWith(component.game, component.mapSize);
    });

    it('should modify tile on mouse over if mouse is pressed', () => {
        mouseServiceSpy.mousePressed = true;
        boardServiceSpy.objectHeld = false;
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseOverBoard(tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(boardServiceSpy.board[1][1]);
    });

    it('should not modify tile on mouse over if mouse is not pressed', () => {
        mouseServiceSpy.mousePressed = false;
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseOverBoard(tile);
        expect(tileServiceSpy.modifyTile).not.toHaveBeenCalled();
    });

    it('should modify tile on left mouse click', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 2, x: 2, y: 2, id: '2-2', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(boardServiceSpy.board[2][2]);
    });

    it('should save current tool and set tool to 0 on right-click', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        const tile: Tile = { type: 2, x: 2, y: 2, id: '2-2', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.toolSaved).toBe(tileServiceSpy.currentTool);
        expect(tileServiceSpy.currentTool).toBe(-1);
    });

    it('should update tile object when onObjectChanged is called', () => {
        const tile: Tile = { type: 2, x: 2, y: 2, id: '2-2', object: 0 };
        component.onObjectChanged(1, tile);
        expect(tile.object).toBe(1);
    });

    it('should prevent default behavior on right-click', () => {
        const event = new MouseEvent('contextmenu');
        spyOn(event, 'preventDefault');
        component.onRightClickBoard(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call copyTileTool when onClickTileTool is called', () => {
        const tileType = 3;
        component.onClickTileTool(tileType);
        expect(tileServiceSpy.copyTileTool).toHaveBeenCalledWith(tileType);
    });

    it('should trigger mouse leave event', () => {
        component.onMouseLeaveBoard();
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
    });

    it('should update board when loading an existing board', () => {
        const mockBoard: Tile[][] = [[{ type: 1, object: 0, x: 0, y: 0, id: '0-0' }], [{ type: 2, object: 1, x: 1, y: 1, id: '1-1' }]];
        component.loadBoard(mockBoard);
        expect(boardServiceSpy.loadBoard).toHaveBeenCalledWith(mockBoard);
    });

    it('should reset board on reset activation', () => {
        saveServiceSpy.isReset$ = of(true);
        component.ngOnInit();

        expect(boardServiceSpy.initializeBoard).toHaveBeenCalled();
    });

    it('should initialize the board with the correct size when game is updated', () => {
        component.game.mapSize = GameSize.large;
        component.initializeBoard();
        expect(boardServiceSpy.initializeBoard).toHaveBeenCalledWith(component.game, component.mapSize);
    });

    it('should remove tile object when onObjectChanged is called with 0', () => {
        const tile: Tile = { type: 2, object: 1, x: 2, y: 2, id: '2-2' };
        component.onObjectChanged(0, tile);
        expect(tile.object).toBe(0);
    });

    it('should load board data when gameService.fetchGames is called', () => {
        const mockGame: Game = {
            id: '1',
            name: 'Test Game',
            mode: GameType.classic,
            mapSize: GameSize.small,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: true,
            board: [],
            objects: [],
        };

        gameServiceSpy.fetchGameById = jasmine.createSpy().and.returnValue(of(mockGame));

        component.ngOnInit();
        expect(component.game.id).toBe('');
    });

    it('should call onMouseUp when onMouseUpBoard is called', () => {
        component.onMouseUpBoard();
        expect(boardServiceSpy.objectHeld).toBeFalse();
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
        expect(tileServiceSpy.getToolSaved).toHaveBeenCalled();
    });

    it('should call onMouseMove when onMouseOverBoard is called', () => {
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseOverBoard(tile);
        expect(mouseServiceSpy.onMouseMove).toHaveBeenCalledWith({ x: tile.x, y: tile.y });
    });

    it('should call modifyTile when onMouseOverBoard is called and mouse is pressed', () => {
        mouseServiceSpy.mousePressed = true;
        boardServiceSpy.objectHeld = false;
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseOverBoard(tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(boardServiceSpy.board[1][1]);
    });

    it('should call onMouseDown when onMouseDownBoard is called', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(mouseServiceSpy.onMouseDown).toHaveBeenCalledWith({ x: tile.x, y: tile.y });
    });

    it('should set toolSaved and currentTool on right-click', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.toolSaved).toBe(tileServiceSpy.currentTool);
        expect(tileServiceSpy.currentTool).toBe(-1);
    });

    it('should set toolSaved and currentTool to -1 if tile has an object', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 1 };
        boardServiceSpy.objectHeld = false;
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.toolSaved).toBe(tileServiceSpy.currentTool);
        expect(tileServiceSpy.currentTool).toBe(-1);
    });

    it('should call modifyTile when onMouseDownBoard is called', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(boardServiceSpy.board[1][1]);
    });

    it('should call onMouseLeave when onMouseLeaveBoard is called', () => {
        component.onMouseLeaveBoard();
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
    });

    it('should update tile object when onObjectChanged is called', () => {
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onObjectChanged(1, tile);
        expect(tile.object).toBe(1);
        expect(boardServiceSpy.notifyBoardChange).toHaveBeenCalled();
    });

    it('should call modifyTile with correct coordinates', () => {
        const coordinates: Coordinates = { x: 1, y: 1 };
        component.modifyTile(coordinates);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(boardServiceSpy.board[1][1]);
    });

    it('should prevent default behavior on right-click', () => {
        const event = new MouseEvent('contextmenu');
        spyOn(event, 'preventDefault');
        component.onRightClickBoard(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should call copyTileTool when onClickTileTool is called', () => {
        const tileType = 3;
        component.onClickTileTool(tileType);
        expect(tileServiceSpy.copyTileTool).toHaveBeenCalledWith(tileType);
    });

    it('should return the correct map size for small', () => {
        component.game.mapSize = GameSize.small;

        boardServiceSpy.getMapSize.and.returnValue(MapSize.SMALL);

        expect(component.mapSize).toBe(MapSize.SMALL);
        expect(boardServiceSpy.getMapSize).toHaveBeenCalledWith(GameSize.small);
    });

    it('should return the correct map size for medium', () => {
        component.game.mapSize = GameSize.medium;

        boardServiceSpy.getMapSize.and.returnValue(MapSize.MEDIUM);

        expect(component.mapSize).toBe(MapSize.MEDIUM);
        expect(boardServiceSpy.getMapSize).toHaveBeenCalledWith(GameSize.medium);
    });

    it('should return the correct map size for large', () => {
        component.game.mapSize = GameSize.large;

        boardServiceSpy.getMapSize.and.returnValue(MapSize.LARGE);

        expect(component.mapSize).toBe(MapSize.LARGE);
        expect(boardServiceSpy.getMapSize).toHaveBeenCalledWith(GameSize.large);
    });

    it('should return the default map size for an unknown size', () => {
        component.game.mapSize = '' as any;

        boardServiceSpy.getMapSize.and.returnValue(MapSize.SMALL);

        expect(component.mapSize).toBe(MapSize.SMALL);
        expect(boardServiceSpy.getMapSize).toHaveBeenCalledWith('');
    });

    it('should subscribe to isSave$ observable in constructor', () => {
        const reloadTilesSpy = spyOn(component, 'reloadTiles');
        (saveServiceSpy.isSave$ as Subject<boolean>).next(true);
        expect(reloadTilesSpy).toHaveBeenCalled();
        expect(saveServiceSpy.verifyBoard).toHaveBeenCalledWith(boardServiceSpy.board);
    });

    it('should delete object on right-click if tile has an object', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 1 };
        component.onMouseDownBoard(event, tile);
        expect(boardServiceSpy.deleteObject).toHaveBeenCalledWith(tile);
    });

    it('should call refreshObject on each TileComponent when reloadTiles is called', () => {
        const refreshObjectSpy = jasmine.createSpy('refreshObject');

        const mockTileComponents = [{ refreshObject: refreshObjectSpy }, { refreshObject: refreshObjectSpy }];

        component.tileComponents = {
            get: (index: number) => mockTileComponents[index],
            toArray: () => mockTileComponents,
        } as any;

        spyOnProperty(component, 'mapSize', 'get').and.returnValue(mockTileComponents.length);

        component.reloadTiles();

        expect(refreshObjectSpy).toHaveBeenCalledTimes(mockTileComponents.length);
    });

    it('should not throw an error if tileComponents is empty when reloadTiles is called', () => {
        component.tileComponents.reset([]);

        expect(() => component.reloadTiles()).not.toThrow();
    });
});
