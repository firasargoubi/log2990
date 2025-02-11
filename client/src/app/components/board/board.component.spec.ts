import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardComponent } from './board.component';
import { MouseService } from '@app/services/mouse.service';
import { SaveService } from '@app/services/save.service';
import { TileService } from '@app/services/tile.service';
import { GameService } from '@app/services/game.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Tile } from '@app/interfaces/tile';

describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let saveServiceSpy: jasmine.SpyObj<SaveService>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;  // ✅ Ajout du mock de GameService
    const BOARD_SIZE = 5;

    beforeEach(async () => {
        // Mock des services
        mouseServiceSpy = jasmine.createSpyObj('MouseService', ['onMouseUp', 'onMouseDown', 'onMouseMove', 'onMouseLeave']);
        saveServiceSpy = jasmine.createSpyObj('SaveService', ['saveBoard'], { isActive$: of(true) });
        tileServiceSpy = jasmine.createSpyObj('TileService', ['modifyTile', 'copyTileTool'], { currentTool: -1 });
        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGames', 'updateGame']); // ✅ Mock GameService

        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],  // ✅ Ajout de HttpClientTestingModule
            providers: [
                { provide: MouseService, useValue: mouseServiceSpy },
                { provide: SaveService, useValue: saveServiceSpy },
                { provide: TileService, useValue: tileServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },  // ✅ Mock GameService
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        component.initializeBoard();
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

    it('should call saveGame method when save service is active', () => {
        component.ngOnInit();
        component.saveService.saveGame(component.game);
        expect(saveServiceSpy.saveGame).toHaveBeenCalledWith(component.game);
    });

    it('should call modifyTile when mouse is pressed and moves over a tile', () => {
        mouseServiceSpy.mousePressed = true;
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1' };
        component.onMouseOverBoard(tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(component.board[1][1]);
    });

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

    it('should reset toolSaved if no right-click was detected', () => {
        component.onMouseUpBoard();
        expect(component.toolSaved).toBe(-1);
    });
});
