import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;
import { AdminPageComponent } from './admin-page.component';
import { GameService } from '@app/services/game.service';
import { Game } from '@app/interfaces/game.model';

const routes: Routes = [];

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let gameService: SpyObj<GameService>;

    beforeEach(async () => {
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGames']);
        gameServiceSpy.fetchGames.and.returnValue(
            of([
                {
                    id: '1',
                    name: 'Test Game',
                    mapSize: '',
                    mode: '',
                    previewImage: '',
                    description: '',
                    lastModified: new Date(),
                    isVisible: false,
                    board: [],
                },
            ]),
        );

        await TestBed.configureTestingModule({
            imports: [AdminPageComponent],
            providers: [{ provide: GameService, useValue: gameServiceSpy }, provideHttpClientTesting(), provideRouter(routes)],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch games on init', () => {
        const mockGames: Game[] = [
            {
                id: '1',
                name: 'Test Game',
                mapSize: '',
                mode: '',
                previewImage: '',
                description: '',
                lastModified: new Date(),
                isVisible: false,
                board: [],
            },
        ];
        gameService.fetchGames.and.returnValue(of(mockGames));

        component.ngOnInit();

        expect(gameService.fetchGames).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should call fetchGames on onDeleteGame', () => {
        spyOn(component, 'fetchGames');
        component.onDeleteGame();
        expect(component.fetchGames).toHaveBeenCalled();
    });

    it('should call fetchGames on onToggleVisibility', () => {
        spyOn(component, 'fetchGames');
        component.onToggleVisibility();
        expect(component.fetchGames).toHaveBeenCalled();
    });

    it('should return the game on onEditGame', () => {
        const game: Game = {
            id: '1',
            name: 'Test Game',
            mapSize: '',
            mode: '',
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: false,
            board: [],
        };
        expect(component.onEditGame(game)).toEqual(game);
    });
});
