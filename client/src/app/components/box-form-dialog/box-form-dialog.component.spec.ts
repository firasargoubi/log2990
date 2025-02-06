import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Routes, provideRouter } from '@angular/router';
import { BoxFormDialogComponent } from './box-form-dialog.component';

const routes: Routes = [];
import { ReactiveFormsModule } from '@angular/forms';

describe('BoxFormDialogComponent', () => {
    let component: BoxFormDialogComponent;
    let fixture: ComponentFixture<BoxFormDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, BrowserAnimationsModule, BoxFormDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: { boxId: 1 } },
                provideRouter(routes),
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

    it('should initialize form with default values', () => {
        expect(component.form.value).toEqual({
            name: 'Player',
            avatar: 'assets/perso/1.jpg',
            life: 4,
            speed: 4,
            attack: 4,
            defense: 4,
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

    it('should increase life value by 2 when increase is called', () => {
        const increasedValue = 6;
        component.increase('life');
        expect(component.form.get('life')?.value).toBe(increasedValue);
        expect(component.life).toBe(increasedValue);
    });

    it('should increase speed value by 2 when increase is called', () => {
        const increasedValue = 6;
        component.increase('speed');
        expect(component.form.get('speed')?.value).toBe(increasedValue);
        expect(component.speed).toBe(increasedValue);
    });

    it('should set attack and defense values correctly when pickDice is called', () => {
        const sixDiceValue = 6;
        const fourDiceValue = 4;
        component.pickDice('attack');
        expect(component.form.get('attack')?.value).toBe(sixDiceValue);
        expect(component.attack).toBe(sixDiceValue);
        expect(component.defense).toBe(fourDiceValue);

        component.pickDice('defense');
        expect(component.form.get('defense')?.value).toBe(fourDiceValue);
        expect(component.defense).toBe(sixDiceValue);
        expect(component.attack).toBe(fourDiceValue);
    });

    it('should save form value to localStorage when save is called', () => {
        spyOn(localStorage, 'setItem');
        component.save();
        expect(localStorage.setItem).toHaveBeenCalledWith('form', JSON.stringify(component.form.value));
    });
});
