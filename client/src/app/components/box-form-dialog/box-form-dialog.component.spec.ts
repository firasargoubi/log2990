import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GameService } from '@app/services/game.service';
import { throwError, of } from 'rxjs';
import { BoxFormDialogComponent } from './box-form-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { Game } from '@app/interfaces/game.model';
import { NotificationService } from '@app/services/notification.service';

const TIME = 5000;
const DEFAULT_STAT_VALUE = 4;
const INCREASED_ATTRIBUTE = 6;
const SIX_VALUE_DICE = 6;
const FOUR_VALUE_DICE = 4;

describe('BoxFormDialogComponent', () => {
    let component: BoxFormDialogComponent;
    let fixture: ComponentFixture<BoxFormDialogComponent>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;
    let mockGameService: jasmine.SpyObj<GameService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;

    beforeEach(async () => {
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockGameService = jasmine.createSpyObj('GameService', ['fetchVisibleGames']);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['showError']);

        mockGameService.fetchVisibleGames.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, BoxFormDialogComponent],
            providers: [
                provideHttpClientTesting(),
                { provide: MatDialogRef, useValue: mockDialogRef },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        boxId: '1',
                        game: { id: '1', name: 'Game1', isVisible: true },
                        gameList: [],
                    },
                },
                { provide: GameService, useValue: mockGameService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BoxFormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the form with default values', () => {
        expect(component.form.value).toEqual({
            name: 'New Player',
            avatar: 'assets/avatar/1.jpg',
            life: DEFAULT_STAT_VALUE,
            speed: DEFAULT_STAT_VALUE,
            attack: DEFAULT_STAT_VALUE,
            defense: DEFAULT_STAT_VALUE,
        });
    });

    it('should update form validity when name is empty', () => {
        component.form.get('name')?.setValue('');
        expect(component.form.valid).toBeFalse();
    });

    it('should close the dialog with form values when valid', () => {
        component.closeDialog();
        expect(mockDialogRef.close).toHaveBeenCalledWith(component.form.value);
    });

    it('should not close the dialog when form is invalid', () => {
        component.form.get('name')?.setValue('');
        component.closeDialog();
        expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should reset attributes correctly', () => {
        component.form.patchValue({ life: 10, speed: 10, attack: 10, defense: 10, name: 'New Player' });
        component.resetAttributes();
        expect(component.form.value).toEqual({
            life: DEFAULT_STAT_VALUE,
            speed: DEFAULT_STAT_VALUE,
            attack: DEFAULT_STAT_VALUE,
            defense: DEFAULT_STAT_VALUE,
            name: 'New Player',
            avatar: 'assets/avatar/1.jpg',
        });
    });

    it('should increase attribute only once', () => {
        component.increase('attack');
        expect(component.form.value.attack).toBe(INCREASED_ATTRIBUTE);
        component.increase('attack');
        expect(component.form.value.attack).toBe(INCREASED_ATTRIBUTE);
    });

    it('should pick dice correctly', () => {
        component.pickDice('attack');
        expect(component.form.value.attack).toBe(SIX_VALUE_DICE);
        expect(component.form.value.defense).toBe(FOUR_VALUE_DICE);
    });

    it('should start polling for game updates and stop on destroy', fakeAsync(() => {
        const mockGames: Game[] = [
            {
                id: '1',
                name: 'Test Game',
                isVisible: false,
                board: [],
                mapSize: 'medium',
                mode: 'classic',
                previewImage: 'path/to/image.jpg',
                description: 'Test game description',
                lastModified: new Date(),
                objects: [],
            },
        ];
        mockGameService.fetchVisibleGames.and.returnValue(of(mockGames));

        component.ngOnInit();
        tick(TIME);

        expect(component.gameList.length).toBe(1);
        component.ngOnDestroy();
        expect(mockGameService.fetchVisibleGames).toHaveBeenCalled();
    }));

    it('should handle polling error', fakeAsync(() => {
        mockGameService.fetchVisibleGames.and.returnValue(throwError(() => new Error('Fetch failed')));

        component.ngOnInit();
        tick(TIME);

        expect(mockNotificationService.showError).toHaveBeenCalledWith('Erreur lors du rafraîchissement des jeux');
    }));

    it('should select avatar correctly', () => {
        const avatar = 'assets/perso/2.jpg';
        component.selectAvatar(avatar);
        expect(component.form.get('avatar')?.value).toBe(avatar);
    });

    it('should input name correctly', () => {
        const event = { target: { value: 'New Game Name' } } as unknown as Event;
        component.inputName(event);
        expect(component.form.get('name')?.value).toBe('New Game Name');
    });

    it('should cancel the dialog', () => {
        component.cancel();
        expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });

    it('should navigate to /waiting when linkRoute is called and name is not "New Player"', async () => {
        const routerSpy = spyOn(component['router'], 'navigate');
        component.form.get('name')?.setValue('Player1');
        await component.linkRoute();
        expect(routerSpy).toHaveBeenCalledWith(['/waiting']);
    });

    it('should not navigate to /waiting when linkRoute is called and name is "New Player"', async () => {
        const routerSpy = spyOn(component['router'], 'navigate');
        component.form.get('name')?.setValue('New Player');
        await component.linkRoute();
        expect(routerSpy).not.toHaveBeenCalled();
    });

    it('should unsubscribe from polling on destroy', () => {
        const unsubscribeSpy = spyOn(component['pollingSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should save form to localStorage and navigate when form is valid', async () => {
        component.gameList = [
            {
                id: '1',
                name: 'Test Game',
                isVisible: true,
                board: [],
                mapSize: 'medium',
                mode: 'classic',
                previewImage: 'path/to/image.jpg',
                description: 'Test game description',
                lastModified: new Date(),
                objects: [],
            },
        ];
        spyOn(localStorage, 'setItem');
        spyOn(component, 'linkRoute').and.callThrough();
        await component.save();
        expect(localStorage.setItem).toHaveBeenCalledWith('form', JSON.stringify(component.form.value));
        expect(component.linkRoute).toHaveBeenCalled();
    });
});
