import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameCardComponent } from './game-card.component';
import { Game } from '@app/interfaces/game.model';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { GameService } from '@app/services/game.service';
import { of } from 'rxjs';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

describe('GameCardComponent', () => {
    let component: GameCardComponent;
    let fixture: ComponentFixture<GameCardComponent>;
    let debugElement: DebugElement;
    let gameService: jasmine.SpyObj<GameService>;

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
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['deleteGame', 'updateVisibility']);

        await TestBed.configureTestingModule({
            imports: [MatCardModule, MatTooltipModule, MatButtonModule, MatSlideToggleModule, GameCardComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                HttpClient,
                HttpHandler,
                {
                    provide: ActivatedRoute,
                    useValue: { data: of({ game: mockGame }) },
                },
            ],
        }).compileComponents();

        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameCardComponent);
        component = fixture.componentInstance;
        debugElement = fixture.debugElement;
        component.game = { ...mockGame };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display game details correctly', () => {
        const gameName = debugElement.query(By.css('.game-info li:nth-child(1)')).nativeElement;
        const gameMapSize = debugElement.query(By.css('.game-info li:nth-child(2)')).nativeElement;
        const gameMode = debugElement.query(By.css('.game-info li:nth-child(3)')).nativeElement;

        expect(gameName.textContent).toBe(mockGame.name);
        expect(gameMapSize.textContent).toBe(mockGame.mapSize);
        expect(gameMode.textContent).toBe(mockGame.mode);
    });

    it('should emit "edit" event when edit button is clicked', () => {
        spyOn(component.edit, 'emit');

        const editButton = debugElement.query(By.css('.action.edit')).nativeElement;
        editButton.click();

        expect(component.edit.emit).toHaveBeenCalledWith(mockGame);
    });

    it('should call deleteGame on service and emit "delete" event when delete button is clicked', () => {
        spyOn(component.delete, 'emit');
        gameService.deleteGame.and.returnValue(of(undefined)); // Mock API response

        const deleteButton = debugElement.query(By.css('.action.delete')).nativeElement;
        deleteButton.click();

        expect(gameService.deleteGame).toHaveBeenCalledWith(mockGame.id);
        expect(component.delete.emit).toHaveBeenCalledWith(mockGame);
    });

    it('should call updateVisibility on service and emit "visibilityChange" event when visibility button is clicked', () => {
        spyOn(component.visibilityChange, 'emit');
        const updatedGame = { ...mockGame, isVisible: false };
        gameService.updateVisibility.and.returnValue(of(updatedGame)); // Mock API response

        const visibilityButton = debugElement.query(By.css('.action.visibility')).nativeElement;
        visibilityButton.click();

        expect(gameService.updateVisibility).toHaveBeenCalledWith(mockGame.id, false);
        expect(component.visibilityChange.emit).toHaveBeenCalledWith(updatedGame);
    });

    it('should update the visibility icon class when visibility button is clicked', () => {
        const updatedGame = { ...mockGame, isVisible: false };
        gameService.updateVisibility.and.returnValue(of(updatedGame));

        const visibilityButton = debugElement.query(By.css('.action.visibility')).nativeElement;
        visibilityButton.click();

        fixture.detectChanges();

        expect(visibilityButton.classList).toContain('invisible');
    });
});
