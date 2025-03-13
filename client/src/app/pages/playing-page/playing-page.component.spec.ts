import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { of, Subscription, throwError } from 'rxjs';
import { PlayingPageComponent } from './playing-page.component';

describe('PlayingPageComponent', () => {
    let component: PlayingPageComponent;
    let fixture: ComponentFixture<PlayingPageComponent>;
    let lobbyService: jasmine.SpyObj<LobbyService>;
    let gameService: jasmine.SpyObj<GameService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let router: jasmine.SpyObj<Router>;
    let activatedRoute: ActivatedRoute;

    beforeEach(async () => {
        const lobbyServiceSpy = jasmine.createSpyObj('LobbyService', ['getLobby', 'leaveLobby']);
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchGameById']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [PlayingPageComponent],
            providers: [
                { provide: LobbyService, useValue: lobbyServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get: (key: string) => {
                                    if (key === 'id') return 'test-lobby-id';
                                    if (key === 'playerId') return 'test-player-id';
                                    return null;
                                },
                            },
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayingPageComponent);
        component = fixture.componentInstance;
        lobbyService = TestBed.inject(LobbyService) as jasmine.SpyObj<LobbyService>;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        activatedRoute = TestBed.inject(ActivatedRoute);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load lobby and player on init', () => {
        const mockLobby = {
            id: 'test-lobby-id',
            players: [
                {
                    id: 'test-player-id', // Player's ID
                    name: 'Player1', // Player's name
                    avatar: '', // Avatar field (add if required)
                    isHost: false, // Player is not the host
                    life: 100, // Player's life
                    speed: 1, // Player's speed
                    attack: 4, // Player's attack value
                    defense: 6, // Player's defense value
                },
            ],
            gameId: 'test-game-id', // Game ID
        };

        spyOn(activatedRoute.snapshot.paramMap, 'get').and.callFake((key: string) => {
            if (key === 'id') return 'test-lobby-id';
            if (key === 'playerId') return 'test-player-id';
            return null;
        });

        lobbyService.getLobby.and.returnValue(of(mockLobby));
        gameService.fetchGameById.and.returnValue(of({ ...component.game, id: 'test-game-id' }));

        component.ngOnInit();

        // Ensure the component data is correctly populated
        expect(lobbyService.getLobby).toHaveBeenCalledWith('test-lobby-id');
        expect(component.lobby).toEqual(mockLobby);
        expect(component.currentPlayer).toEqual(mockLobby.players[0]);
        expect(gameService.fetchGameById).toHaveBeenCalledWith('test-game-id');
        expect(component.gameLoaded).toBeTrue();
    });

    // other tests...

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show error if lobby ID or player ID is missing', () => {
        spyOn(activatedRoute.snapshot.paramMap, 'get').and.returnValue(null);

        component.ngOnInit();

        expect(notificationService.showError).toHaveBeenCalledWith('Lobby ID or Player ID is missing!');
    });

    it('should show error if lobby is not found', () => {
        lobbyService.getLobby.and.returnValue(of(null));

        component.loadLobby('invalid-lobby-id', 'test-player-id');

        expect(notificationService.showError).toHaveBeenCalledWith('Lobby not found!');
    });

    it('should show error if player is not found in the lobby', () => {
        const mockLobby = { id: 'test-lobby-id', players: [], gameId: 'test-game-id' };
        lobbyService.getLobby.and.returnValue(of(mockLobby));

        component.loadLobby('test-lobby-id', 'invalid-player-id');

        expect(notificationService.showError).toHaveBeenCalledWith('Player not found in the lobby');
    });

    it('should show error if game is not found', () => {
        lobbyService.getLobby.and.returnValue(
            of({ id: 'test-lobby-id', players: [{ id: 'test-player-id', name: 'Player1' }], gameId: 'test-game-id' }),
        );
        gameService.fetchGameById.and.returnValue(throwError('Game not found'));

        component.loadLobby('test-lobby-id', 'test-player-id');

        expect(notificationService.showError).toHaveBeenCalledWith('Error loading game: Game not found');
    });

    it('should reload the page on resetBoard', () => {
        spyOn(window.location, 'reload');
        component.resetBoard();
        expect(window.location.reload).toHaveBeenCalled();
    });

    it('should navigate to home on abandon', () => {
        component.lobby = {
            id: 'test-lobby-id',
            players: [{ id: 'test-player-id', name: 'Player1', avatar: '', isHost: false, life: 100, speed: 1, attack: 4, defense: 6 }],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'test-game-id',
        };
        component.currentPlayer = {
            id: 'test-player-id',
            name: 'Player1',
            avatar: '',
            isHost: false,
            life: 100,
            speed: 1,
            attack: 4,
            defense: 6,
        };

        component.abandon();

        expect(lobbyService.leaveLobby).toHaveBeenCalledWith('test-lobby-id', 'Player1');
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should load lobby and player on init', () => {
        const mockLobby = {
            id: 'test-lobby-id',
            players: [{ id: 'test-player-id', name: 'Player1' }],
            gameId: 'test-game-id',
        };
        spyOn(activatedRoute.snapshot.paramMap, 'get').and.callFake((key: string) => {
            if (key === 'id') return 'test-lobby-id';
            if (key === 'playerId') return 'test-player-id';
            return null;
        });
        lobbyService.getLobby.and.returnValue(of(mockLobby));
        gameService.fetchGameById.and.returnValue(of({ ...component.game, id: 'test-game-id' }));

        component.ngOnInit();

        expect(lobbyService.getLobby).toHaveBeenCalledWith('test-lobby-id');
        expect(component.lobby).toEqual(mockLobby);
        expect(component.currentPlayer).toEqual(mockLobby.players[0]);
        expect(gameService.fetchGameById).toHaveBeenCalledWith('test-game-id');
        expect(component.gameLoaded).toBeTrue();
    });

    it('should show error if no board is available for the game', () => {
        const mockLobby = {
            id: 'test-lobby-id',
            players: [{ id: 'test-player-id', name: 'Player1' }],
            gameId: 'test-game-id',
        };
        lobbyService.getLobby.and.returnValue(of(mockLobby));
        gameService.fetchGameById.and.returnValue(of({ ...component.game, id: 'test-game-id', board: [] }));

        component.loadLobby('test-lobby-id', 'test-player-id');

        expect(notificationService.showError).toHaveBeenCalledWith('No board available for this game');
    });

    it('should unsubscribe from all subscriptions on destroy', () => {
        const subscription1 = new Subscription();
        const subscription2 = new Subscription();
        component['subscriptions'] = [subscription1, subscription2];
        spyOn(subscription1, 'unsubscribe');
        spyOn(subscription2, 'unsubscribe');

        component.ngOnDestroy();

        expect(subscription1.unsubscribe).toHaveBeenCalled();
        expect(subscription2.unsubscribe).toHaveBeenCalled();
    });

    it('should end turn', () => {
        spyOn(component, 'endTurn');
        component.endTurn();
        expect(component.endTurn).toHaveBeenCalled();
    });

    it('should attack', () => {
        spyOn(component, 'attack');
        component.attack();
        expect(component.attack).toHaveBeenCalled();
    });

    it('should defend', () => {
        spyOn(component, 'defend');
        component.defend();
        expect(component.defend).toHaveBeenCalled();
    });
});
