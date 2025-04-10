/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/consts/item-constants';
import { DEFAULT_TILE_IMAGE, TILE_IMAGES } from '@app/consts/tile-constants';
import { TileTypes } from '@common/game.interface';
import { Tile } from '@common/tile';
import { ImageService } from './image.service';

describe('ImageService', () => {
    let service: ImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ImageService],
        });
        service = TestBed.inject(ImageService);
    });

    describe('getTileBackgroundUrl', () => {
        it('should return the correct tile image from TILE_IMAGES', () => {
            Object.entries(TILE_IMAGES).forEach(([type, image]) => {
                expect((service as any).getTileBackgroundUrl(Number(type))).toBe(image);
            });
        });

        it('should return DEFAULT_TILE_IMAGE for unknown type', () => {
            expect((service as any).getTileBackgroundUrl(999)).toBe(DEFAULT_TILE_IMAGE);
        });
    });

    describe('getObjectImageUrl', () => {
        it('should return the correct object image from ITEM_INFOS', () => {
            Object.entries(ITEM_INFOS).forEach(([type, info]) => {
                expect((service as any).getObjectImageUrl(Number(type))).toBe(info.image);
            });
        });

        it('should return UNKNOWN_ITEM image for unknown object', () => {
            expect((service as any).getObjectImageUrl(999)).toBe(UNKNOWN_ITEM.image);
        });
    });

    describe('captureComponent', () => {
        it('should reject when element is null', async () => {
            await expectAsync(service.captureComponent(null as any)).toBeRejectedWith('Invalid HTML element');
        });
    });

    describe('captureBoardFromTiles', () => {
        let captureSpy: jasmine.Spy;

        beforeEach(() => {
            captureSpy = spyOn(service as any, 'captureComponent').and.resolveTo('data:image');
        });

        it('should call captureComponent with generated board element', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            await service.captureBoardFromTiles(board);

            expect(captureSpy).toHaveBeenCalledTimes(1);
        });

        it('should use UNKNOWN_ITEM image for unknown object', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 999 }]];
            const getObjectSpy = spyOn<any>(service, 'getObjectImageUrl').and.callThrough();

            await service.captureBoardFromTiles(board);

            expect(getObjectSpy).toHaveBeenCalledWith(999);
        });

        it('should throw and clean up on error', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Water, x: 0, y: 0, id: '0-0', object: 0 }]];
            captureSpy.and.rejectWith('Capture failed');

            await expectAsync(service.captureBoardFromTiles(board)).toBeRejectedWith('Capture failed');
        });
    });
});
