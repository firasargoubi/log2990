import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GameService } from '@app/services/game.service';
import { throwError, of } from 'rxjs';
import { BoxFormDialogComponent } from './box-form-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { Game, GameSize, GameType } from '@common/game.interface';
import { NotificationService } from '@app/services/notification.service';
import { CREATE_PAGE_CONSTANTS } from '@app/Consts/app.constants';

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
    it('should not save form when it is invalid', async () => {
        spyOn(localStorage, 'setItem');
        spyOn(component, 'linkRoute');

        component.form.get('name')?.setValue(''); // Make form invalid

        await component.save();

        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(component.linkRoute).not.toHaveBeenCalled();
    });

    it('should close the dialog with form values when valid', () => {
        component.closeDialog();
        expect(mockDialogRef.close).toHaveBeenCalledWith(component.form.value);
    });
    it('should return true if game exists in gameList', () => {
        component.gameList = [{ id: '1', name: 'Game1', isVisible: true }] as Game[];
        expect(component.gameExists).toBeTrue();
    });

    it('should return false if game does not exist in gameList', () => {
        component.gameList = [{ id: '2', name: 'Game2', isVisible: true }] as Game[];
        expect(component.gameExists).toBeFalse();
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

    it('should save form to localStorage and navigate when form is valid', async () => {
        component.gameList = [
            {
                id: '1',
                name: 'Test Game',
                isVisible: true,
                board: [],
                mapSize: GameSize.medium,
                mode: GameType.classic,
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
    it('should call showError when game loading fails', () => {
        mockGameService.fetchVisibleGames.and.returnValue(throwError(() => new Error('Fetch failed')));

        component['loadGames']();

        expect(mockNotificationService.showError).toHaveBeenCalledWith(CREATE_PAGE_CONSTANTS.errorLoadingGames);
    });
    it('should set attack to 6 and defense to 4 when pickDice is called on attack', () => {
        component.pickDice('attack');
        expect(component.form.value.attack).toBe(SIX_VALUE_DICE);
        expect(component.form.value.defense).toBe(DEFAULT_STAT_VALUE);
    });

    it('should set defense to 6 and attack to 4 when pickDice is called on defense', () => {
        component.pickDice('defense');
        expect(component.form.value.defense).toBe(SIX_VALUE_DICE);
        expect(component.form.value.attack).toBe(DEFAULT_STAT_VALUE);
    });
});
