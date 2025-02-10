import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GameService } from '@app/services/game.service';
import { throwError, of } from 'rxjs';
import { BoxFormDialogComponent } from './box-form-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { Game } from '@app/interfaces/game.model';

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

    beforeEach(async () => {
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockGameService = jasmine.createSpyObj('GameService', ['fetchVisibleGames']);

        mockGameService.fetchVisibleGames.and.returnValue(of([]));
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, HttpClientTestingModule, BoxFormDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { boxId: '1', game: { id: '1', name: 'Game1', isVisible: true }, gameList: [] } },
                { provide: GameService, useValue: mockGameService },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoxFormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the form with default values', () => {
        expect(component.form.value).toEqual({
            name: 'Game1',
            avatar: 'assets/perso/1.jpg',
            life: 4,
            speed: 4,
            attack: 4,
            defense: 4,
        });
    });

    it('should update form validity when status changes', () => {
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
        component.form.patchValue({ life: 10, speed: 10, attack: 10, defense: 10 });
        component.resetAttributes();
        expect(component.form.value.life).toBe(DEFAULT_STAT_VALUE);
        expect(component.form.value.speed).toBe(DEFAULT_STAT_VALUE);
        expect(component.form.value.attack).toBe(DEFAULT_STAT_VALUE);
        expect(component.form.value.defense).toBe(DEFAULT_STAT_VALUE);
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
                mapSize: '',
                mode: '',
                previewImage: '',
                description: '',
                lastModified: new Date(),
                isVisible: false,
                board: [],
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
        spyOn(console, 'error');
        mockGameService.fetchVisibleGames.and.returnValue(throwError(() => new Error('Fetch failed')));
        component.ngOnInit();
        tick(TIME);
        expect(console.error).toHaveBeenCalledWith('Erreur lors du rafraîchissement des jeux', jasmine.any(Error));
    }));

    it('should not save if the game is deleted or hidden', async () => {
        const mockGames: Game[] = [
            {
                id: '1',
                name: 'Test Game',
                mapSize: '',
                mode: '',
                previewImage: '',
                description: '',
                lastModified: new Date(),
                isVisible: false,
                board: [],
            },
        ];
        mockGameService.fetchVisibleGames.and.returnValue(of(mockGames));
        spyOn(window, 'alert');
        await component.save();
        expect(window.alert).toHaveBeenCalledWith('Ce jeu a été supprimé ou sa visibilité a changéee entre temps, Veuillez choisir un autre jeu.');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
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

    it('should not save if the game is deleted or hidden', async () => {
        const mockGames: Game[] = [
            {
                id: '1',
                name: 'Test Game',
                mapSize: '',
                mode: '',
                previewImage: '',
                description: '',
                lastModified: new Date(),
                isVisible: false,
                board: [],
            },
        ];
        mockGameService.fetchVisibleGames.and.returnValue(of(mockGames));
        spyOn(window, 'alert');

        await component.save();

        expect(window.alert).toHaveBeenCalledWith('Ce jeu a été supprimé ou sa visibilité a changéee entre temps, Veuillez choisir un autre jeu.');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should save and close dialog when game exists and is visible', async () => {
        component.gameList = [
            {
                id: '1',
                name: 'Test Game',
                mapSize: '',
                mode: '',
                previewImage: '',
                description: '',
                lastModified: new Date(),
                isVisible: true,
                board: [],
            },
        ];
        spyOn(localStorage, 'setItem');

        await component.save();

        expect(localStorage.setItem).toHaveBeenCalledWith('form', JSON.stringify(component.form.value));
        expect(mockDialogRef.close).toHaveBeenCalledWith(component.form.value);
    });
});
