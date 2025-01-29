import { TestBed } from '@angular/core/testing';

import { TileService } from './tile.service';

describe('TileService', () => {
    let service: TileService;
    let tileType: number;
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [TileService] });
        service = TestBed.inject(TileService);
        tileType = 2;
    });

    it('should copy the type of a tile and save its value', () => {
        service.copyTileTool(tileType);

        expect(service.currentTool).toEqual(tileType);
    });
});
