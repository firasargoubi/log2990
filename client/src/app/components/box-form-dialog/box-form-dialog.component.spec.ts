import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Subscription} from 'rxjs';

import { BoxFormDialogComponent } from './box-form-dialog.component';
import { GameService } from '@app/services/game.service';

const routes: Routes = [];
const DEFAULT_STAT_VALUE = 4;
const FOUR_VALUE_DICE = 4;
const SIX_VALUE_DICE = 6;
const NEW_STAT_VALUE = 6;

describe('BoxFormDialogComponent', () => {
    let component: BoxFormDialogComponent;
    let fixture: ComponentFixture<BoxFormDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchVisibleGames']);

        // ✅ Ensure `fetchVisibleGames` returns a proper observable
     //   gameServiceSpy.fetchVisibleGames.and.returnValue(of([{ id: '1', name: 'Game 1', isVisible: true }]));

        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                BrowserAnimationsModule,
                HttpClientTestingModule,
                BoxFormDialogComponent, // ✅ Correct way to include standalone component
            ],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: { boxId: 1 } },
                { provide: GameService, useValue: gameServiceSpy },
                provideRouter(routes),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BoxFormDialogComponent);
        component = fixture.componentInstance;

        // ✅ Ensure `pollingSubscription` is initialized before tests run
        component['pollingSubscription'] = new Subscription();

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
        expect(component.form.value).toEqual({
            name: 'Player',
            avatar: 'assets/perso/1.jpg',
            life: DEFAULT_STAT_VALUE,
            speed: DEFAULT_STAT_VALUE,
            attack: DEFAULT_STAT_VALUE,
            defense: DEFAULT_STAT_VALUE,
        });
    });

    it('should close dialog with form value when form is valid', () => {
        component.closeDialog();
        expect(dialogRefSpy.close).toHaveBeenCalledWith(component.form.value);
    });

    it('should close dialog with null when cancel is called', () => {
        component.cancel();
        expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });

    it('should update avatar when selectAvatar is called', () => {
        component.selectAvatar('assets/perso/2.png');
        expect(component.form.get('avatar')?.value).toBe('assets/perso/2.png');
    });

    it('should update name when inputName is called', () => {
        const event = { target: { value: 'New Player' } } as unknown as Event;
        component.inputName(event);
        expect(component.form.get('name')?.value).toBe('New Player');
    });

    it('should increase life attribute value by 2 when increase is called', () => {
        component.increase('life');
        expect(component.form.get('life')?.value).toBe(NEW_STAT_VALUE);
        expect(component.form.get('speed')?.value).toBe(DEFAULT_STAT_VALUE);
    });

    it('should increase speed attribute value by 2 when increase is called', () => {
        component.increase('speed');
        expect(component.form.get('speed')?.value).toBe(NEW_STAT_VALUE);
        expect(component.form.get('life')?.value).toBe(DEFAULT_STAT_VALUE);
    });

    it('should set attack and defense values correctly when pickDice is called', () => {
        component.pickDice('attack');
        expect(component.form.get('attack')?.value).toBe(SIX_VALUE_DICE);
        expect(component.form.get('defense')?.value).toBe(FOUR_VALUE_DICE);

        component.pickDice('defense');
        expect(component.form.get('defense')?.value).toBe(SIX_VALUE_DICE);
        expect(component.form.get('attack')?.value).toBe(FOUR_VALUE_DICE);
    });

    it('should save form value to localStorage when save is called', () => {
        spyOn(localStorage, 'setItem');
        component.save();
        expect(localStorage.setItem).toHaveBeenCalledWith('form', JSON.stringify(component.form.value));
    });

    it('should reset attributes to default values when resetAttributes is called', () => {
        component.form.patchValue({
            life: 10,
            speed: 10,
            attack: 10,
            defense: 10,
        });
        component.resetAttributes();
        expect(component.form.value).toEqual({
            name: 'Player',
            avatar: 'assets/perso/1.jpg',
            life: DEFAULT_STAT_VALUE,
            speed: DEFAULT_STAT_VALUE,
            attack: DEFAULT_STAT_VALUE,
            defense: DEFAULT_STAT_VALUE,
        });
    });

    it('should unsubscribe from polling on destroy', () => {
        spyOn(component['pollingSubscription'], 'unsubscribe'); // ✅ Ensure we spy on an initialized object
        component.ngOnDestroy();
        expect(component['pollingSubscription'].unsubscribe).toHaveBeenCalled();
    });

    //it('should load games when loadGames is called', () => {
    //     component.loadGames();
    //     component.gameList.subscribe((games: any) => {
    //         expect(games).toEqual([{ id: '1', name: 'Game 1', isVisible: true }]);
    //     });
    // });
});
