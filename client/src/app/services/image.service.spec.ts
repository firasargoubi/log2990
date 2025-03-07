/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ImageService } from './image.service';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';
import { ObjectsTypes } from '@app/Consts/app.constants';

describe('ImageService Test', () => {
    let service: ImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ImageService],
            teardown: { destroyAfterEach: false },
        });
        service = TestBed.inject(ImageService);
    });

    describe('Board Capture Detailed Tests', () => {
        let containerSpy: jasmine.Spy;
        let documentBodyRemoveSpy: jasmine.Spy;

        beforeEach(() => {
            containerSpy = spyOn(document, 'createElement').and.callThrough();
            documentBodyRemoveSpy = spyOn(document.body, 'removeChild').and.callThrough();
        });

        it('should create a temporary container with correct positioning', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            await service.captureBoardFromTiles(board);

            expect(containerSpy).toHaveBeenCalledWith('div');
            const container = containerSpy.calls.first().returnValue;
            expect(container.style.position).toBe('absolute');
            expect(container.style.top).toBe('-9999px');
            expect(container.style.left).toBe('-9999px');
        });

        it('should create board element with correct grid properties', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            await service.captureBoardFromTiles(board);

            const boardElements = document.body.getElementsByTagName('div');
            const boardElement = Array.from(boardElements).find(
                (el) =>
                    el.style.display === 'grid' &&
                    el.style.gridTemplateColumns === `repeat(${board.length}, 1fr)` &&
                    el.style.gridTemplateRows === `repeat(${board.length}, 1fr)`,
            );

            expect(boardElement).toBeTruthy();
            expect(boardElement!.style.width).toBe('650px');
            expect(boardElement!.style.height).toBe('650px');
            expect(boardElement!.style.backgroundColor).toBe('rgb(204, 204, 204)');
        });

        it('should add tiles with correct background and object images', async () => {
            const board: Tile[][] = [
                [
                    { type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: ObjectsTypes.BOOTS },
                    { type: TileTypes.Water, x: 0, y: 1, id: '0-1', object: 0 },
                ],
            ];

            await service.captureBoardFromTiles(board);

            const boardElements = document.body.getElementsByTagName('div');
            const boardElement = Array.from(boardElements).find((el) => el.style.display === 'grid');

            expect(boardElement!.children.length).toBe(board.length * board[0].length);

            const firstTile = boardElement!.children[0] as HTMLElement;
            expect(firstTile.style.backgroundImage).toContain('assets/tiles/grass.png');

            const objectImage = firstTile.querySelector('img');
            expect(objectImage).toBeTruthy();
            expect(objectImage!.src).toContain('assets/objects/boots.png');
        });

        it('should remove container after capturing', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            await service.captureBoardFromTiles(board);

            expect(documentBodyRemoveSpy).toHaveBeenCalled();
        });

        it('should handle errors by removing container', async () => {
            const board: Tile[][] = [[{ type: TileTypes.Grass, x: 0, y: 0, id: '0-0', object: 0 }]];

            spyOn(service as any, 'captureComponent').and.returnValue(Promise.reject(new Error('Capture failed')));

            await expectAsync(service.captureBoardFromTiles(board)).toBeRejectedWithError('Capture failed');

            expect(documentBodyRemoveSpy).toHaveBeenCalled();
        });
    });

    describe('Tile and Object Image URL Generation', () => {
        it('should generate correct image URLs for various tile types', () => {
            const urlGenerationTests = [
                { type: TileTypes.Grass, expected: 'assets/tiles/grass.png' },
                { type: TileTypes.Water, expected: 'assets/tiles/water.png' },
                { type: TileTypes.Ice, expected: 'assets/tiles/ice2.png' },
                { type: TileTypes.DoorClosed, expected: 'assets/tiles/door_c.png' },
                { type: TileTypes.DoorOpen, expected: 'assets/tiles/door_o.png' },
                { type: TileTypes.Wall, expected: 'assets/tiles/wall.png' },
                { type: 999, expected: 'assets/tiles/grass.png' },
            ];

            urlGenerationTests.forEach(({ type, expected }) => {
                const url = (service as any).getTileBackgroundUrl(type);
                expect(url).toBe(expected);
            });
        });

        it('should generate correct URLs for object types', () => {
            const urlGenerationTests = [
                { type: 0, expected: 'assets/objects/boots.png' },
                { type: 1, expected: 'assets/objects/sword.png' },
                { type: 2, expected: 'assets/objects/potion.png' },
                { type: 3, expected: 'assets/objects/wand.png' },
                { type: 4, expected: 'assets/objects/crystal_ball.png' },
                { type: 5, expected: 'assets/objects/berry-juice.png' },
                { type: 6, expected: 'assets/objects/vortex.png' },
                { type: 7, expected: 'assets/objects/gnome.png' },
                { type: 999, expected: 'assets/objects/undefined.png' },
            ];

            urlGenerationTests.forEach(({ type, expected }) => {
                const url = (service as any).getObjectImageUrl(type);
                expect(url).toBe(expected);
            });
        });
    });
});
