import { TestBed } from '@angular/core/testing';
import { TileService } from './tile.service';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';

describe('TileService', () => {
    let service: TileService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [TileService] });
        service = TestBed.inject(TileService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should toggle door state when modifying a door tile', () => {
        service.copyTileTool(TileTypes.DoorClosed);

        const tile: Tile = { type: TileTypes.DoorClosed, x: 2, y: 2, id: '2-2', object: 0 };
        service.modifyTile(tile);

        expect(tile.type).toEqual(TileTypes.DoorOpen);

        service.modifyTile(tile);

        expect(tile.type).toEqual(TileTypes.DoorClosed);
    });

    it('should set tile type to the copied tool if it is not a door', () => {
        const tile: Tile = { type: TileTypes.Wall, x: 3, y: 3, id: '3-3', object: 0 };
        service.modifyTile(tile);
    });

    it('should modify tile type when current tool is valid non-door type', () => {
        service.copyTileTool(TileTypes.Wall);

        const tile: Tile = {
            type: TileTypes.Grass,
            x: 5,
            y: 5,
            id: '5-5',
            object: 0,
        };

        service.modifyTile(tile);

        expect(tile.type).toEqual(TileTypes.Wall);
    });

    it('should copy the tile tool', () => {
        service.copyTileTool(TileTypes.Wall);
        expect(service.currentTool).toEqual(TileTypes.Wall);
    });
    it('should not modify tile if the tile has an object', () => {
        service.copyTileTool(TileTypes.Wall);

        const tile: Tile = { type: TileTypes.Wall, x: 1, y: 1, id: '1-1', object: 1 };
        const originalTile = { ...tile };

        service.modifyTile(tile);

        expect(tile).toEqual(originalTile);
    });

    it('should not modify tile with object when current tool is Wall', () => {
        service.copyTileTool(TileTypes.Wall);

        const tile: Tile = { type: TileTypes.Wall, x: 4, y: 4, id: '4-4', object: 1 };
        const originalTile = { ...tile };

        service.modifyTile(tile);

        expect(tile).toEqual(originalTile);
    });

    it('should not modify tile if tile has an object (not door)', () => {
        service.copyTileTool(TileTypes.DoorClosed);

        const tile: Tile = { type: TileTypes.Wall, x: 2, y: 2, id: '2-2', object: 1 };
        const originalTile = { ...tile };

        service.modifyTile(tile);

        expect(tile).toEqual(originalTile);
    });

    it('should modify currentTool if it has a tool saved', () => {
        service.currentTool = 1;
        service.saveTool();
        service.currentTool = 0;
        service.getToolSaved();

        expect(service.currentTool).toEqual(1);
    });

    it('should not modify currentTool if it has a tool saved', () => {
        service.currentTool = 0;
        service.saveTool();
        service.currentTool = 1;
        service.getToolSaved();

        expect(service.currentTool).toEqual(1);
    });
    describe('Tool Management', () => {
        it('should handle multiple tool save and restore operations', () => {
            service.currentTool = TileTypes.Water;
            service.saveTool();

            service.currentTool = TileTypes.Wall;
            service.getToolSaved();

            expect(service.currentTool).toBe(TileTypes.Water);
        });

        it('should reset tool completely', () => {
            service.currentTool = TileTypes.Water;
            service.saveTool();
            service.resetTool();

            expect(service.currentTool).toBe(-1);
            expect(service.toolSaved).toBe(0);
        });

        it('should delete tool setting it to 0', () => {
            service.currentTool = TileTypes.Water;
            service.deleteTool();

            expect(service.currentTool).toBe(0);
        });
    });

    describe('Tile Modification Edge Cases', () => {
        it('should not modify tile with an object when tool is not door', () => {
            const tile: Tile = {
                type: TileTypes.Grass,
                x: 1,
                y: 1,
                id: '1-1',
                object: 1,
            };
            const originalTile = { ...tile };

            service.currentTool = TileTypes.Wall;
            service.modifyTile(tile);

            expect(tile).toEqual(originalTile);
        });

        it('should allow door state toggle for door tiles without objects', () => {
            const tile: Tile = {
                type: TileTypes.DoorClosed,
                x: 1,
                y: 1,
                id: '1-1',
                object: 0,
            };

            service.currentTool = TileTypes.DoorClosed;
            service.modifyTile(tile);

            expect(tile.type).toBe(TileTypes.DoorOpen);

            service.modifyTile(tile);

            expect(tile.type).toBe(TileTypes.DoorClosed);
        });

        it('should not toggle door state if tile has an object', () => {
            const tile: Tile = {
                type: TileTypes.DoorClosed,
                x: 1,
                y: 1,
                id: '1-1',
                object: 1,
            };
            const originalTile = { ...tile };

            service.currentTool = TileTypes.DoorClosed;
            service.modifyTile(tile);

            expect(tile).toEqual(originalTile);
        });

        it('should ignore tool operations when currentTool is -1', () => {
            const tile: Tile = {
                type: TileTypes.Grass,
                x: 1,
                y: 1,
                id: '1-1',
                object: 0,
            };
            const originalTile = { ...tile };

            service.currentTool = -1;
            service.modifyTile(tile);

            expect(tile).toEqual(originalTile);
        });
    });
});
