import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfirmDeleteComponent } from './confirm-delete.component';
import { MatButtonModule } from '@angular/material/button';
import { By } from '@angular/platform-browser';

describe('ConfirmDeleteComponent', () => {
    let component: ConfirmDeleteComponent;
    let fixture: ComponentFixture<ConfirmDeleteComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmDeleteComponent>>;

    beforeEach(async () => {
        const dialogRefMock = jasmine.createSpyObj<MatDialogRef<ConfirmDeleteComponent>>('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [MatButtonModule, ConfirmDeleteComponent],
            providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDeleteComponent);
        component = fixture.componentInstance;
        dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ConfirmDeleteComponent>>;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call dialogRef.close with true when onConfirm is called', () => {
        component.onConfirm();
        expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should call dialogRef.close with false when onCancel is called', () => {
        component.onCancel();
        expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });

    it('should call onConfirm method when Confirm button is clicked', () => {
        spyOn(component, 'onConfirm');
        const confirmButton = fixture.debugElement.query(By.css('button.confirm'));
        confirmButton.triggerEventHandler('click', null);

        expect(component.onConfirm).toHaveBeenCalled();
    });

    it('should call onCancel method when Cancel button is clicked', () => {
        spyOn(component, 'onCancel');
        const cancelButton = fixture.debugElement.query(By.css('button.cancel'));
        cancelButton.triggerEventHandler('click', null);

        expect(component.onCancel).toHaveBeenCalled();
    });

    it('should render title and content correctly', () => {
        const title = fixture.debugElement.query(By.css('h2[mat-dialog-title]')).nativeElement;
        const content = fixture.debugElement.query(By.css('mat-dialog-content')).nativeElement;

        expect(title.textContent).toContain('Confirmation');
        expect(content.textContent).toContain('Êtes-vous sûr de vouloir supprimer ce jeu ?');
    });

    it('should close dialog with true when Confirm button is clicked', () => {
        const confirmButton = fixture.debugElement.query(By.css('button.confirm'));
        confirmButton.triggerEventHandler('click', null);

        expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should close dialog with false when Cancel button is clicked', () => {
        const cancelButton = fixture.debugElement.query(By.css('button.cancel'));
        cancelButton.triggerEventHandler('click', null);

        expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
    });
});
