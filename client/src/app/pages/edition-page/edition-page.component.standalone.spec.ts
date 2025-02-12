/* eslint-disable max-classes-per-file */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { EditionPageComponent } from './edition-page.component';
import { Game } from '@app/interfaces/game.model';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { SaveService } from '@app/services/save.service';
import { NotificationService } from '@app/services/notification.service';
import { ImageService } from '@app/services/image.service';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { BoardComponent } from '@app/components/board/board.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
//import { EDITION_PAGE_CONSTANTS } from '@app/Consts/app.constants';

// Mock Components

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

    const mockGame: Game = {
        id: '123',
        name: 'Test Game',
        mapSize: 'small',
        mode: 'normal',
        previewImage: '',
        description: 'Test description',
        lastModified: new Date(),
        isVisible: true,
        board: Array(10).fill(Array(10).fill(0)),
        objects: [],
    };

    beforeEach(async () => {
        // Create spy objects
        saveServiceSpy = jasmine.createSpyObj('SaveService', ['alertBoardForVerification', 'saveGame'], {
            isSave$: new Subject<boolean>(),
            isReset$: of(false),
            currentStatus: {},
        });

        errorServiceSpy = jasmine.createSpyObj('ErrorService', ['addMessage'], {
            message$: new Subject<string>(),
        });

        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGameById']);
        gameServiceSpy.fetchGameById.and.returnValue(of(mockGame));

        imageServiceSpy = jasmine.createSpyObj('ImageService', ['captureComponent']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
        objectCounterServiceSpy = jasmine.createSpyObj('ObjectCounterService', ['initializeCounter']);

        await TestBed.configureTestingModule({
            imports: [FormsModule, RouterTestingModule, EditionPageComponent],
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
            ],
        }).compileComponents();

        // Replace real components with mocks
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
        fixture.detectChanges();
    });

    it('should create the component without dependencies', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with correct route params', () => {
        component.ngOnInit();
        expect(component.game.id).toBe('123');
        expect(component.game.mode).toBe('normal');
        expect(component.game.mapSize).toBe('small');
    });

    it('should load game on init', () => {
        expect(gameServiceSpy.fetchGameById).toHaveBeenCalledWith('123');
        expect(component.game).toEqual(mockGame);
        expect(component.gameLoaded).toBeTrue();
        expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Jeu chargé avec succès.');
    });

    it('should handle unsuccessful game load', async () => {
        gameServiceSpy.fetchGameById.and.returnValue(throwError(() => new Error('Failed to load game')));
        component.loadGame();
        fixture.detectChanges();
        await fixture.whenStable();
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

    it('should handle unsuccessful game load', () => {
        gameServiceSpy.fetchGameById.and.returnValue(throwError(() => new Error('Failed to load game')));
        component.loadGame();
        expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Impossible de charger le jeu.');
        expect(component.gameLoaded).toBeTrue();
    });

    it('should initialize counter when loading game', () => {
        component.loadGame();
        expect(objectCounterServiceSpy.initializeCounter).toHaveBeenCalledWith(component.objectNumber);
    });

    it('should return correct mapSize number', () => {
        component.game.mapSize = 'small';
        expect(component.mapSize).toBe(10);

        component.game.mapSize = 'medium';
        expect(component.mapSize).toBe(15);

        component.game.mapSize = 'large';
        expect(component.mapSize).toBe(20);

        component.game.mapSize = 'invalid';
        expect(component.mapSize).toBe(10);
    });

    it('should return correct objectNumber based on mapSize', () => {
        component.game.mapSize = 'small';
        expect(component.objectNumber).toBe(2);

        component.game.mapSize = 'medium';
        expect(component.objectNumber).toBe(4);

        component.game.mapSize = 'large';
        expect(component.objectNumber).toBe(6);

        component.game.mapSize = 'invalid';
        expect(component.objectNumber).toBe(2);
    });

    it('should initialize empty game when no id is provided', () => {
        component.game.id = '';
        component.loadGame();
        expect(component.game.name).toBe('');
        expect(component.game.description).toBe('');
        expect(component.gameLoaded).toBeTrue();
        expect(objectCounterServiceSpy.initializeCounter).toHaveBeenCalledWith(component.objectNumber);
    });

    it('should handle successful save board', async () => {
        component.game.name = 'Test Game';
        component.game.description = 'Test Description';
        imageServiceSpy.captureComponent.and.returnValue(Promise.resolve('base64image'));
        await component.saveBoard();

        expect(saveServiceSpy.alertBoardForVerification).toHaveBeenCalledWith(true);
        expect(imageServiceSpy.captureComponent).toHaveBeenCalled();
        expect(saveServiceSpy.saveGame).toHaveBeenCalledWith(component.game);
        expect(component.saveState).toBeTrue();
        expect(errorServiceSpy.addMessage).toHaveBeenCalledWith('Game saved successfully.\n');
    });

    it('should handle error message subscription', () => {
        const errorMessage = new Subject<string>();
        const testMessage = "test";
        errorServiceSpy.message$ = errorMessage;
        component.ngOnInit();
        errorMessage.next(testMessage);
    });
});
