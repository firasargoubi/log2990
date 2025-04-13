/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { EDITION_PAGE_CONSTANTS } from '@app/consts/app-constants';
import { Game, GameSize, GameType } from '@common/game.interface';
import { ErrorService } from './error.service';
import { SaveService } from './save.service';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
    let service: ValidationService;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let saveServiceSpy: jasmine.SpyObj<SaveService>;

    const mockGame: Game = {
        id: '1',
        name: 'Test Game',
        mapSize: GameSize.Small,
        mode: GameType.Classic,
        previewImage: '',
        description: 'Test description',
        lastModified: new Date(),
        isVisible: true,
        board: [],
        objects: [],
    };
    const mockCtfGame: Game = {
        id: '2',
        name: 'Test CTF Game',
        mapSize: GameSize.Small,
        mode: GameType.Capture,
        previewImage: '',
        description: 'Test description',
        lastModified: new Date(),
        isVisible: true,
        board: [],
        objects: [],
    };

    beforeEach(() => {
        errorServiceSpy = jasmine.createSpyObj('ErrorService', ['addMessage']);
        saveServiceSpy = jasmine.createSpyObj('SaveService', ['alertBoardForVerification'], {
            currentStatus: {
                doors: true,
                accessible: true,
                minTerrain: true,
                allSpawnPoints: true,
            },
        });

        TestBed.configureTestingModule({
            providers: [ValidationService, { provide: ErrorService, useValue: errorServiceSpy }, { provide: SaveService, useValue: saveServiceSpy }],
        });
        service = TestBed.inject(ValidationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should validate a valid game', () => {
        const gameNames: string[] = ['Other Game'];

        const result = service.validateGame(mockGame, gameNames);

        expect(result).toBeTrue();
        expect(saveServiceSpy.alertBoardForVerification).toHaveBeenCalledWith(true);
        expect(errorServiceSpy.addMessage).not.toHaveBeenCalled();
    });

    it('should invalidate game with empty name', () => {
        const gameNames: string[] = ['Other Game'];
        const invalidGame = { ...mockGame, name: '' };

        const result = service.validateGame(invalidGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorGameNameRequired);
    });

    it('should invalidate game with whitespace-only name', () => {
        const gameNames: string[] = ['Other Game'];
        const invalidGame = { ...mockGame, name: '   ' };

        const result = service.validateGame(invalidGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorGameNameRequired);
    });

    it('should invalidate game with empty description', () => {
        const gameNames: string[] = ['Other Game'];
        const invalidGame = { ...mockGame, description: '' };

        const result = service.validateGame(invalidGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorGameDescriptionRequired);
    });

    it('should invalidate game with duplicate name', () => {
        const gameNames: string[] = ['Test Game', 'Other Game'];

        const result = service.validateGame(mockGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorGameNameExists);
    });

    it('should invalidate game with invalid doors', () => {
        const gameNames: string[] = ['Other Game'];
        saveServiceSpy.currentStatus.doors = false;

        const result = service.validateGame(mockGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorInvalidDoors);
    });

    it('should invalidate game with missing spawn points', () => {
        const gameNames: string[] = ['Other Game'];
        saveServiceSpy.currentStatus.allSpawnPoints = false;

        const result = service.validateGame(mockGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorInvalidSpawns);
    });

    it('should invalidate game with inaccessible areas', () => {
        const gameNames: string[] = ['Other Game'];
        saveServiceSpy.currentStatus.accessible = false;

        const result = service.validateGame(mockGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorInvalidAccess);
    });

    it('should invalidate game with insufficient terrain tiles', () => {
        const gameNames: string[] = ['Other Game'];
        saveServiceSpy.currentStatus.minTerrain = false;

        const result = service.validateGame(mockGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorInvalidMinTiles);
    });

    it('should invalidate ctf game with missing flag', () => {
        const gameNames: string[] = ['Other Game'];
        saveServiceSpy.currentStatus.ctfPlaced = false;

        const result = service.validateGame(mockCtfGame, gameNames);

        expect(result).toBeFalse();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.missingFlag);
    });
});
