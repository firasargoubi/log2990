import { TestBed } from '@angular/core/testing';
import { TileService } from './tile.service';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tileTypes';

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
        service.toolSaved = 1;

        service.getToolSaved();

        expect(service.toolSaved).toEqual(0);
        expect(service.currentTool).toEqual(1);
    });

    it('should not modify currentTool if it has a tool saved', () => {
        service.toolSaved = 0;
        service.currentTool = 1;

        service.getToolSaved();

        expect(service.toolSaved).toEqual(0);
        expect(service.currentTool).toEqual(1);
    });
});
