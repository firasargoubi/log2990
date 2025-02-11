import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TileOptionsComponent } from './tile-options.component';
import { TileService } from '@app/services/tile.service';

describe('TileOptionsComponent', () => {
    let component: TileOptionsComponent;
    let fixture: ComponentFixture<TileOptionsComponent>;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    const MAX_TILE_OPTIONS = 5;

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
        expect(component.options.length).toBe(MAX_TILE_OPTIONS); // Since MAX_TILE is 6 (1 to 5)
        expect(component.options[0]).toEqual({ type: 1, x: 1, y: 0, id: '1', object: 0 });
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

    it('should set all tiles as unselected', () => {
        component.initializeOptions();
        component.options.forEach((tile) => (tile.selected = true));

        component.setAllTilesUnselected();

        component.options.forEach((tile) => {
            expect(tile.selected).toBeFalse();
        });
    });
});
