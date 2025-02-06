import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GameModeDialogComponent } from '@app/components/game-mode/game-mode.component';

describe('GameModeDialogComponent', () => {
    let component: GameModeDialogComponent;
    let fixture: ComponentFixture<GameModeDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameModeDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameModeDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should have default selectedMode as classic and moyenne', () => {
        expect(component.selectedMode).toEqual({ type: 'classic', size: 'moyenne' });
    });

    it('should close the dialog on cancel', () => {
        component.onCancel();
        expect(component['dialogRef'].close).toHaveBeenCalled();
    });

    it('should close the dialog with selectedMode on confirm', () => {
        component.onConfirm();
        expect(component['dialogRef'].close).toHaveBeenCalledWith({ type: 'classic', size: 'moyenne' });
    });

    it('should update selectedMode when a new mode is selected', () => {
        component.selectedMode = { type: 'capture', size: 'grande' };
        fixture.detectChanges();
        expect(component.selectedMode).toEqual({ type: 'capture', size: 'grande' });
    });
});
