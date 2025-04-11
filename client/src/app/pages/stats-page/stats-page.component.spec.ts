import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Navigation, Router } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
import { GameState } from '@common/game-state';
import { StatsPageComponent } from './stats-page.component';

describe('StatsPageComponent', () => {
    let component: StatsPageComponent;
    let fixture: ComponentFixture<StatsPageComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let mockNavigation: Partial<Navigation>;
    let mockGameState: GameState;

    beforeEach(() => {
        mockGameState = {
            players: [
                { name: 'Player1', avatar: 'avatar1.png' },
                { name: 'Player2', avatar: 'avatar2.png' },
            ],
        } as GameState;

        mockNavigation = {
            extras: {
                state: {
                    winner: 'Player1',
                    lobbyId: 'lobby123',
                    gameState: mockGameState,
                },
            },
        };

        routerSpy = jasmine.createSpyObj('Router', ['getCurrentNavigation', 'navigate']);
        routerSpy.getCurrentNavigation.and.returnValue(mockNavigation as Navigation);

        TestBed.configureTestingModule({
            imports: [StatsPageComponent],
            providers: [{ provide: Router, useValue: routerSpy }],
        });

        fixture = TestBed.createComponent(StatsPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with single winner from string', () => {
        fixture.detectChanges();
        expect(component.winnersNames).toEqual(['Player1']);
        expect(component.winnersAvatars).toEqual(['avatar1.png']);
        expect(component.gameState).toBe(mockGameState);
    });

    it('should initialize with multiple winners from comma-separated string', () => {
        mockNavigation.extras = mockNavigation.extras || {};
        mockNavigation.extras.state = {
            winner: 'Player1, Player2',
            lobbyId: 'lobby123',
            gameState: mockGameState,
        };
        fixture = TestBed.createComponent(StatsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.winnersNames).toEqual(['Player1', 'Player2']);
        expect(component.winnersAvatars).toEqual(['avatar1.png', 'avatar2.png']);
    });
    it('should initialize with winners from array', () => {
        mockNavigation.extras = mockNavigation.extras || {};
        mockNavigation.extras.state = {
            winner: ['Player1', 'Player2'],
            lobbyId: 'lobby123',
            gameState: mockGameState,
        };
        fixture = TestBed.createComponent(StatsPageComponent);
        fixture = TestBed.createComponent(StatsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.winnersNames).toEqual(['Player1', 'Player2']);
        expect(component.winnersAvatars).toEqual(['avatar1.png', 'avatar2.png']);
    });

    it('should navigate to home page when return is called', () => {
        component.return();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
    });

    it('should return the name in trackByName function', () => {
        const result = component.trackByName(1, 'Player1');
        expect(result).toBe('Player1');
    });
    it('should set winnersNames to ["Unknown"] when state is not available', () => {
        routerSpy.getCurrentNavigation.and.returnValue(null);
        fixture = TestBed.createComponent(StatsPageComponent);
        component = fixture.componentInstance;

        expect(component.winnersNames).toEqual(['Unknown']);
        expect(component.winnersAvatars).toEqual([]);
    });

    it('should correctly filter and map winnersAvatars based on winnersNames', () => {
        mockGameState = {
            players: [
                { name: 'Player1', avatar: 'avatar1.png' },
                { name: 'Player2', avatar: 'avatar2.png' },
                { name: 'Player3', avatar: 'avatar3.png' },
            ],
        } as GameState;

        mockNavigation.extras = mockNavigation.extras || {};
        mockNavigation.extras.state = {
            winner: 'Player1, Player3',
            lobbyId: 'lobby123',
            gameState: mockGameState,
        };

        fixture = TestBed.createComponent(StatsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.winnersAvatars).toEqual(['avatar1.png', 'avatar3.png']);
    });

    it('should handle winner names that do not match any player names', () => {
        mockGameState = {
            players: [
                { name: 'Player1', avatar: 'avatar1.png' },
                { name: 'Player2', avatar: 'avatar2.png' },
            ],
        } as GameState;

        mockNavigation.extras = mockNavigation.extras || {};
        mockNavigation.extras.state = {
            winner: 'UnknownPlayer',
            lobbyId: 'lobby123',
            gameState: mockGameState,
        };

        fixture = TestBed.createComponent(StatsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.winnersNames).toEqual(['UnknownPlayer']);
        expect(component.winnersAvatars).toEqual([]);
    });
});
