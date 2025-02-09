/* eslint-disable @typescript-eslint/no-magic-numbers */
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
        const radioLabels = fixture.debugElement.queryAll(By.css('.mode-radio-group label'));

        expect(radioLabels.length).toBe(2);
        expect(radioLabels[0].nativeElement.textContent).toContain('Classique');
        expect(radioLabels[1].nativeElement.textContent).toContain('Capturer le drapeau');
    });

    it('should render the size section with radio buttons', () => {
        const radioLabels = fixture.debugElement.queryAll(By.css('.size-radio-group label'));

        expect(radioLabels.length).toBe(3);
        expect(radioLabels[0].nativeElement.textContent).toContain('Petite');
        expect(radioLabels[1].nativeElement.textContent).toContain('Moyenne');
        expect(radioLabels[2].nativeElement.textContent).toContain('Grande');
    });

    it('should update selectedMode.type when a mode is selected', () => {
        const radioButtons = fixture.debugElement.queryAll(By.css('.mode-radio-group input[type="radio"]'));
        radioButtons[1].nativeElement.click();
        fixture.detectChanges();

        expect(component.selectedMode.type).toBe(GameType.Capture);
    });

    it('should update selectedMode.size when a size is selected', () => {
        const radioButtons = fixture.debugElement.queryAll(By.css('.size-radio-group input[type="radio"]'));
        radioButtons[2].nativeElement.click();
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
