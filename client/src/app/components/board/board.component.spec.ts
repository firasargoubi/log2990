/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TileComponent } from '@app/components/tile/tile.component';
import { MapSize } from '@app/consts/app-constants';
import { BoardService } from '@app/services/board.service';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { MouseService } from '@app/services/mouse.service';
import { SaveService } from '@app/services/save.service';
import { TileService } from '@app/services/tile.service';
import { Coordinates } from '@common/coordinates';
import { GameSize } from '@common/game.interface';
import { Tile } from '@common/tile';
import { of, Subject } from 'rxjs';
import { BoardComponent } from './board.component';

@Component({
    selector: 'app-tile',
    template: '',
    standalone: true,
})
class MockTileComponent {
    @Input() tile: Tile;
}
const MAP_SIZE = 10;
describe('BoardComponent', () => {
    let component: BoardComponent;
    let fixture: ComponentFixture<BoardComponent>;
    let mouseServiceSpy: jasmine.SpyObj<MouseService>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let saveServiceSpy: jasmine.SpyObj<SaveService>;
    let boardServiceSpy: jasmine.SpyObj<BoardService>;

    beforeEach(async () => {
        mouseServiceSpy = jasmine.createSpyObj('MouseService', ['onMouseUp', 'onMouseDown', 'onMouseMove']);
        tileServiceSpy = jasmine.createSpyObj('TileService', ['modifyTile', 'copyTileTool', 'getToolSaved', 'resetTool', 'deleteTool', 'saveTool'], {
            currentTool: -1,
            toolSaved: -1,
            tileChanged$: of(null),
        });
        saveServiceSpy = jasmine.createSpyObj('SaveService', ['verifyBoard'], {
            isSave$: new Subject<boolean>(),
            isReset$: of(false),
        });
        boardServiceSpy = jasmine.createSpyObj(
            'BoardService',
            ['initializeBoard', 'loadBoard', 'deleteObject', 'notifyBoardChange', 'notifyBoardUpdate', 'getMapSize'],
            {
                board: Array.from({ length: MAP_SIZE }, (_, i) =>
                    Array.from({ length: MAP_SIZE }, (index, j) => ({
                        type: 0,
                        object: 0,
                        x: i,
                        y: j,
                        id: `${i}-${j}`,
                    })),
                ),
                objectHeld: false,
                boardChanged$: of(null),
                boardUpdated$: of(null),
            },
        );

        await TestBed.configureTestingModule({
            imports: [BoardComponent, CommonModule, FormsModule],
            providers: [
                provideHttpClientTesting(),
                { provide: MouseService, useValue: mouseServiceSpy },
                { provide: TileService, useValue: tileServiceSpy },
                { provide: SaveService, useValue: saveServiceSpy },
                { provide: ErrorService, useValue: jasmine.createSpyObj('ErrorService', ['handleError']) },
                { provide: GameService, useValue: jasmine.createSpyObj('GameService', ['fetchGames']) },
                { provide: BoardService, useValue: boardServiceSpy },
            ],
        })
            .overrideComponent(BoardComponent, {
                remove: { imports: [TileComponent] },
                add: { imports: [MockTileComponent] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(BoardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get map size', () => {
        boardServiceSpy.getMapSize.and.returnValue(MAP_SIZE);
        expect(component.mapSize).toBe(MAP_SIZE);
    });

    it('should get tiles', () => {
        expect(component.tiles).toEqual(boardServiceSpy.board);
    });

    it('should initialize board', () => {
        component.initializeBoard();
        expect(boardServiceSpy.initializeBoard).toHaveBeenCalledWith(component.game, component.mapSize);
    });

    it('should load board', () => {
        const mockBoard: Tile[][] = [[{ type: 1, object: 0, x: 0, y: 0, id: '0-0' }]];
        component.loadBoard(mockBoard);
        expect(boardServiceSpy.loadBoard).toHaveBeenCalledWith(mockBoard);
    });

    it('should handle mouse up on board', () => {
        component.onMouseUpBoard();
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
        expect(boardServiceSpy.objectHeld).toBeFalse();
        expect(tileServiceSpy.getToolSaved).toHaveBeenCalled();
    });

    it('should handle mouse over board with mouse pressed', () => {
        mouseServiceSpy.mousePressed = true;
        boardServiceSpy.objectHeld = false;
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 0 };
        component.onMouseOverBoard(tile);
        expect(mouseServiceSpy.onMouseMove).toHaveBeenCalledWith({ x: 1, y: 1 });
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(boardServiceSpy.board[1][1]);
    });

    it('should handle mouse down with right click and object', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        const tile: Tile = { type: 1, x: 0, y: 0, id: '0-0', object: 1 };
        component.onMouseDownBoard(event, tile);
        expect(boardServiceSpy.deleteObject).toHaveBeenCalledWith(tile);
    });

    it('should handle mouse down with right click without object', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        const tile: Tile = { type: 1, x: 0, y: 0, id: '0-0', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.saveTool).toHaveBeenCalled();
        expect(tileServiceSpy.deleteTool).toHaveBeenCalled();
    });

    it('should handle mouse down with left click and object', () => {
        let objectHeldValue = false;
        Object.defineProperty(boardServiceSpy, 'objectHeld', {
            get: () => objectHeldValue,
            set: (value: boolean) => {
                objectHeldValue = value;
            },
        });

        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 0, y: 0, id: '0-0', object: 1 };

        component.onMouseDownBoard(event, tile);

        expect(objectHeldValue).toBeTrue();
    });

    it('should handle mouse down with left click without object', () => {
        const event = new MouseEvent('mousedown', { button: 0 });
        const tile: Tile = { type: 1, x: 0, y: 0, id: '0-0', object: 0 };
        component.onMouseDownBoard(event, tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(boardServiceSpy.board[0][0]);
    });

    it('should delete object', () => {
        const tile: Tile = { type: 1, x: 0, y: 0, id: '0-0', object: 1 };
        component.deleteObject(tile);
        expect(boardServiceSpy.deleteObject).toHaveBeenCalledWith(tile);
    });

    it('should handle mouse leave board', () => {
        component.onMouseLeaveBoard();
        expect(mouseServiceSpy.onMouseUp).toHaveBeenCalled();
    });

    it('should handle object changed', () => {
        const tile: Tile = { type: 0, object: 0, x: 0, y: 0, id: '0-0' };
        component.onObjectChanged(3, tile);
        expect(tile.object).toBe(3);
        expect(boardServiceSpy.notifyBoardChange).toHaveBeenCalled();
    });

    it('should modify tile', () => {
        const tile: Coordinates = { x: 0, y: 0 };
        component.modifyTile(tile);
        expect(tileServiceSpy.modifyTile).toHaveBeenCalledWith(boardServiceSpy.board[0][0]);
        expect(boardServiceSpy.notifyBoardChange).toHaveBeenCalled();
    });

    it('should handle right click on board', () => {
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
        component.game.mapSize = GameSize.Small;

        boardServiceSpy.getMapSize.and.returnValue(MapSize.SMALL);

        expect(component.mapSize).toBe(MapSize.SMALL);
        expect(boardServiceSpy.getMapSize).toHaveBeenCalledWith(GameSize.Small);
    });

    it('should return the correct map size for medium', () => {
        component.game.mapSize = GameSize.Medium;

        boardServiceSpy.getMapSize.and.returnValue(MapSize.MEDIUM);

        expect(component.mapSize).toBe(MapSize.MEDIUM);
        expect(boardServiceSpy.getMapSize).toHaveBeenCalledWith(GameSize.Medium);
    });

    it('should return the correct map size for large', () => {
        component.game.mapSize = GameSize.Large;

        boardServiceSpy.getMapSize.and.returnValue(MapSize.LARGE);

        expect(component.mapSize).toBe(MapSize.LARGE);
        expect(boardServiceSpy.getMapSize).toHaveBeenCalledWith(GameSize.Large);
    });

    it('should return the default map size for an unknown size', () => {
        component.game.mapSize = '' as any;

        boardServiceSpy.getMapSize.and.returnValue(MapSize.SMALL);

        expect(component.mapSize).toBe(MapSize.SMALL);
        expect(boardServiceSpy.getMapSize).toHaveBeenCalledWith('');
    });

    it('should subscribe to isSave$ observable in constructor', () => {
        (saveServiceSpy.isSave$ as Subject<boolean>).next(true);
        expect(saveServiceSpy.verifyBoard).toHaveBeenCalledWith(boardServiceSpy.board);
        expect(boardServiceSpy.notifyBoardUpdate).toHaveBeenCalled();
    });

    it('should delete object on right-click if tile has an object', () => {
        const event = new MouseEvent('mousedown', { button: 2 });
        const tile: Tile = { type: 1, x: 1, y: 1, id: '1-1', object: 1 };
        component.onMouseDownBoard(event, tile);
        expect(boardServiceSpy.deleteObject).toHaveBeenCalledWith(tile);
    });
});
