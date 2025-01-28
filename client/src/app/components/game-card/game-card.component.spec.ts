import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game, GameCardComponent } from './game-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('GameCardComponent', () => {
    let component: GameCardComponent;
    let fixture: ComponentFixture<GameCardComponent>;
    let debugElement: DebugElement;

    const mockGame: Game = {
        id: 1,
        name: 'Test Game',
        mapSize: 'Large',
        mode: 'Survival',
        previewImage: 'https://via.placeholder.com/150',
        description: 'A test game description',
        lastModified: new Date(),
        isVisible: true,
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatCardModule, MatTooltipModule, MatButtonModule, MatSlideToggleModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameCardComponent);
        component = fixture.componentInstance;
        debugElement = fixture.debugElement;

        component.game = { ...mockGame }; // Provide input data
        fixture.detectChanges(); // Trigger change detection
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display the preview image and the game description in a tooltip above it', () => {
        const previewImage = debugElement.query(By.css('.game-preview img')).nativeElement;

        expect(previewImage).toBeTruthy();
        expect(previewImage.getAttribute('src')).toBe(mockGame.previewImage);
        expect(previewImage.getAttribute('ng-reflect-message')).toBe(mockGame.description);
        expect(previewImage.getAttribute('matTooltipPosition')).toBe('above');
    });

    it('should display game details correctly', () => {
        const gameName = debugElement.query(By.css('.game-info li:nth-child(1)')).nativeElement;
        const gameMapSize = debugElement.query(By.css('.game-info li:nth-child(2)')).nativeElement;
        const gameMode = debugElement.query(By.css('.game-info li:nth-child(3)')).nativeElement;

        expect(gameName).toBeTruthy();
        expect(gameMapSize).toBeTruthy();
        expect(gameMode).toBeTruthy();

        expect(gameName.textContent).toBe(mockGame.name);
        expect(gameMapSize.textContent).toBe(mockGame.mapSize);
        expect(gameMode.textContent).toBe(mockGame.mode);
    });

    it('should show tooltip below each button', () => {
        const editButton = debugElement.query(By.css('.action.edit ')).nativeElement;
        const deleteButton = debugElement.query(By.css('.action.delete ')).nativeElement;
        const visibilityButton = debugElement.query(By.css('.action.visibility ')).nativeElement;

        expect(editButton.getAttribute('ng-reflect-message')).toBe('Edit');
        expect(editButton.getAttribute('matTooltipPosition')).toBe('below');
        expect(deleteButton.getAttribute('ng-reflect-message')).toBe('Delete');
        expect(deleteButton.getAttribute('matTooltipPosition')).toBe('below');
        expect(visibilityButton.getAttribute('ng-reflect-message')).toBe('Toggle Visibility');
        expect(visibilityButton.getAttribute('matTooltipPosition')).toBe('below');
    });

    it('should emit "edit" event when edit button is clicked', () => {
        spyOn(component.edit, 'emit');

        const editButton = debugElement.query(By.css('.action.edit')).nativeElement;
        editButton.click();

        expect(component.edit.emit).toHaveBeenCalledWith(mockGame);
    });

    it('should emit "delete" event when delete button is clicked', async () => {
        spyOn(component.delete, 'emit');
        spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response(null, { status: 200 })));

        const deleteButton = debugElement.query(By.css('.action.delete')).nativeElement;
        deleteButton.click();

        await fixture.whenStable();
        expect(component.delete.emit).toHaveBeenCalledWith(mockGame);
        expect(window.fetch).toHaveBeenCalled();
    });

    it('should emit "visibilityChange" event when visibility button is clicked', async () => {
        spyOn(component.visibilityChange, 'emit');
        spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response(JSON.stringify(mockGame), { status: 200 })));

        const visibilityButton = debugElement.query(By.css('.action.visibility')).nativeElement;
        visibilityButton.click();

        await fixture.whenStable();
        expect(window.fetch).toHaveBeenCalled();
        expect(component.visibilityChange.emit).toHaveBeenCalledWith(mockGame);
    });

    it('should update the visibility icon class when visibility button is clicked', async () => {
        spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response(JSON.stringify(mockGame), { status: 200 })));

        const visibilityButton = debugElement.query(By.css('.action.visibility')).nativeElement;
        visibilityButton.click();

        await fixture.whenStable();
        fixture.detectChanges();

        expect(visibilityButton.classList).toContain('invisible');
    });
});
