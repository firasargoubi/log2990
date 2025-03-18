/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PlayingPageComponent } from './playing-page.component';
import { LobbyService } from '@app/services/lobby.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '@app/services/notification.service';
import { Subject, Subscription } from 'rxjs';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Coordinates } from '@common/coordinates';
import { PageUrl } from '@app/Consts/route-constants';

describe('PlayingPageComponent', () => {
    let component: PlayingPageComponent;
    let fixture: ComponentFixture<PlayingPageComponent>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: any;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    const paramsSubject = new Subject();
    let gameStartedSubject: Subject<any>;
    let turnStartedSubject: Subject<any>;
    let lobbyUpdatedSubject: Subject<any>;
    let errorSubject: Subject<any>;
    let boardChangedSubject: Subject<any>;
    let turnEndedSubject: Subject<any>;
    let movementProcessedSubject: Subject<any>;
    let tileUpdateSubject: Subject<any>;
    let combatUpdateSubject: Subject<any>;
    let interactionSubject: Subject<any>;
    let fleeSuccessSubject: Subject<any>;
    let attackEndSubject: Subject<any>;

    beforeEach(async () => {
        mockLobbyService = jasmine.createSpyObj('LobbyService', [
            'onGameStarted',
            'onTurnStarted',
            'onTurnEnded',
            'onMovementProcessed',
            'onError',
            'onLobbyUpdated',
            'onBoardChanged',
            'getCurrentPlayer',
            'disconnectFromRoom',
            'requestMovement',
            'requestEndTurn',
            'leaveGame',
            'updatePlayers',
            'getSocketId',
            'setCurrentPlayer',
            'onTileUpdate',
            'onCombatUpdate',
            'onInteraction',
            'onFleeSuccess',
            'onAttackEnd',
        ]);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['showError', 'showSuccess', 'showInfo']);
        mockActivatedRoute = { params: paramsSubject.asObservable() };

        gameStartedSubject = new Subject();
        turnStartedSubject = new Subject();
        lobbyUpdatedSubject = new Subject();
        errorSubject = new Subject();
        boardChangedSubject = new Subject();

        turnEndedSubject = new Subject();
        movementProcessedSubject = new Subject();
        tileUpdateSubject = new Subject();
        combatUpdateSubject = new Subject();
        interactionSubject = new Subject();
        fleeSuccessSubject = new Subject();
        attackEndSubject = new Subject();

        mockLobbyService.onTurnEnded.and.returnValue(turnEndedSubject);
        mockLobbyService.onMovementProcessed.and.returnValue(movementProcessedSubject);

        mockLobbyService.onGameStarted.and.returnValue(gameStartedSubject);
        mockLobbyService.onTurnStarted.and.returnValue(turnStartedSubject);
        mockLobbyService.onLobbyUpdated.and.returnValue(lobbyUpdatedSubject);
        mockLobbyService.onError.and.returnValue(errorSubject);
        mockLobbyService.onBoardChanged.and.returnValue(boardChangedSubject);
        mockLobbyService.onTileUpdate.and.returnValue(tileUpdateSubject);
        mockLobbyService.onCombatUpdate.and.returnValue(combatUpdateSubject);
        mockLobbyService.onInteraction.and.returnValue(interactionSubject);
        mockLobbyService.onFleeSuccess.and.returnValue(fleeSuccessSubject);
        mockLobbyService.onAttackEnd.and.returnValue(attackEndSubject);

        const mockPlayer: Player = {
            id: 'player1',
            name: 'Test Player',
            isHost: false,
            avatar: 'default-avatar.png',
            life: 100,
            speed: 5,
            attack: 10,
            defense: 8,
            maxLife: 0,
        };
        mockLobbyService.getCurrentPlayer.and.returnValue(mockPlayer);

        await TestBed.configureTestingModule({
            imports: [PlayingPageComponent],
            providers: [
                { provide: LobbyService, useValue: mockLobbyService },
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: NotificationService, useValue: mockNotificationService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayingPageComponent);
        component = fixture.componentInstance;

        // Initialize currentPlayer and gameState to valid defaults

        component.currentPlayer = mockPlayer;
        component.gameState = {
            players: [mockPlayer],
            currentPlayer: 'player1',
            board: [],
            id: '',
            turnCounter: 0,
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 0,
            currentPlayerActionPoints: 1,
        };

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with lobbyId from route params', fakeAsync(() => {
        paramsSubject.next({ id: 'test-lobby' });
        fixture.detectChanges();
        tick();

        expect(component.lobbyId).toBe('test-lobby');
        expect(mockLobbyService.onGameStarted).toHaveBeenCalled();
    }));

    it('should navigate to home if no lobbyId in params', fakeAsync(() => {
        paramsSubject.next({});
        fixture.detectChanges();
        tick();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/main']);
    }));

    it('should update gameState on game started', fakeAsync(() => {
        paramsSubject.next({ id: 'test-lobby' });
        fixture.detectChanges();
        tick();

        const mockGameState: GameState = {
            id: '',
            board: [],
            turnCounter: 0,
            players: [],
            currentPlayer: '',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 0,
            currentPlayerActionPoints: 0,
        };
        gameStartedSubject.next({ gameState: mockGameState });
        expect(component.gameState).toEqual(mockGameState);
    }));

    it('should notify current player on their turn', fakeAsync(() => {
        paramsSubject.next({ id: 'test-lobby' });
        fixture.detectChanges();
        tick();

        const mockPlayer = { id: 'player1', name: 'Test' } as Player;
        component.currentPlayer = mockPlayer;

        turnStartedSubject.next({
            gameState: {
                players: [mockPlayer], // Add players array
                currentPlayer: 'player1',
                board: [],
                availableMoves: [],
                shortestMoves: [],
                playerPositions: [],
                spawnPoints: [],
                currentPlayerMovementPoints: 5,
            },
            currentPlayer: 'player1',
        });

        expect(mockNotificationService.showSuccess).toHaveBeenCalledWith("C'est votre tour!");
    }));

    it('should notify other player turn', fakeAsync(() => {
        paramsSubject.next({ id: 'test-lobby' });
        fixture.detectChanges();
        tick();

        const otherPlayer = { id: 'player2', name: 'Other' } as Player;
        component.currentPlayer = { id: 'player1', name: 'Test' } as Player;

        turnStartedSubject.next({
            gameState: {
                players: [otherPlayer],
                currentPlayer: 'player2',
                board: [],
                availableMoves: [],
                shortestMoves: [],
                playerPositions: [],
                spawnPoints: [],
                currentPlayerMovementPoints: 5,
            },
            currentPlayer: 'player2',
        });

        expect(mockNotificationService.showInfo).toHaveBeenCalledWith("C'est le tour de Other");
    }));

    it('should call requestMovement on valid move request', () => {
        component.lobbyId = 'test-lobby';
        component.gameState = { currentPlayer: 'player1' } as GameState;
        component.currentPlayer = { id: 'player1' } as Player;
        const coordinates: Coordinates[] = [{ x: 1, y: 1 }];

        component.onMoveRequest(coordinates);
        expect(mockLobbyService.requestMovement).toHaveBeenCalledWith('test-lobby', coordinates);
    });

    it('should not call requestMovement if not current player turn', () => {
        component.gameState = { currentPlayer: 'player2' } as GameState;
        component.currentPlayer = { id: 'player1' } as Player;
        component.onMoveRequest([]);
        expect(mockLobbyService.requestMovement).not.toHaveBeenCalled();
    });

    it('should unsubscribe subscriptions on destroy', () => {
        const subscription = new Subscription();
        spyOn(subscription, 'unsubscribe');
        component['subscriptions'] = [subscription];

        component.ngOnDestroy();
        expect(subscription.unsubscribe).toHaveBeenCalled();
    });

    it('should sync current player with game state', () => {
        const gameStatePlayer: Player = {
            id: 'player1',
            name: 'Updated',
            avatar: 'avatar.png',
            life: 100,
            speed: 5,
            attack: 10,
            defense: 8,
            isHost: false,
            maxLife: 0,
        };

        const mockGameState: GameState = {
            id: 'game1',
            board: [],
            turnCounter: 0,
            players: [gameStatePlayer],
            currentPlayer: 'player1',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 5,
            currentPlayerActionPoints: 0,
        };

        component.gameState = mockGameState;
        component.currentPlayer = {
            id: 'player1',
            name: 'Original',
            avatar: 'old-avatar.png',
            life: 90,
            maxLife: 90,
            speed: 4,
            attack: 9,
            defense: 7,
            isHost: false,
        };

        component.syncCurrentPlayerWithGameState();
        expect(component.currentPlayer).toEqual(gameStatePlayer);
    });

    it('should get correct map size', () => {
        const baseState: GameState = {
            id: 'game1',
            turnCounter: 0,
            players: [],
            currentPlayer: '',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 0,
            board: [],
            currentPlayerActionPoints: 0,
        };

        component.gameState = { ...baseState, board: new Array(8).fill([]) };
        expect(component.getMapSize()).toBe('Small');

        component.gameState = { ...baseState, board: new Array(12).fill([]) };
        expect(component.getMapSize()).toBe('Medium');

        component.gameState = { ...baseState, board: new Array(20).fill([]) };
        expect(component.getMapSize()).toBe('Large');

        component.gameState = null!;
        expect(component.getMapSize()).toBe('Unknown');
    });

    it('should navigate home if player not in lobby', fakeAsync(() => {
        // First trigger route params to setup listeners
        paramsSubject.next({ id: 'test-lobby' });
        fixture.detectChanges();
        tick();

        // Now simulate lobby update
        component.lobbyId = 'test-lobby';
        component.currentPlayer = { id: 'player1' } as Player;
        lobbyUpdatedSubject.next({
            lobby: {
                id: 'test-lobby',
                players: [], // Empty players array
            },
        });

        expect(mockLobbyService.disconnectFromRoom).toHaveBeenCalledWith('test-lobby');
        expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
    }));

    it('should show error on error event', fakeAsync(() => {
        paramsSubject.next({ id: 'test-lobby' });
        fixture.detectChanges();
        tick();

        errorSubject.next('Test error');
        expect(mockNotificationService.showError).toHaveBeenCalledWith('Test error');
    }));
    it('should update gameState on turn ended', fakeAsync(() => {
        paramsSubject.next({ id: 'test-lobby' });
        fixture.detectChanges();
        tick();

        // Initial game state
        const initialGameState: GameState = {
            id: 'game1',
            board: [],
            turnCounter: 0,
            players: [],
            currentPlayer: 'player1',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 5,
            currentPlayerActionPoints: 0,
        };

        // Updated game state
        const updatedGameState: GameState = {
            ...initialGameState,
            turnCounter: 1,
            currentPlayerMovementPoints: 0,
        };

        // Simulate turn ended event
        turnEndedSubject.next({ gameState: updatedGameState });

        expect(component.gameState).toEqual(updatedGameState);
    }));

    it('should update gameState on movement processed', fakeAsync(() => {
        paramsSubject.next({ id: 'test-lobby' });
        fixture.detectChanges();
        tick();

        // Initial game state
        const initialGameState: GameState = {
            id: 'game1',
            board: [],
            turnCounter: 0,
            players: [],
            currentPlayer: 'player1',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 5,
            currentPlayerActionPoints: 0,
        };

        // Updated game state
        const updatedGameState: GameState = {
            ...initialGameState,
            currentPlayerMovementPoints: 3,
            playerPositions: [{ x: 1, y: 1 }],
        };

        // Simulate movement processed event
        movementProcessedSubject.next({ gameState: updatedGameState });

        expect(component.gameState).toEqual(updatedGameState);
    }));
});
