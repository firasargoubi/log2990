/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { WAITING_PAGE_CONSTANTS } from '@app/Consts/app-constants';
import { PageUrl } from '@app/Consts/route-constants';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameLobby } from '@common/game-lobby';
import { of, Subject, Subscription } from 'rxjs';
import { WaitingPageComponent } from './waiting-page.component';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockActivatedRoute: any;
    let router: Router;

    const mockLobbyId = 'testLobby';
    const mockPlayerId = 'testPlayer';
    const mockLobby: GameLobby = {
        id: mockLobbyId,
        isLocked: false,
        players: [
            {
                id: 'hostPlayer',
                name: 'Host',
                avatar: 'fawn',
                isHost: true,
                life: 100,
                speed: 10,
                attack: 5,
                defense: 5,
                maxLife: 0,
                winCount: 0,
                pendingItem: 0,
            },
            {
                id: mockPlayerId,
                name: 'Test Player',
                avatar: 'fawn',
                isHost: false,
                life: 100,
                speed: 10,
                attack: 5,
                defense: 5,
                maxLife: 0,
                winCount: 0,
                pendingItem: 0,
            },
        ],
        maxPlayers: 0,
        gameId: '',
    };

    let lobbyUpdatedSubject: Subject<{ lobbyId: string; lobby: GameLobby }>;
    let hostDisconnectedSubject: Subject<void>;
    let errorSubject: Subject<string>;
    let gameStartedSubject: Subject<{ gameState: any }>;

    beforeEach(async () => {
        lobbyUpdatedSubject = new Subject();
        hostDisconnectedSubject = new Subject();
        errorSubject = new Subject();
        gameStartedSubject = new Subject<{ gameState: any }>();

        mockLobbyService = jasmine.createSpyObj<LobbyService>('LobbyService', {
            getLobby: of(mockLobby),
            onLobbyUpdated: lobbyUpdatedSubject.asObservable(),
            onHostDisconnected: hostDisconnectedSubject.asObservable(),
            onError: errorSubject.asObservable(),
            onGameStarted: gameStartedSubject.asObservable(),
            leaveLobby: undefined,
            lockLobby: undefined,
            requestStartGame: undefined,
            setCurrentPlayer: undefined,
            disconnectFromRoom: undefined,
        });

        mockNotificationService = jasmine.createSpyObj<NotificationService>('NotificationService', ['showError', 'showSuccess']);

        mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: (key: string) => {
                        if (key === 'id') return mockLobbyId;
                        if (key === 'playerId') return mockPlayerId;
                        return null;
                    },
                },
            },
        };

        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent],
            providers: [
                provideRouter([]),
                { provide: LobbyService, useValue: mockLobbyService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        spyOn(router, 'navigate');

        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with lobby data', () => {
        expect(mockLobbyService.getLobby).toHaveBeenCalledWith(mockLobbyId);
        expect(component.lobby).toEqual(mockLobby);
        expect(component.currentPlayer).toEqual(mockLobby.players[1]);
        expect(component.hostId).toBe('hostPlayer');
    });

    it('should update lobby on lobbyUpdated event', () => {
        const updatedLobby = { ...mockLobby, isLocked: true };
        lobbyUpdatedSubject.next({ lobbyId: mockLobbyId, lobby: updatedLobby });
        expect(component.lobby).toEqual(updatedLobby);
    });

    it('should handle host disconnection', fakeAsync(() => {
        hostDisconnectedSubject.next();
        tick();
        expect(mockNotificationService.showError).toHaveBeenCalledWith(WAITING_PAGE_CONSTANTS.lobbyCancelled);
        expect(router.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
    }));

    it('should show error on service error', () => {
        const errorMsg = 'Test error';
        errorSubject.next(errorMsg);
        expect(mockNotificationService.showError).toHaveBeenCalledWith(errorMsg);
    });

    it('should navigate to play page on game start', fakeAsync(() => {
        gameStartedSubject.next({ gameState: {} });
        tick();
        expect(mockLobbyService.setCurrentPlayer).toHaveBeenCalledWith(component.currentPlayer);
        expect(router.navigate).toHaveBeenCalledWith([`${PageUrl.Play}/${mockLobbyId}`]);
    }));

    it('should correctly identify host', () => {
        component.currentPlayer = mockLobby.players[0];
        expect(component.isHost()).toBeTrue();
        component.currentPlayer = mockLobby.players[1];
        expect(component.isHost()).toBeFalse();
    });

    it('should remove player from lobby', () => {
        component.lobby = mockLobby;
        component.removePlayer('hostPlayer');
        expect(mockLobbyService.leaveLobby).toHaveBeenCalledWith(mockLobbyId, 'Host');
    });

    it('should lock the room', () => {
        component.lobby = mockLobby;
        component.lockRoom();
        expect(mockLobbyService.lockLobby).toHaveBeenCalledWith(mockLobbyId);
        expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(WAITING_PAGE_CONSTANTS.gameLocked);
    });

    it('should start the game', () => {
        component.lobby = mockLobby;
        component.currentPlayer = mockLobby.players[0];
        component.startGame();
        expect(mockLobbyService.requestStartGame).toHaveBeenCalledWith(mockLobbyId);
    });

    it('should set currentPlayer to default if player not found in initial lobby', () => {
        const modifiedLobby = { ...mockLobby, players: [mockLobby.players[0]] };
        mockLobbyService.getLobby.and.returnValue(of(modifiedLobby));

        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.currentPlayer.id).toBe('0000');
        expect(component.currentPlayer.name).toBe('Unknown');
    });

    it('should set hostId to empty if no host found in initial lobby', () => {
        const modifiedLobby = {
            ...mockLobby,
            players: mockLobby.players.map((p) => ({ ...p, isHost: false })),
        };
        mockLobbyService.getLobby.and.returnValue(of(modifiedLobby));

        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.hostId).toBe('');
    });

    it('should update currentPlayer to default if player leaves in lobby update', () => {
        const updatedLobby = {
            ...mockLobby,
            players: [mockLobby.players[0]],
        };
        lobbyUpdatedSubject.next({ lobbyId: mockLobbyId, lobby: updatedLobby });

        expect(component.currentPlayer.id).toBe('testPlayer');
    });

    it('should update hostId to empty if host leaves in lobby update', () => {
        const updatedLobby = {
            ...mockLobby,
            players: [mockLobby.players[1]],
        };
        lobbyUpdatedSubject.next({ lobbyId: mockLobbyId, lobby: updatedLobby });

        expect(component.hostId).toBe('');
    });

    it('should unsubscribe all subscriptions on destroy', () => {
        const subscription = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
        component['subscriptions'] = [subscription];
        component.ngOnDestroy();
        expect(subscription.unsubscribe).toHaveBeenCalled();
    });
    it('should show error if startGame is called without a lobby', () => {
        component.lobby = null as any;
        component.currentPlayer = mockLobby.players[0];
        component.startGame();
        expect(mockNotificationService.showError).toHaveBeenCalledWith(WAITING_PAGE_CONSTANTS.errorStartGame);
    });

    it('should show error if startGame is called without a currentPlayer', () => {
        component.lobby = mockLobby;
        component.currentPlayer = null as any;
        component.startGame();
        expect(mockNotificationService.showError).toHaveBeenCalledWith(WAITING_PAGE_CONSTANTS.errorStartGame);
    });
    it('should navigate to Home if player is not found in lobby', fakeAsync(() => {
        const modifiedLobby = {
            ...mockLobby,
            players: [mockLobby.players[0]],
        };

        mockLobbyService.getLobby.and.returnValue(of(modifiedLobby));

        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;

        tick();
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
    }));
});
