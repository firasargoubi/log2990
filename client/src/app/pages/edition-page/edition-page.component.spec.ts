import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { EditionPageComponent } from './edition-page.component';
import { ActivatedRoute, provideRouter, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { SaveService } from '@app/services/save.service';
import { NotificationService } from '@app/services/notification.service';
import { ImageService } from '@app/services/image.service';
import { ObjectCounterService } from '@app/services/objects-counter.service';

const routes: Routes = [];

describe('EditionPageComponent', () => {
    let component: EditionPageComponent;
    let fixture: ComponentFixture<EditionPageComponent>;

    beforeEach(waitForAsync(() => {
        const saveServiceSpy = jasmine.createSpyObj('SaveService', ['alertBoardForVerification', 'saveGame', 'getGameNames'], {
            isSave$: new Subject<boolean>(),
            isReset$: of(false),
            currentStatus: {},
        });

        const errorServiceSpy = jasmine.createSpyObj('ErrorService', ['addMessage'], {
            message$: new Subject<string>(),
        });

        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGameById']);
        const imageServiceSpy = jasmine.createSpyObj('ImageService', ['captureComponent']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
        const objectCounterServiceSpy = jasmine.createSpyObj('ObjectCounterService', ['initializeCounter']);

        TestBed.configureTestingModule({
            imports: [FormsModule, EditionPageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: { id: '123' },
                            queryParams: { mode: 'normal', size: 'large' },
                        },
                    },
                },
                { provide: SaveService, useValue: saveServiceSpy },
                { provide: ErrorService, useValue: errorServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: ImageService, useValue: imageServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: ObjectCounterService, useValue: objectCounterServiceSpy },
                provideRouter(routes),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditionPageComponent);
        component = fixture.componentInstance;
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
