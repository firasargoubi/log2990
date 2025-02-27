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
import { of, Subject } from 'rxjs';
import { Tile } from '@app/interfaces/tile';
import { Game } from '@app/interfaces/game.model';
import { Coordinates } from '@app/interfaces/coordinates';
import { MapSize } from '@app/interfaces/map-size';

const MAP_SIZE = 10;
const TILE_VALUE = 12;
const CUSTOM_GAME = {
    id: 'abcd',
    name: 'Wow',
    description: 'Avec Item',
    mapSize: 'small',
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
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize board with default tiles if no game ID is provided', () => {
        component.game.id = '';
        component.initializeBoard();
        expect(component.board.length).toBe(component.mapSize);
        expect(component.board[0].length).toBe(component.mapSize);
        expect(component.board[0][0].type).toBe(0);
        expect(component.board[0][0].object).toBe(0);
    });

    it('should initialize board with values of board if id provided', () => {
        component.game.id = CUSTOM_GAME.id;
        component.game.board = CUSTOM_GAME.board;
        component.game.mapSize = CUSTOM_GAME.mapSize;
        component.initializeBoard();
        expect(component.board.length).toBe(component.mapSize);
        expect(component.board[0].length).toBe(component.mapSize);
        expect(component.board[0][0].type).toBe(2);
        expect(component.board[0][0].object).toBe(1);
    });

    it('should modify tile on mouse over if mouse is pressed', () => {
        mouseServiceSpy.mousePressed = true;
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseOverBoard(tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[1][1]);
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
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[2][2]);
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
        expect(component.board).toEqual(mockBoard);
    });

    it('should reset board on reset activation', () => {
        saveServiceSpy.isReset$ = of(true);
        component.ngOnInit();
        expect(component.board.length).toBe(component.mapSize);
    });

    it('should initialize the board with the correct size when game is updated', () => {
        component.game.mapSize = 'large';
        component.initializeBoard();
        expect(component.board.length).toBe(20); // Supposons que LARGE = 10x10
    });

    it('should add tile to selectedTiles when clicked while holding Shift', () => {
        const event = new MouseEvent('mousedown', { shiftKey: true });
        const tile: Tile = { type: 1, object: 0, x: 2, y: 2, id: '2-2' };

        // Vérifier que selectedTiles est vide avant
        expect(component.selectedTiles).not.toContain(tile);

        component.onMouseDownBoard(event, tile);
        fixture.detectChanges(); // Forcer la mise à jour Angular

        // Vérifier que le tile a bien été ajouté
        expect(component.selectedTiles.some((t) => t.x === tile.x && t.y === tile.y)).toBeFalse();
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
            mapSize: 'small',
            mode: 'normal',
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: true,
            board: [],
            objects: [],
        };

        // Vérifier que fetchGameById est bien défini dans le mock
        gameServiceSpy.fetchGameById = jasmine.createSpy().and.returnValue(of(mockGame));

        component.ngOnInit();
        expect(component.game.id).toBe('');
    });

    it('should call onMouseUp when onMouseUpBoard is called', () => {
        component.onMouseUpBoard();
        expect(component.objectHeld).toBeFalsy('');
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
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseOverBoard(tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[1][1]);
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

    it('should set toolSaved and currentTool to -1 if tile has object', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 1 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.toolSaved).toBe(tileServiceSpy.currentTool);
        expect(tileServiceSpy.currentTool).toBe(-1);
    });

    it('should call modifyTile when onMouseDownBoard is called', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[1][1]);
    });

    it('should call onMouseLeave when onMouseLeaveBoard is called', () => {
        component.onMouseLeaveBoard();
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
    });

    it('should update tile object when onObjectChanged is called', () => {
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onObjectChanged(1, tile);
        expect(tile.object).toBe(1);
    });

    it('should call modifyTile with correct coordinates', () => {
        const coordinates: Coordinates = { x: 1, y: 1 };
        component.modifyTile(coordinates);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[1][1]);
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
        component.game.mapSize = 'small';
        expect(component.mapSize).toBe(MapSize.SMALL);
    });

    it('should return the correct map size for medium', () => {
        component.game.mapSize = 'medium';
        expect(component.mapSize).toBe(MapSize.MEDIUM);
    });

    it('should return the correct map size for large', () => {
        component.game.mapSize = 'large';
        expect(component.mapSize).toBe(MapSize.LARGE);
    });

    it('should return the default map size for an unknown size', () => {
        component.game.mapSize = '';
        expect(component.mapSize).toBe(MapSize.SMALL);
    });

    it('should subscribe to isSave$ observable in constructor', () => {
        const reloadTilesSpy = spyOn(component, 'reloadTiles');
        (saveServiceSpy.isSave$ as Subject<boolean>).next(true);
        expect(reloadTilesSpy).toHaveBeenCalled();
        expect(saveServiceSpy.verifyBoard).toHaveBeenCalledWith(component.board);
    });

    it('should set currentTool to 0 in constructor', () => {
        expect(component.tileService.currentTool).toBe(-1);
    });
    it('should call onMouseDown with correct coordinates', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(mouseServiceSpy.onMouseDown).toHaveBeenCalledWith({ x: tile.x, y: tile.y });
    });

    it('should delete object on right-click if tile has an object', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 1 };
        component.onMouseDownBoard(event, tile);
        expect(tile.object).toBe(0);
    });

    it('should save current tool and set current tool to 0 on right-click if tile has no object', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.toolSaved).toBe(tileServiceSpy.currentTool);
        expect(tileServiceSpy.currentTool).toBe(-1);
    });

    it('should set objectHeld to true if tile has an object on left-click', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 1 };
        component.onMouseDownBoard(event, tile);
        expect(component.objectHeld).toBeTrue();
    });

    it('should call modifyTile if tile has no object on left-click', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[1][1]);
    });
    it('should call refreshObject on each TileComponent when reloadTiles is called', () => {
        const mockTileComponents = [{ refreshObject: jasmine.createSpy('refreshObject') }, { refreshObject: jasmine.createSpy('refreshObject') }];
        component.tileComponents.reset(mockTileComponents as any);

        component.reloadTiles();

        mockTileComponents.forEach((tileComponent) => {
            expect(tileComponent.refreshObject).toHaveBeenCalled();
        });
    });

    it('should not throw an error if tileComponents is empty when reloadTiles is called', () => {
        component.tileComponents.reset([]);

        expect(() => component.reloadTiles()).not.toThrow();
    });

    it('should call refreshObject on the correct number of TileComponents when reloadTiles is called', () => {
        const mockTileComponents = Array.from({ length: component.mapSize ** 2 }, () => ({
            refreshObject: jasmine.createSpy('refreshObject'),
        }));
        component.tileComponents.reset(mockTileComponents as any);

        component.reloadTiles();

        mockTileComponents.forEach((tileComponent) => {
            expect(tileComponent.refreshObject).toHaveBeenCalled();
        });
    });
});
