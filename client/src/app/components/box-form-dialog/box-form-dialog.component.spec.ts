import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoxFormDialogComponent } from './box-form-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('BoxFormDialogComponent', () => {
    let component: BoxFormDialogComponent;
    let fixture: ComponentFixture<BoxFormDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [BoxFormDialogComponent, CommonModule, RouterModule, ReactiveFormsModule, FormsModule], // ✅ Fix imports for standalone component
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: { boxId: 1 } },
                { provide: ActivatedRoute, useValue: { params: of({ id: '123' }) } }, // ✅ Mock ActivatedRoute
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
        expect(component.form.get('name')?.value).toBe('Player');
        expect(component.form.get('life')?.value).toBe(4);
        expect(component.form.get('speed')?.value).toBe(4);
        expect(component.form.get('avatar')?.value).toBe(component.avatars[0]);
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
        const newAvatar = 'assets/perso/5.png';
        component.selectAvatar(newAvatar);
        expect(component.form.get('avatar')?.value).toBe(newAvatar);
    });

    it('should update the name when `inputName` is called', () => {
        const event = { target: { value: 'New Name' } } as unknown as Event;
        component.inputName(event);
        expect(component.form.get('name')?.value).toBe('New Name');
    });

    it('should increase attributes when `increase` is called', () => {
        component.increase('life');
        expect(component.life).toBe(6);
        expect(component.form.get('life')?.value).toBe(6);
    });

    it('should update attack and defense values when `pickDice` is called', () => {
        component.pickDice('attack');
        expect(component.attack).toBe(6);
        expect(component.defense).toBe(4);
        expect(component.form.get('attack')?.value).toBe(6);
    });

    it('should update defense and attack values when `pickDice` is called with defense', () => {
        component.pickDice('defense');
        expect(component.defense).toBe(6);
        expect(component.attack).toBe(4);
        expect(component.form.get('defense')?.value).toBe(4);
    });
});
