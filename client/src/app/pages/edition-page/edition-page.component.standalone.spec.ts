/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-classes-per-file */
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, provideRouter, Routes } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { EDITION_PAGE_CONSTANTS } from '@app/consts/app-constants';
import { BoardService } from '@app/services/board.service';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { ImageService } from '@app/services/image.service';
import { NotificationService } from '@app/services/notification.service';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { SaveService } from '@app/services/save.service';
import { ValidationService } from '@app/services/validation.service';
import { Game, GameSize, GameType } from '@common/game.interface';
import { of, Subject, throwError } from 'rxjs';
import { EditionPageComponent } from './edition-page.component';

const routes: Routes = [];

@Component({
    selector: 'app-board',
    standalone: true,
    template: '',
})
class MockBoardComponent {
    @Input() game: Game;
}

@Component({
    selector: 'app-tile-options',
    standalone: true,
    template: '',
})
class MockTileOptionsComponent {}

@Component({
    selector: 'app-objects',
    standalone: true,
    template: '',
})
class MockObjectsComponent {
    @Input() mapSize: string;
}

describe('EditionPageComponent Standalone', () => {
    let component: EditionPageComponent;
    let fixture: ComponentFixture<EditionPageComponent>;
    let saveServiceSpy: jasmine.SpyObj<SaveService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let imageServiceSpy: jasmine.SpyObj<ImageService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let objectCounterServiceSpy: jasmine.SpyObj<ObjectCounterService>;
    let validationServiceSpy: jasmine.SpyObj<ValidationService>;
    let boardServiceSpy: jasmine.SpyObj<BoardService>;

    const mockGame: Game = {
        id: '123',
        name: 'Test Game',
        mapSize: GameSize.small,
        mode: GameType.Classic,
        previewImage: '',
        description: 'Test description',
        lastModified: new Date(),
        isVisible: true,
        board: Array(10).fill(Array(10).fill(0)),
        objects: [],
    };

    beforeEach(async () => {
        boardServiceSpy = jasmine.createSpyObj('BoardService', ['initializeBoard']);
        saveServiceSpy = jasmine.createSpyObj('SaveService', ['alertBoardForReset', 'alertBoardForVerification', 'saveGame', 'getGameNames'], {
            isSave$: new Subject<boolean>(),
            isReset$: of(false),
            currentStatus: {},
        });

        errorServiceSpy = jasmine.createSpyObj('ErrorService', ['addMessage'], {
            message$: new Subject<string>(),
        });

        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGameById']);
        gameServiceSpy.fetchGameById.and.returnValue(of(mockGame));

        imageServiceSpy = jasmine.createSpyObj('ImageService', ['captureBoardFromTiles']);
        imageServiceSpy.captureBoardFromTiles.and.returnValue(Promise.resolve('data:image/png;base64,test'));

        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
        objectCounterServiceSpy = jasmine.createSpyObj('ObjectCounterService', ['initializeCounter']);

        validationServiceSpy = jasmine.createSpyObj('ValidationService', ['validateGame']);

        await TestBed.configureTestingModule({
            imports: [FormsModule, EditionPageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: { id: '123' },
                            queryParams: { mode: 'normal', size: 'small' },
                        },
                    },
                },
                { provide: SaveService, useValue: saveServiceSpy },
                { provide: ErrorService, useValue: errorServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: ImageService, useValue: imageServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: ObjectCounterService, useValue: objectCounterServiceSpy },
                { provide: ValidationService, useValue: validationServiceSpy },
                { provide: BoardService, useValue: boardServiceSpy },
                provideRouter(routes),
            ],
        }).compileComponents();

        TestBed.overrideComponent(EditionPageComponent, {
            add: { imports: [MockBoardComponent] },
            remove: { imports: [BoardComponent] },
        });

        TestBed.overrideComponent(EditionPageComponent, {
            add: { imports: [MockTileOptionsComponent] },
            remove: { imports: [TileOptionsComponent] },
        });

        TestBed.overrideComponent(EditionPageComponent, {
            add: { imports: [MockObjectsComponent] },
            remove: { imports: [ObjectsComponent] },
        });

        fixture = TestBed.createComponent(EditionPageComponent);
        component = fixture.debugElement.componentInstance;
        component.gameNames = ['Existing Game'];
        fixture.detectChanges();
    });

    it('should create the component without dependencies', () => {
        expect(component).toBeTruthy();
    });

    it('should close popup and reset state', () => {
        component.errorMessage = 'Test error';
        component.showErrorPopup = true;
        component.saveState = true;

        component.closePopup();

        expect(component.errorMessage).toBe('');
        expect(component.showErrorPopup).toBeFalse();
        expect(component.saveState).toBeFalse();
    });

    it('should initialize counter when loading game', () => {
        component.loadGame();
        expect(objectCounterServiceSpy.initializeCounter).toHaveBeenCalledWith(component.objectNumber);
    });

    it('should return correct mapSize number', () => {
        component.game.mapSize = GameSize.small;
        expect(component.mapSize).toBe(10);

        component.game.mapSize = GameSize.medium;
        expect(component.mapSize).toBe(15);

        component.game.mapSize = GameSize.large;
        expect(component.mapSize).toBe(20);
    });

    it('should return small map size when mapSize is invalid', () => {
        component.game.mapSize = 'invalid' as GameSize;
        expect(component.mapSize).toBe(10);
    });

    it('should return correct objectNumber based on mapSize', () => {
        component.game.mapSize = GameSize.small;
        expect(component.objectNumber).toBe(2);

        component.game.mapSize = GameSize.medium;
        expect(component.objectNumber).toBe(4);

        component.game.mapSize = GameSize.large;
        expect(component.objectNumber).toBe(6);
    });

    it('should initialize empty game when no id is provided', () => {
        component.game.id = '';
        component.loadGame();
        expect(component.game.name).toBe('');
        expect(component.game.description).toBe('');
        expect(component.gameLoaded).toBeTrue();
        expect(objectCounterServiceSpy.initializeCounter).toHaveBeenCalledWith(component.objectNumber);
    });

    it('should call gameservice to find the game if id is provided', () => {
        component.game.id = '123';
        component.loadGame();
        expect(gameServiceSpy.fetchGameById).toHaveBeenCalledWith('123');
        expect(component.gameLoaded).toBeTrue();
    });

    it('should show error notification when loading game fails', () => {
        const errorMessage = 'Error';
        gameServiceSpy.fetchGameById.and.returnValue(throwError(() => new Error(errorMessage)));

        component.game.id = '123';
        component.loadGame();

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorGameLoad);
        expect(component.gameLoaded).toBeTrue();
    });

    it('should handle error message subscription', () => {
        component.ngOnInit();
        (errorServiceSpy.message$ as Subject<string>).next('');
        expect(component.showErrorPopup).toBeTrue();
    });

    it('should validate game name is required', async () => {
        component.game.name = '';
        validationServiceSpy.validateGame.and.callFake(() => {
            errorServiceSpy.addMessage(EDITION_PAGE_CONSTANTS.errorGameNameRequired);
            return false;
        });

        await component.saveBoard();

        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorGameNameRequired);
    });

    it('should validate game description is required', async () => {
        component.game.description = '';
        validationServiceSpy.validateGame.and.callFake(() => {
            errorServiceSpy.addMessage(EDITION_PAGE_CONSTANTS.errorGameDescriptionRequired);
            return false;
        });

        await component.saveBoard();

        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorGameDescriptionRequired);
    });

    it('should validate game name is unique', async () => {
        component.game.name = 'Existing Game';
        validationServiceSpy.validateGame.and.callFake(() => {
            errorServiceSpy.addMessage(EDITION_PAGE_CONSTANTS.errorGameNameExists);
            return false;
        });

        await component.saveBoard();

        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorGameNameExists);
    });

    it('should validate board has valid doors', async () => {
        saveServiceSpy.currentStatus = { doors: false };
        validationServiceSpy.validateGame.and.callFake(() => {
            saveServiceSpy.alertBoardForVerification(true);
            errorServiceSpy.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidDoors);
            return false;
        });

        await component.saveBoard();

        expect(saveServiceSpy.alertBoardForVerification).toHaveBeenCalledWith(true);
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorInvalidDoors);
    });

    it('should validate board has valid spawn points', async () => {
        saveServiceSpy.currentStatus = { allSpawnPoints: false };
        validationServiceSpy.validateGame.and.callFake(() => {
            errorServiceSpy.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidSpawns);
            return false;
        });

        await component.saveBoard();

        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorInvalidSpawns);
    });

    it('should validate board is accessible', async () => {
        saveServiceSpy.currentStatus = { accessible: false };
        validationServiceSpy.validateGame.and.callFake(() => {
            errorServiceSpy.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidAccess);
            return false;
        });

        await component.saveBoard();

        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorInvalidAccess);
    });

    it('should validate board has minimum terrain tiles', async () => {
        saveServiceSpy.currentStatus = { minTerrain: false };
        validationServiceSpy.validateGame.and.callFake(() => {
            errorServiceSpy.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidMinTiles);
            return false;
        });

        await component.saveBoard();

        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith(EDITION_PAGE_CONSTANTS.errorInvalidMinTiles);
    });

    it('should not save if validation errors exist (showErrorPopup is true)', async () => {
        component.showErrorPopup = true;

        await component.saveBoard();

        expect(imageServiceSpy.captureBoardFromTiles).not.toHaveBeenCalled();
        expect(saveServiceSpy.saveGame).not.toHaveBeenCalled();
    });

    it('should prepare and save game data when validation passes', async () => {
        validationServiceSpy.validateGame.and.returnValue(true);
        component.showErrorPopup = false;
        component.game = mockGame;

        saveServiceSpy.currentStatus = {
            doors: true,
            minTerrain: true,
            accessible: true,
            allSpawnPoints: true,
        };

        imageServiceSpy.captureBoardFromTiles.and.returnValue(Promise.resolve('data:image/png;base64,mockImage'));

        await component.saveBoard();

        expect(imageServiceSpy.captureBoardFromTiles).toHaveBeenCalled();
        expect(saveServiceSpy.saveGame).toHaveBeenCalled();
        expect(component.saveState).toBeTrue();
    });

    it('should show error notification when saving fails', async () => {
        validationServiceSpy.validateGame.and.returnValue(true);
        component.showErrorPopup = false;
        component.game = mockGame;

        const error = new Error('Test Error');
        imageServiceSpy.captureBoardFromTiles.and.returnValue(Promise.reject(error));

        await component.saveBoard();

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Error saving game: ' + error.message);
    });
    it('should reset the game to reference and alert board reset', () => {
        const initialGame = { ...component.game };
        component.game.name = 'Modified Name';
        component.gameReference = initialGame;

        component.resetBoard();

        expect(component.game).toEqual(initialGame);
        expect(component['boardService'].initializeBoard).toHaveBeenCalledWith(initialGame, component.mapSize);
        expect(saveServiceSpy.alertBoardForReset).toHaveBeenCalledWith(true);
    });
});
