import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeleteComponent } from './confirm-delete.component';
import { MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';

describe('ConfirmDeleteComponent', () => {
    let component: ConfirmDeleteComponent;
    let fixture: ComponentFixture<ConfirmDeleteComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDeleteComponent>>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [MatButtonModule, NoopAnimationsModule, ConfirmDeleteComponent],
            providers: [{ provide: MatDialogRef, useValue: dialogRefSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDeleteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialog with true when onConfirm is called', () => {
        component.onConfirm();
        expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog with false when onCancel is called', () => {
        component.onCancel();
        expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it('should call onConfirm when confirm button is clicked', () => {
        spyOn(component, 'onConfirm');
        const button = fixture.debugElement.query(By.css('.confirm.button')).nativeElement;
        button.click();
        expect(component.onConfirm).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', () => {
        spyOn(component, 'onCancel');
        const button = fixture.debugElement.query(By.css('.cancel.button')).nativeElement;
        button.click();
        expect(component.onCancel).toHaveBeenCalled();
    });
});
