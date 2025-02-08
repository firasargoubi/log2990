import { TestBed } from '@angular/core/testing';
import { SaveService } from './save.service';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tileTypes';
import { GameService } from '@app/services/game.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SaveService', () => {
    let service: SaveService;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        // Mock de GameService
        gameServiceSpy = jasmine.createSpyObj('GameService', ['createGame', 'updateGame']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule], // ✅ Ajout de HttpClientTestingModule
            providers: [{ provide: GameService, useValue: gameServiceSpy }], // ✅ Mock GameService
        });

        service = TestBed.inject(SaveService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true for a board with correctly placed doors', () => {
        const board: Tile[][] = [
            [
                { type: TileTypes.Grass, x: 0, y: 0, id: '1' },
                { type: TileTypes.Grass, x: 0, y: 1, id: '2' },
                { type: TileTypes.Grass, x: 0, y: 2, id: '3' },
            ],
            [
                { type: TileTypes.Wall, x: 1, y: 0, id: '4' },
                { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5' },
                { type: TileTypes.Wall, x: 1, y: 2, id: '6' },
            ],
            [
                { type: TileTypes.Grass, x: 2, y: 0, id: '7' },
                { type: TileTypes.Grass, x: 2, y: 1, id: '8' },
                { type: TileTypes.Grass, x: 2, y: 2, id: '9' },
            ],
        ];

        service.board = board; // ✅ Correction : assigner avant appel
        expect(service.verifyDoors()).toBe(true);
    });

    it('should return false for a door on the edge of the board', () => {
        const board: Tile[][] = [
            [
                { type: TileTypes.DoorClosed, x: 0, y: 0, id: '1' },
                { type: TileTypes.Grass, x: 0, y: 1, id: '2' },
                { type: TileTypes.Grass, x: 0, y: 2, id: '3' },
            ],
            [
                { type: TileTypes.Wall, x: 1, y: 0, id: '4' },
                { type: TileTypes.Grass, x: 1, y: 1, id: '5' },
                { type: TileTypes.Wall, x: 1, y: 2, id: '6' },
            ],
            [
                { type: TileTypes.Grass, x: 2, y: 0, id: '7' },
                { type: TileTypes.Grass, x: 2, y: 1, id: '8' },
                { type: TileTypes.Grass, x: 2, y: 2, id: '9' },
            ],
        ];

        service.board = board;
        expect(service.verifyDoors()).toBe(false);
    });

    it('should return false for a door not properly connected to walls', () => {
        const board: Tile[][] = [
            [
                { type: TileTypes.Grass, x: 0, y: 0, id: '1' },
                { type: TileTypes.Grass, x: 0, y: 1, id: '2' },
                { type: TileTypes.Grass, x: 0, y: 2, id: '3' },
            ],
            [
                { type: TileTypes.Grass, x: 1, y: 0, id: '4' },
                { type: TileTypes.DoorClosed, x: 1, y: 1, id: '5' },
                { type: TileTypes.Grass, x: 1, y: 2, id: '6' },
            ],
            [
                { type: TileTypes.Grass, x: 2, y: 0, id: '7' },
                { type: TileTypes.Grass, x: 2, y: 1, id: '8' },
                { type: TileTypes.Grass, x: 2, y: 2, id: '9' },
            ],
        ];

        service.board = board;
        expect(service.verifyDoors()).toBe(false);
    });

    it('should emit true when alertBoardForVerification is called', (done) => {
        service.isSave$.subscribe((value) => {
            expect(value).toBe(true);
            done(); // ✅ Vérifie que l'observable a bien émis
        });

        service.alertBoardForVerification(true);
    });

    it('should emit false when alertBoardForVerification is called with false', (done) => {
        service.isSave$.subscribe((value) => {
            expect(value).toBe(false);
            done();
        });

        service.alertBoardForVerification(false);
    });

    it('should emit true when alertBoardForReset is called', (done) => {
        service.isReset$.subscribe((value) => {
            expect(value).toBe(true);
            done();
        });

        service.alertBoardForReset(true);
    });

    it('should emit false when alertBoardForReset is called with false', (done) => {
        service.isReset$.subscribe((value) => {
            expect(value).toBe(false);
            done();
        });

        service.alertBoardForReset(false);
    });
});
