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
                { provide: MatDialogRef, useValue: {} }, // Mock MatDialogRef
                { provide: MAT_DIALOG_DATA, useValue: {} }, // Mock MAT_DIALOG_DATA if needed
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameModeDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
