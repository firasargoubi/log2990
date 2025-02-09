import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { By } from '@angular/platform-browser';
import { GameModeDialogComponent } from '@app/components/game-mode/game-mode.component';
import { GameType, GameSize } from '@app/Consts/app.constants';

describe('GameModeDialogComponent', () => {
    let component: GameModeDialogComponent;
    let fixture: ComponentFixture<GameModeDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<GameModeDialogComponent>>;

    beforeEach(async () => {
        // Création d'un mock pour MatDialogRef
        const dialogRefMock = jasmine.createSpyObj<MatDialogRef<GameModeDialogComponent>>('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            imports: [FormsModule, MatButtonModule, MatRadioModule, GameModeDialogComponent],
            providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameModeDialogComponent);
        component = fixture.componentInstance;
        dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<GameModeDialogComponent>>;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should render the title', () => {
        const title = fixture.debugElement.query(By.css('h2[mat-dialog-title]')).nativeElement;
        expect(title.textContent).toContain("Création / édition d'un jeu");
    });

    it('should render the mode section with radio buttons', () => {
        const modeSection = fixture.debugElement.query(By.css('.mode-section'));
        const radioButtons = modeSection.queryAll(By.css('mat-radio-button'));

        expect(modeSection).toBeTruthy();
        expect(radioButtons.length).toBe(2);
        expect(radioButtons[0].nativeElement.textContent).toContain('Classique');
        expect(radioButtons[1].nativeElement.textContent).toContain('Capturer le drapeau');
    });

    it('should render the size section with radio buttons', () => {
        const sizeSection = fixture.debugElement.query(By.css('.size-section'));
        const radioButtons = sizeSection.queryAll(By.css('mat-radio-button'));

        expect(sizeSection).toBeTruthy();
        expect(radioButtons.length).toBe(3);
        expect(radioButtons[0].nativeElement.textContent).toContain('Petite');
        expect(radioButtons[1].nativeElement.textContent).toContain('Moyenne');
        expect(radioButtons[2].nativeElement.textContent).toContain('Grande');
    });

    it('should update selectedMode.type when a mode is selected', () => {
        const radioGroup = fixture.debugElement.query(By.css('.mode-section mat-radio-group'));
        radioGroup.triggerEventHandler('change', { value: GameType.Capture });
        fixture.detectChanges();

        expect(component.selectedMode.type).toBe(GameType.Capture);
    });

    it('should update selectedMode.size when a size is selected', () => {
        const radioGroup = fixture.debugElement.query(By.css('.size-section mat-radio-group'));
        radioGroup.triggerEventHandler('change', { value: GameSize.Large });
        fixture.detectChanges();

        expect(component.selectedMode.size).toBe(GameSize.Large);
    });

    it('should call dialogRef.close() with no data when cancel is clicked', () => {
        const cancelButton = fixture.debugElement.query(By.css('button[mat-button]'));
        cancelButton.triggerEventHandler('click', null);

        expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });

    it('should call dialogRef.close() with selectedMode when confirm is clicked', () => {
        const confirmButton = fixture.debugElement.query(By.css('button[color="primary"]'));
        confirmButton.triggerEventHandler('click', null);

        expect(dialogRefSpy.close).toHaveBeenCalledWith(component.selectedMode);
    });
});
