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

        const tile: Tile = { type: TileTypes.DoorClosed, x: 2, y: 2, id: '2-2' };
        service.modifyTile(tile);

        expect(tile.type).toEqual(TileTypes.DoorOpen);

        service.modifyTile(tile);

        expect(tile.type).toEqual(TileTypes.DoorClosed);
    });

    it('should set tile type to the copied tool if it is not a door', () => {

        const tile: Tile = { type: TileTypes.Wall, x: 3, y: 3, id: '3-3' };
        service.modifyTile(tile);

    });
});
