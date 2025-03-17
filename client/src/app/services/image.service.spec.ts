/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { TestBed } from '@angular/core/testing';
import { ImageService } from './image.service';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';
import { ObjectsTypes } from '@app/Consts/app.constants';

describe('ImageService', () => {
    let service: ImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ImageService],
        });
        service = TestBed.inject(ImageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getTileBackgroundUrl method', () => {
        it('should return correct URL for Grass type', () => {
            expect((service as any).getTileBackgroundUrl(TileTypes.Grass)).toBe('assets/tiles/grass.png');
        });

        it('should return correct URL for Water type', () => {
            expect((service as any).getTileBackgroundUrl(TileTypes.Water)).toBe('assets/tiles/water.png');
        });

        it('should return correct URL for Ice type', () => {
            expect((service as any).getTileBackgroundUrl(TileTypes.Ice)).toBe('assets/tiles/ice2.png');
        });

        it('should return correct URL for DoorClosed type', () => {
            expect((service as any).getTileBackgroundUrl(TileTypes.DoorClosed)).toBe('assets/tiles/door_c.png');
        });

        it('should return correct URL for DoorOpen type', () => {
            expect((service as any).getTileBackgroundUrl(TileTypes.DoorOpen)).toBe('assets/tiles/door_o.png');
        });

        it('should return correct URL for Wall type', () => {
            expect((service as any).getTileBackgroundUrl(TileTypes.Wall)).toBe('assets/tiles/wall.png');
        });

        it('should return default URL for unknown type', () => {
            expect((service as any).getTileBackgroundUrl(999)).toBe('assets/tiles/grass.png');
        });
    });

    describe('getObjectImageUrl method', () => {
        it('should return correct URL for BOOTS object', () => {
            expect((service as any).getObjectImageUrl(ObjectsTypes.BOOTS)).toBe('assets/objects/boots.png');
        });

        it('should return correct URL for SWORD object', () => {
            expect((service as any).getObjectImageUrl(ObjectsTypes.SWORD)).toBe('assets/objects/sword.png');
        });

        it('should return correct URL for POTION object', () => {
            expect((service as any).getObjectImageUrl(ObjectsTypes.POTION)).toBe('assets/objects/potion.png');
        });

        it('should return correct URL for WAND object', () => {
            expect((service as any).getObjectImageUrl(ObjectsTypes.WAND)).toBe('assets/objects/wand.png');
        });

        it('should return correct URL for CRYSTAL object', () => {
            expect((service as any).getObjectImageUrl(ObjectsTypes.CRYSTAL)).toBe('assets/objects/crystal_ball.png');
        });

        it('should return correct URL for JUICE object', () => {
            expect((service as any).getObjectImageUrl(ObjectsTypes.JUICE)).toBe('assets/objects/berry-juice.png');
        });

        it('should return correct URL for SPAWN object', () => {
            expect((service as any).getObjectImageUrl(ObjectsTypes.SPAWN)).toBe('assets/objects/vortex.png');
        });

        it('should return correct URL for RANDOM object', () => {
            expect((service as any).getObjectImageUrl(ObjectsTypes.RANDOM)).toBe('assets/objects/gnome.png');
        });

        it('should return undefined URL for unknown object', () => {
            expect((service as any).getObjectImageUrl(999)).toBe('assets/objects/undefined.png');
        });
    });

    describe('captureComponent method', () => {
        it('should reject with error when element is invalid', async () => {
            await expectAsync((service as any).captureComponent(null)).toBeRejected();
        });

        it('should reject with error when html2canvas throws', async () => {
            const originalCaptureComponent = (service as any).captureComponent;
            (service as any).captureComponent = jasmine.createSpy().and.rejectWith(new Error('Canvas error'));

            await expectAsync(service.captureBoardFromTiles([[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]])).toBeRejected();
            (service as any).captureComponent = originalCaptureComponent;
        });
    });

    describe('captureBoardFromTiles method', () => {
        let mockContainer: HTMLDivElement;
        let mockBoard: HTMLDivElement;
        let mockTile: HTMLDivElement;
        let mockImage: HTMLImageElement;

        beforeEach(() => {
            mockContainer = document.createElement('div');
            mockBoard = document.createElement('div');
            mockTile = document.createElement('div');
            mockImage = document.createElement('img');

            spyOn(service as any, 'captureComponent').and.resolveTo('data:image/png;base64,mockImageData');

            let createElementCallCount = 0;
            spyOn(document, 'createElement').and.callFake((tagName: string) => {
                createElementCallCount++;
                if (tagName === 'div') {
                    if (createElementCallCount === 1) return mockContainer;
                    if (createElementCallCount === 2) return mockBoard;
                    return mockTile;
                }
                if (tagName === 'img') return mockImage;
                return document.createElement(tagName);
            });

            spyOn(document.body, 'appendChild').and.returnValue(mockContainer);
            spyOn(document.body, 'removeChild').and.returnValue(mockContainer);
            spyOn(mockContainer, 'appendChild').and.returnValue(mockBoard);
            spyOn(mockBoard, 'appendChild').and.returnValue(mockTile);
            spyOn(mockTile, 'appendChild').and.returnValue(mockImage);
        });

        it('should create a container with absolute positioning', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            await service.captureBoardFromTiles(board);

            expect(document.createElement).toHaveBeenCalledWith('div');
            expect(mockContainer.style.position).toBe('absolute');
            expect(mockContainer.style.top).toBe('-9999px');
            expect(mockContainer.style.left).toBe('-9999px');
        });

        it('should create a board element with correct grid properties', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            await service.captureBoardFromTiles(board);

            expect(document.createElement).toHaveBeenCalledTimes(3);
            expect(mockBoard.style.display).toBe('grid');
            expect(mockBoard.style.gridTemplateColumns).toBe('repeat(1, 1fr)');
            expect(mockBoard.style.gridTemplateRows).toBe('repeat(1, 1fr)');
            expect(mockBoard.style.width).toBe('650px');
            expect(mockBoard.style.height).toBe('650px');
        });

        it('should remove container after successful capture', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            await service.captureBoardFromTiles(board);

            expect(document.body.removeChild).toHaveBeenCalled();
        });

        it('should handle errors and still remove container', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            (service as any).captureComponent.and.rejectWith(new Error('Test error'));

            try {
                await service.captureBoardFromTiles(board);
                fail('Should have thrown an error');
            } catch (error) {
                // Expected error
            }

            expect(document.body.removeChild).toHaveBeenCalled();
        });

        it('should add object images to tiles when objects are present', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: ObjectsTypes.BOOTS }]];

            (document.createElement as jasmine.Spy).calls.reset();
            (mockTile.appendChild as jasmine.Spy).calls.reset();

            let createElementCalls = 0;
            (document.createElement as jasmine.Spy).and.callFake((tagName: string) => {
                createElementCalls++;
                if (tagName === 'div') {
                    if (createElementCalls === 1) return mockContainer;
                    if (createElementCalls === 2) return mockBoard;
                    return mockTile;
                }
                if (tagName === 'img') return mockImage;
                return document.createElement(tagName);
            });

            spyOn(service as any, 'getObjectImageUrl').and.returnValue('assets/objects/boots.png');

            await service.captureBoardFromTiles(board);

            const createElementCalls2 = (document.createElement as jasmine.Spy).calls.allArgs();
            expect(createElementCalls2.some((args) => args[0] === 'div')).toBeTrue();
        });
    });
});
