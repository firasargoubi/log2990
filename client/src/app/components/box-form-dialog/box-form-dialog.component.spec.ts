import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoxFormDialogComponent } from './box-form-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

const DEFAULT_NAME = 'Player';
const DEFAULT_LIFE = 4;
const DEFAULT_SPEED = 4;
const DEFAULT_AVATAR = 'assets/perso/1.jpg';
const NEW_AVATAR = 'assets/perso/5.jpg';
const NEW_NAME = 'New Name';
const INCREASED_LIFE = 6;
const ATTACK_VALUE = 6;
const DEFENSE_VALUE = 4;

describe('BoxFormDialogComponent', () => {
    let component: BoxFormDialogComponent;
    let fixture: ComponentFixture<BoxFormDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
            declarations: [BoxFormDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: { boxId: 1 } },
                { provide: ActivatedRoute, useValue: { params: of({ id: '123' }) } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoxFormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
        expect(component.form.get('name')?.value).toBe(DEFAULT_NAME);
        expect(component.form.get('life')?.value).toBe(DEFAULT_LIFE);
        expect(component.form.get('speed')?.value).toBe(DEFAULT_SPEED);
        expect(component.form.get('avatar')?.value).toBe(DEFAULT_AVATAR);
    });

    it('should close dialog with form data when `closeDialog` is called', () => {
        component.closeDialog();
        expect(dialogRefSpy.close).toHaveBeenCalledWith(component.form.value);
    });

    it('should close dialog with null when `cancel` is called', () => {
        component.cancel();
        expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });

    it('should store form data in localStorage when `save` is called', () => {
        spyOn(localStorage, 'setItem');
        component.save();
        expect(localStorage.setItem).toHaveBeenCalledWith('form', JSON.stringify(component.form.value));
    });

    it('should update the avatar when `selectAvatar` is called', () => {
        component.selectAvatar(NEW_AVATAR);
        expect(component.form.get('avatar')?.value).toBe(NEW_AVATAR);
    });

    it('should update the name when `inputName` is called', () => {
        const event = { target: { value: NEW_NAME } } as unknown as Event;
        component.inputName(event);
        expect(component.form.get('name')?.value).toBe(NEW_NAME);
    });

    it('should increase attributes when `increase` is called', () => {
        component.increase('life');
        expect(component.life).toBe(INCREASED_LIFE);
        expect(component.form.get('life')?.value).toBe(INCREASED_LIFE);
    });

    it('should update attack and defense values when `pickDice` is called', () => {
        component.pickDice('attack');
        expect(component.attack).toBe(ATTACK_VALUE);
        expect(component.defense).toBe(DEFENSE_VALUE);
        expect(component.form.get('attack')?.value).toBe(ATTACK_VALUE);
    });

    it('should update defense and attack values when `pickDice` is called with defense', () => {
        component.pickDice('defense');
        expect(component.defense).toBe(ATTACK_VALUE);
        expect(component.attack).toBe(DEFENSE_VALUE);
        expect(component.form.get('defense')?.value).toBe(DEFENSE_VALUE);
    });
});
