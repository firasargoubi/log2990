import { TestBed } from '@angular/core/testing';
import { SaveService } from './save.service';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tileTypes';

describe('SaveService', () => {
    let service: SaveService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SaveService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true for a board with correctly placed doors', () => {
        const board: Tile[][] = [
            [{ type: TileTypes.Grass, x: 0, y: 0, id: '1' }, { type: TileTypes.Grass, x: 0, y: 1, id: '2' }, { type: TileTypes.Grass, x: 0, y: 2, id: '3' }],
            [{ type: TileTypes.Wall, x: 1, y: 0, id: '4' }, { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5' }, { type: TileTypes.Wall, x: 1, y: 2, id: '6' }],
            [{ type: TileTypes.Grass, x: 2, y: 0, id: '7' }, { type: TileTypes.Grass, x: 2, y: 1, id: '8' }, { type: TileTypes.Grass, x: 2, y: 2, id: '9' }]
        ];
        
        expect(service.verifyDoors(board)).toBe(true);
    });

    it('should return false for a door on the edge of the board', () => {
        const board: Tile[][] = [
            [{ type: TileTypes.DoorClosed, x: 0, y: 0, id: '1' }, { type: TileTypes.Grass, x: 0, y: 1, id: '2' }, { type: TileTypes.Grass, x: 0, y: 2, id: '3' }],
            [{ type: TileTypes.Wall, x: 1, y: 0, id: '4' }, { type: TileTypes.Grass, x: 1, y: 1, id: '5' }, { type: TileTypes.Wall, x: 1, y: 2, id: '6' }],
            [{ type: TileTypes.Grass, x: 2, y: 0, id: '7' }, { type: TileTypes.Grass, x: 2, y: 1, id: '8' }, { type: TileTypes.Grass, x: 2, y: 2, id: '9' }]
        ];
        expect(service.verifyDoors(board)).toBe(false);
    });

    it('should return false for a door not properly connected to walls', () => {
        const board: Tile[][] = [
            [{ type: TileTypes.Grass, x: 0, y: 0, id: '1' }, { type: TileTypes.Grass, x: 0, y: 1, id: '2' }, { type: TileTypes.Grass, x: 0, y: 2, id: '3' }],
            [{ type: TileTypes.Grass, x: 1, y: 0, id: '4' }, { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5' }, { type: TileTypes.Grass, x: 1, y: 2, id: '6' }],
            [{ type: TileTypes.Grass, x: 2, y: 0, id: '7' }, { type: TileTypes.Grass, x: 2, y: 1, id: '8' }, { type: TileTypes.Grass, x: 2, y: 2, id: '9' }]
        ];
        expect(service.verifyDoors(board)).toBe(false);
    });

    it('should toggle saveActive state', (done) => {
        service.isActive$.subscribe(value => {
            expect(value).toBe(true);
            done();
        });
        service.setActive(true);
    });
});
