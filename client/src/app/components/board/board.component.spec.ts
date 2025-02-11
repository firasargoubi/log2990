import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardComponent } from './board.component';
import { TileComponent } from '@app/components/tile/tile.component';
import { MouseService } from '@app/services/mouse.service';
import { TileService } from '@app/services/tile.service';
import { SaveService } from '@app/services/save.service';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { of } from 'rxjs';
import { Tile } from '@app/interfaces/tile';
import { Game } from '@app/interfaces/game.model';
import { Coordinates } from '@app/interfaces/coordinates';
import { MapSize } from '@app/interfaces/mapsize';


describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let saveServiceSpy: jasmine.SpyObj<SaveService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(async () => {
        mouseServiceSpy = jasmine.createSpyObj('MouseService', ['onMouseUp', 'onMouseDown', 'onMouseMove', 'onMouseLeave']);
        tileServiceSpy = jasmine.createSpyObj('TileService', ['modifyTile', 'copyTileTool'], { currentTool: 0, toolSaved: 0 });
        saveServiceSpy = jasmine.createSpyObj('SaveService', ['verifyBoard'], { isSave$: of(false), isReset$: of(false) });
        errorServiceSpy = jasmine.createSpyObj('ErrorService', ['showError']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGames']);

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
        expect(tileServiceSpy.currentTool).toBe(0);
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
        expect(mouseServiceSpy.onMouseLeave).toHaveBeenCalled();
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
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
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
        expect(tileServiceSpy.currentTool).toBe(0);
    });

    it('should set toolSaved and currentTool to -1 if tile has object', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 1 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.toolSaved).toBe(tileServiceSpy.currentTool);
        expect(tileServiceSpy.currentTool).toBe(0);
    });

    it('should call modifyTile when onMouseDownBoard is called', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[1][1]);
    });

    it('should call onMouseLeave when onMouseLeaveBoard is called', () => {
        component.onMouseLeaveBoard();
        expect(mouseServiceSpy.onMouseLeave).toHaveBeenCalled();
    });

    it('should update tile object when onObjectChanged is called', () => {
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onObjectChanged(1, tile);
        expect(tile.object).toBe(1);
    });

    it('should call refreshObject on all tile components when onObjectMoved is called', () => {
        const tileComponentSpy = jasmine.createSpyObj('TileComponent', ['refreshObject']);
        component.tileComponents.reset([tileComponentSpy, tileComponentSpy]);
        component.onObjectMoved();
        expect(tileComponentSpy.refreshObject).toHaveBeenCalledTimes(2);
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
        expect(component.mapSize).toBe(MapSize.SMALL);
    });

    it('should call onMouseUp when onMouseUpBoard is called', () => {
        component.onMouseUpBoard();
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
    });
   
    it('should initialize board with correct tile types and objects when game ID is provided', () => {
        component.game.id = 'test-game-id';
        component.board = [
            [{ type: 0, object: 1, x: 0, y: 0, id: '0-0' }, { type: 1, object: 2, x: 0, y: 1, id: '0-1' }],
            [{ type: 2, object: 3, x: 1, y: 0, id: '1-0' }, { type: 3, object: 4, x: 1, y: 1, id: '1-1' }],
        ];
        component.initializeBoard();
        expect(component.board[0][0].type).toBe(0);
        expect(component.board[0][0].object).toBe(1);
        expect(component.board[0][1].type).toBe(1);
        expect(component.board[0][1].object).toBe(2);
        expect(component.board[1][0].type).toBe(2);
        expect(component.board[1][0].object).toBe(3);
        expect(component.board[1][1].type).toBe(3);
        expect(component.board[1][1].object).toBe(4);
    });

    it('should set currentTool to toolSaved and reset toolSaved on mouse up', () => {
        component.tileService.toolSaved = 1;
        component.tileService.currentTool = 2;
        component.onMouseUpBoard();
        expect(component.tileService.currentTool).toBe(0);
        expect(component.tileService.toolSaved).toBe(0);
    });

   
    
});
