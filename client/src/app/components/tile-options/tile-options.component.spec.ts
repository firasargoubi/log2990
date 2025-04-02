/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TileOptionsComponent } from './tile-options.component';
import { TileService } from '@app/services/tile.service';
import { TileTypes } from '@common/game.interface';

describe('TileOptionsComponent', () => {
    let component: TileOptionsComponent;
    let fixture: ComponentFixture<TileOptionsComponent>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;

    beforeEach(async () => {
        tileServiceSpy = jasmine.createSpyObj('TileService', ['copyTileTool']);

        await TestBed.configureTestingModule({
            imports: [TileOptionsComponent],
            providers: [{ provide: TileService, useValue: tileServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(TileOptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize tile options in ngOnInit', () => {
        component = fixture.componentInstance;

        component.options = [];

        component.ngOnInit();

        expect(component.options.length).toBe(4);

        expect(component.options[0].type).toBe(TileTypes.Water);
        expect(component.options[0].x).toBe(TileTypes.Water);
        expect(component.options[0].id).toBe(`${TileTypes.Water}`);
    });

    it('should not include TileTypes.DoorOpen in options', () => {
        expect(component.options.some((tile) => tile.type === TileTypes.DoorOpen)).toBeFalse();
    });

    it('should select a tile option and set all others unselected', () => {
        const tile = component.options[2];

        component.selectTileOption(tile);

        expect(tileServiceSpy.copyTileTool).toHaveBeenCalledWith(tile.type);

        component.options.forEach((t) => {
            if (t.id === tile.id) {
                expect(t.selected).toBeTrue();
            } else {
                expect(t.selected).toBeFalse();
            }
        });
    });

    it('should deselect all tiles when selecting an already selected tile', () => {
        const tile = component.options[1];

        component.selectTileOption(tile);
        expect(tile.selected).toBeTrue();

        component.selectTileOption(tile);

        component.options.forEach((t) => {
            expect(t.selected).toBeFalse();
        });

        expect(tileServiceSpy.copyTileTool).toHaveBeenCalledWith(-1);
    });

    it('should call copyTileTool with correct tile type when selecting a tile', () => {
        const tile = component.options[3];

        component.selectTileOption(tile);

        expect(tileServiceSpy.copyTileTool).toHaveBeenCalledWith(tile.type);
    });

    it('should handle empty options list', () => {
        component.options = [];

        expect(component.tiles.length).toBe(0);
    });
});
