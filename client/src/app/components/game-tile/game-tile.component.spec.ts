import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/Consts/item-constants';
import { DEFAULT_TILE_IMAGE, TILE_IMAGES } from '@app/Consts/tile-constants';
import { ObjectsTypes, TileTypes } from '@common/game.interface';
import { Tile } from '@common/tile';
import { GameTileComponent } from './game-tile.component';

describe('GameTileComponent', () => {
    let component: GameTileComponent;
    let fixture: ComponentFixture<GameTileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameTileComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameTileComponent);
        component = fixture.componentInstance;

        component.tile = {
            type: TileTypes.Grass,
            object: 0,
            x: 0,
            y: 0,
            id: '0-0',
        };

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('getTileImage()', () => {
        it('should return image from TILE_IMAGES for known tile', () => {
            component.tile = { ...component.tile, type: TileTypes.Water };
            expect(component.getTileImage()).toBe(TILE_IMAGES[TileTypes.Water]);
        });

        it('should return DEFAULT_TILE_IMAGE for unknown tile', () => {
            component.tile = { ...component.tile, type: 999 };
            expect(component.getTileImage()).toBe(DEFAULT_TILE_IMAGE);
        });

        it('should return DEFAULT_TILE_IMAGE if tile is undefined', () => {
            component.tile = undefined as unknown as Tile;
            expect(component.getTileImage()).toBe(DEFAULT_TILE_IMAGE);
        });
    });

    describe('getObjectImage()', () => {
        it('should return correct object image for known object', () => {
            component.tile = { ...component.tile, object: ObjectsTypes.BOOTS };
            expect(component.getObjectImage()).toBe(ITEM_INFOS[ObjectsTypes.BOOTS].image);
        });

        it('should return UNKNOWN_ITEM.image for unknown object', () => {
            component.tile = { ...component.tile, object: 999 };
            expect(component.getObjectImage()).toBe(UNKNOWN_ITEM.image);
        });

        it('should return null when tile is undefined', () => {
            component.tile = undefined as unknown as Tile;
            expect(component.getObjectImage()).toBeNull();
        });

        it('should return null when tile has no object', () => {
            component.tile = { ...component.tile, object: 0 };
            expect(component.getObjectImage()).toBeNull();
        });
    });

    describe('getObjectDescription()', () => {
        it('should return correct description for known object', () => {
            component.tile = { ...component.tile, object: ObjectsTypes.SWORD };
            expect(component.getObjectDescription()).toBe(ITEM_INFOS[ObjectsTypes.SWORD].description);
        });

        it('should return UNKNOWN_ITEM.description for unknown object', () => {
            component.tile = { ...component.tile, object: 999 };
            expect(component.getObjectDescription()).toBe(UNKNOWN_ITEM.description);
        });
    });

    describe('onClick()', () => {
        it('should emit tileClick event with current tile', () => {
            const spy = spyOn(component.tileClick, 'emit');
            component.onClick();
            expect(spy).toHaveBeenCalledWith(component.tile);
        });
    });
});
