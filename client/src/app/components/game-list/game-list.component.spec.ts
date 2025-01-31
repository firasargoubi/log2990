import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameListComponent } from './game-list.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Game } from '@app/interfaces/game.model';

describe('GameListComponent', () => {
    let component: GameListComponent;
    let fixture: ComponentFixture<GameListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameListComponent],
            providers: [
                HttpClient,
                HttpHandler,
                {
                    provide: ActivatedRoute,
                    useValue: { data: of({ games: [] }) },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should emit editGame event when editGame is called', () => {
        const game: Game = {
            id: '1',
            name: 'Test Game',
            description: 'Test Description',
            mode: 'Classic',
            mapSize: 'Medium',
            isVisible: true,
            board: [
                [0, 0],
                [0, 0],
            ],
            previewImage: '',
            lastModified: new Date(),
        };
        spyOn(component.editGame, 'emit');

        component.editGame.emit(game);

        expect(component.editGame.emit).toHaveBeenCalledWith(game);
    });

    it('should emit deleteGame event when deleteGame is called', () => {
        const game: Game = {
            id: '1',
            name: 'Test Game',
            description: 'Test Description',
            mode: 'Classic',
            mapSize: 'Medium',
            isVisible: true,
            board: [
                [0, 0],
                [0, 0],
            ],
            previewImage: '',
            lastModified: new Date(),
        };
        spyOn(component.deleteGame, 'emit');

        component.deleteGame.emit(game);

        expect(component.deleteGame.emit).toHaveBeenCalledWith(game);
    });

    it('should emit visibilityChange event when onVisibilityChange is called', () => {
        const game: Game = {
            id: '1',
            name: 'Test Game',
            description: 'Test Description',
            mode: 'Classic',
            mapSize: 'Medium',
            isVisible: true,
            board: [
                [0, 0],
                [0, 0],
            ],
            previewImage: '',
            lastModified: new Date(),
        };
        spyOn(component.visibilityChange, 'emit');

        component.onVisibilityChange(game);

        expect(component.visibilityChange.emit).toHaveBeenCalledWith(game);
    });

    it('should render game cards for each game in the games array', () => {
        component.games = [
            {
                id: '1',
                name: 'Test Game 1',
                description: 'Test Description 1',
                mode: 'Classic',
                mapSize: 'Medium',
                isVisible: true,
                board: [
                    [0, 0],
                    [0, 0],
                ],
                previewImage: '',
                lastModified: new Date(),
            },
            {
                id: '2',
                name: 'Test Game 2',
                description: 'Test Description 2',
                mode: 'Classic',
                mapSize: 'Medium',
                isVisible: true,
                board: [
                    [0, 0],
                    [0, 0],
                ],
                previewImage: '',
                lastModified: new Date(),
            },
        ];
        fixture.detectChanges();

        const gameCards = fixture.nativeElement.querySelectorAll('app-game-card');
        expect(gameCards.length).toBe(2);
    });
});
