import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TileOptionsComponent } from './tile-options.component';
import { TileService } from '@app/services/tile.service';
import { TileTypes } from '@app/interfaces/tile-types';

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

    it('should initialize tile options', () => {
        component.initializeOptions();

        const EXPECTED_TILE_OPTIONS = component.options.length;
        expect(component.options.length).toBe(EXPECTED_TILE_OPTIONS);

        expect(component.options[0].type).toBe(TileTypes.Water);
        expect(component.options[0].x).toBe(TileTypes.Water);
        expect(component.options[0].id).toBe(`${TileTypes.Water}`);
    });

    it('should call initializeOptions on ngOnInit', () => {
        spyOn(component, 'initializeOptions').and.callThrough();

        component.ngOnInit();

        expect(component.initializeOptions).toHaveBeenCalled();
    });
    it('should not include TileTypes.DoorOpen in options', () => {
        component.initializeOptions();

        expect(component.options.some((tile) => tile.type === TileTypes.DoorOpen)).toBeFalse();
    });

    it('should select a tile option and set all others unselected', () => {
        component.initializeOptions();
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

    it('should set all tiles as unselected when called', () => {
        component.initializeOptions();

        component.options[0].selected = true;
        component.options[2].selected = true;

        component.setAllTilesUnselected();

        component.options.forEach((tile) => {
            expect(tile.selected).toBeFalse();
        });
    });

    it('should deselect tile if it is already selected', () => {
        component.initializeOptions();
        const tile = component.options[1];
        tile.selected = true;

        component.selectTileOption(tile);

        expect(tileServiceSpy.copyTileTool).toHaveBeenCalledWith(0);
        component.options.forEach((t) => {
            expect(t.selected).toBeFalse();
        });
    });
    it('should call copyTileTool with correct tile type when selecting a tile', () => {
        component.initializeOptions();
        const tile = component.options[3];

        component.selectTileOption(tile);

        expect(tileServiceSpy.copyTileTool).toHaveBeenCalledWith(tile.type);
    });
    it('should handle empty options list', () => {
        component.options = [];

        expect(component.tiles.length).toBe(0);
    });
});
