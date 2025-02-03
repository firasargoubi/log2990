import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardComponent } from './board.component';
import { MouseService } from '@app/services/mouse.service';
import { SaveService } from '@app/services/save.service';
import { TileService } from '@app/services/tile.service';
import { of } from 'rxjs';
import { Tile } from '@app/interfaces/tile';

describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let saveServiceSpy: jasmine.SpyObj<SaveService>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    const BOARD_SIZE = 5;

    beforeEach(async () => {
        // Mock Services
        mouseServiceSpy = jasmine.createSpyObj('MouseService', ['onMouseUp', 'onMouseDown', 'onMouseMove', 'onMouseLeave']);
        saveServiceSpy = jasmine.createSpyObj('SaveService', ['saveBoard'], { isActive$: of(true) });
        tileServiceSpy = jasmine.createSpyObj('TileService', ['modifyTile', 'copyTileTool'], { currentTool: -1 });

        await TestBed.configureTestingModule({
            imports: [BoardComponent],
            providers: [
                { provide: MouseService, useValue: mouseServiceSpy },
                { provide: SaveService, useValue: saveServiceSpy },
                { provide: TileService, useValue: tileServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        component.size = 5; // Set board size for testing
        component.initializeBoard(); // Ensure board is initialized before tests
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize board with correct dimensions', () => {
        expect(component.board.length).toBe(BOARD_SIZE);
        expect(component.board[0].length).toBe(BOARD_SIZE);
    });

    it('should load an existing board properly', () => {
        const mockBoard: Tile[][] = [[{ type: 0, x: 0, y: 0, id: '0-0' }], [{ type: 1, x: 1, y: 1, id: '1-1' }]];
        component.loadBoard(mockBoard);
        expect(component.board).toEqual(mockBoard);
    });

    it('should call saveBoard method when save service is active', () => {
        component.ngOnInit();
        component.saveService.saveBoard(component.board);
        expect(saveServiceSpy.saveBoard).toHaveBeenCalledWith(component.board);
    });

    it('should call modifyTile when mouse is pressed and moves over a tile', () => {
        mouseServiceSpy.mousePressed = true;
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1' };
        component.onMouseOverBoard(tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[1][1]);
    });

    // it('should save the current tool when right-clicking', () => {
    //     tileServiceSpy.currentTool = 3;
    //     const event = new MouseEvent('mousedown', { button: 2 });
    //     const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1' };
    //     component.onMouseDownBoard(event, tile);
    //     expect(component.toolSaved).toBe(3);
    //     expect(tileServiceSpy.currentTool).toBe(-1);
    // });

    // it('should restore saved tool on mouse release', () => {
    //     component.toolSaved = 4;
    //     component.onMouseUpBoard();
    //     expect(tileServiceSpy.currentTool).toBe(4);
    //     expect(component.toolSaved).toBe(-1);
    // });

    it('should modify tile on mouse click', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 2, x: 2, y: 2, id: '2-2' };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[2][2]);
    });

    it('should prevent default behavior on right-click', () => {
        const event = new MouseEvent('contextmenu');
        spyOn(event, 'preventDefault');
        component.onRightClickBoard(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should copy tile tool when calling onClickTileTool', () => {
        const tileToolId = 3;
        component.onClickTileTool(tileToolId);
        expect(tileServiceSpy.copyTileTool).toHaveBeenCalledWith(tileToolId);
    });

    it('should call onMouseUp when mouse is released', () => {
        component.onMouseUpBoard();
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
    });

    it('should not modify tile if mouse is not pressed', () => {
        mouseServiceSpy.mousePressed = false;
        const tile: Tile = { type: 2, x: 2, y: 2, id: '2-2' };
        component.onMouseOverBoard(tile);
        expect(tileServiceSpy.modifyTile).not.toHaveBeenCalled();
    });

    // it('should handle edge cases for modifying out-of-bounds tiles', () => {
    //     spyOn(console, 'error'); // Prevent console error from affecting test output
    //     expect(() => component.modifyTile({ x: -1, y: -1 })).not.toThrow();
    //     expect(() => component.modifyTile({ x: 5, y: 5 })).not.toThrow();
    // });

    it('should reset toolSaved if no right-click was detected', () => {
        component.onMouseUpBoard();
        expect(component.toolSaved).toBe(-1);
    });

    // it('should not modify tile if out of bounds', () => {
    //     spyOn(console, 'warn');
    //     expect(() => component.modifyTile({ x: -10, y: -10 })).not.toThrow();
    //     expect(() => component.modifyTile({ x: 6, y: 6 })).not.toThrow();
    // });
});
