/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayingPageComponent } from './playing-page.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionService } from '@app/services/action.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { BehaviorSubject, of } from 'rxjs';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { PageUrl } from '@app/Consts/route-constants';
import { PLAYING_PAGE_DESCRIPTION } from '@app/Consts/app.constants';
import { ObjectsTypes } from '@common/game.interface';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PlayingPageComponent', () => {
    let component: PlayingPageComponent;
    let fixture: ComponentFixture<PlayingPageComponent>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockActionService: jasmine.SpyObj<ActionService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockActivatedRoute: { params: BehaviorSubject<any> };

    // Mock data
    const mockLobbyId = 'test-lobby-id';
    const mockPlayer: Player = {
        id: 'player1',
        name: 'TestPlayer',
        isHost: true,
        life: 100,
        maxLife: 100,
    } as Player;

    const mockGameState: GameState = {
        id: 'abc',
        turnCounter: 0,
        shortestMoves: [],
        playerPositions: [],
        spawnPoints: [],
        currentPlayerMovementPoints: 1,
        debug: false,
        players: [mockPlayer],
        currentPlayer: 'player1',
        board: [[]],
        deletedPlayers: [],
        currentPlayerActionPoints: 1,
        animation: false,
        availableMoves: [],
    } as GameState;

    const mockLobby: GameLobby = {
        id: mockLobbyId,
        players: [mockPlayer],
    } as GameLobby;

    beforeEach(async () => {
        mockLobbyService = jasmine.createSpyObj('LobbyService', [
            'getCurrentPlayer',
            'getSocketId',
            'setCurrentPlayer',
            'disconnectFromRoom',
            'updatePlayers',
            'disconnect',
            'requestMovement',
            'requestEndTurn',
            'openDoor',
            'closeDoor',
            'startCombat',
            'setDebug',
            'onStartCombat',
            'onCombatEnded',
            'onTurnStarted',
            'onMovementProcessed',
            'onError',
            'onLobbyUpdated',
            'onBoardChanged',
            'onFleeSuccess',
            'onGameOver',
        ]);

        mockActionService = jasmine.createSpyObj('ActionService', ['getActionType', 'findOpponent']);

        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['showError', 'showInfo', 'showSuccess']);
        mockActivatedRoute = { params: new BehaviorSubject({ id: mockLobbyId }) };

        // Setup default returns for mock methods
        mockLobbyService.getCurrentPlayer.and.returnValue(mockPlayer);
        mockLobbyService.getSocketId.and.returnValue(mockPlayer.id);

        // Setup observable returns
        mockLobbyService.onStartCombat.and.returnValue(of({ firstPlayer: mockPlayer }));
        mockLobbyService.onCombatEnded.and.returnValue(of({ loser: mockPlayer }));
        mockLobbyService.onTurnStarted.and.returnValue(of({ gameState: mockGameState, currentPlayer: mockPlayer.id, availableMoves: [] }));
        mockLobbyService.onMovementProcessed.and.returnValue(
            of({ gameState: mockGameState, playerMoved: mockPlayer.id, newPosition: { x: 1, y: 1 } }),
        );
        mockLobbyService.onError.and.returnValue(of('Test error'));
        mockLobbyService.onLobbyUpdated.and.returnValue(of({ lobby: mockLobby }));
        mockLobbyService.onBoardChanged.and.returnValue(of({ gameState: mockGameState }));
        mockLobbyService.onFleeSuccess.and.returnValue(of({ fleeingPlayer: mockPlayer }));
        mockLobbyService.onGameOver.and.returnValue(of({ winner: mockPlayer.name }));

        await TestBed.configureTestingModule({
            imports: [CommonModule],
            providers: [
                { provide: LobbyService, useValue: mockLobbyService },
                { provide: ActionService, useValue: mockActionService },
                { provide: Router, useValue: mockRouter },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayingPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initialization', () => {
        beforeEach(() => {
            component.lobbyId = mockLobbyId;
            component.currentPlayer = mockPlayer;
            component.gameState = mockGameState;
        });

        it('should initialize with default values', () => {
            fixture.detectChanges();
            expect(component.action).toBe(false);
            expect(component.isInCombat).toBe(false);
            expect(component.opponent).toBeNull();
        });

        it('should set up game listeners and get current player on init with valid lobbyId', () => {
            fixture.detectChanges();

            expect(component.lobbyId).toBe(mockLobbyId);
            expect(mockLobbyService.getCurrentPlayer).toHaveBeenCalled();
            expect(component.currentPlayer).toEqual(mockPlayer);
        });

        it('should navigate to home if no lobbyId provided', () => {
            mockActivatedRoute.params.next({});
            fixture.detectChanges();

            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home, { replaceUrl: true }]);
        });

        it('should navigate to home if no current player', () => {
            mockLobbyService.getCurrentPlayer.and.returnValue(null);
            fixture.detectChanges();

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home', { replaceUrl: true }]);
        });

        it('should update socket ID if it differs from player ID', () => {
            const differentSocketId = 'different-socket-id';
            mockLobbyService.getSocketId.and.returnValue(differentSocketId);
            fixture.detectChanges();

            expect(component.currentPlayer.id).toBe(differentSocketId);
        });
    });

    describe('Player turn management', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.gameState = { ...mockGameState };
            component.currentPlayer = { ...mockPlayer };
            component.lobbyId = mockLobbyId;
        });

        it('should identify correctly if it is the current player turn', () => {
            // Make sure currentPlayer and gameState are properly set
            component.currentPlayer = { ...mockPlayer };
            component.gameState = { ...mockGameState, currentPlayer: mockPlayer.id };

            expect(component.isCurrentPlayerTurn()).toBe(true);

            component.gameState.currentPlayer = 'other-player';
            expect(component.isCurrentPlayerTurn()).toBe(false);
        });

        it('should end turn when requested', () => {
            // Make sure currentPlayer and gameState are properly set
            component.currentPlayer = { ...mockPlayer };
            component.gameState = { ...mockGameState, currentPlayer: mockPlayer.id };
            component.lobbyId = mockLobbyId;

            component.onEndTurn();

            expect(mockLobbyService.requestEndTurn).toHaveBeenCalledWith(mockLobbyId);
        });

        it("should not end turn if it is not the player's turn", () => {
            component.gameState.currentPlayer = 'other-player';
            component.onEndTurn();

            expect(mockLobbyService.requestEndTurn).not.toHaveBeenCalled();
        });
    });

    describe('Movement', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.gameState = { ...mockGameState };
            component.currentPlayer = { ...mockPlayer };
            component.lobbyId = mockLobbyId;
        });

        it('should request movement with coordinates', () => {
            // Make sure currentPlayer and gameState are properly set
            component.currentPlayer = { ...mockPlayer };
            component.gameState = { ...mockGameState, currentPlayer: mockPlayer.id };

            const coordinates: Coordinates[] = [{ x: 1, y: 1 }];
            component.onMoveRequest(coordinates);

            expect(mockLobbyService.requestMovement).toHaveBeenCalledWith(mockLobbyId, coordinates);
        });

        it("should not request movement if it is not the player's turn", () => {
            component.gameState.currentPlayer = 'other-player';
            const coordinates: Coordinates[] = [{ x: 1, y: 1 }];
            component.onMoveRequest(coordinates);

            expect(mockLobbyService.requestMovement).not.toHaveBeenCalled();
        });
    });

    describe('Action requests', () => {
        const mockTile: Tile = { x: 1, y: 1, type: 0, object: 0 } as Tile;
        const mockOpponent: Player = { id: 'opponent', name: 'Opponent' } as Player;

        beforeEach(() => {
            fixture.detectChanges();
            component.gameState = { ...mockGameState };
            component.currentPlayer = { ...mockPlayer };
            component.lobbyId = mockLobbyId;
            component.gameState.currentPlayerActionPoints = 1;
            mockActionService.getActionType.and.returnValue('');
        });

        it("should not process actions when it is not the player's turn", () => {
            component.gameState.currentPlayer = 'other-player';
            component.onActionRequest(mockTile);

            expect(mockActionService.getActionType).not.toHaveBeenCalled();
        });

        it('should not process actions when the game is animating', () => {
            component.gameState.animation = true;
            component.onActionRequest(mockTile);

            expect(mockActionService.getActionType).not.toHaveBeenCalled();
        });

        it('should show error when player has no action points', () => {
            // Make sure currentPlayer and gameState are properly set
            component.gameState = { ...mockGameState, currentPlayer: mockPlayer.id, currentPlayerActionPoints: 0 };

            component.onActionRequest(mockTile);

            expect(mockNotificationService.showError).toHaveBeenCalled();
            expect(mockActionService.getActionType).not.toHaveBeenCalled();
        });

        it('should handle open door action', () => {
            // Make sure getActionType returns the correct value
            mockActionService.getActionType.and.returnValue('openDoor');

            component.onActionRequest(mockTile);

            expect(mockLobbyService.openDoor).toHaveBeenCalledWith(mockLobbyId, mockTile);
        });

        it('should handle close door action', () => {
            mockActionService.getActionType.and.returnValue('closeDoor');

            component.onActionRequest(mockTile);

            expect(mockLobbyService.closeDoor).toHaveBeenCalledWith(mockLobbyId, mockTile);
        });

        it('should handle battle action with opponent', () => {
            mockActionService.getActionType.and.returnValue('battle');
            mockActionService.findOpponent.and.returnValue(mockOpponent);

            component.onActionRequest(mockTile);

            expect(component.isInCombat).toBe(true);
            expect(mockLobbyService.startCombat).toHaveBeenCalledWith(mockLobbyId, mockPlayer, mockOpponent);
        });
    });

    describe('Info handling', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should show error for empty tile info', () => {
            component.onInfoSent('');

            expect(mockNotificationService.showError).toHaveBeenCalled();
        });

        it('should process player info correctly', () => {
            component.onInfoSent('Player: TestPlayer');

            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringMatching(/Joueur: TestPlayer/));
        });

        it('should process item info correctly', () => {
            // Test with known item (spawn point)
            component.onInfoSent(`Item: ${ObjectsTypes.SPAWN}`);

            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringMatching(/Point de départ/));

            // Test with unknown item
            mockNotificationService.showInfo.calls.reset();
            component.onInfoSent('Item: 999');

            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringMatching(/Objet inconnu/));
        });

        it('should process tile type info correctly', () => {
            component.onInfoSent('Tile Type: 1');

            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringMatching(/Type de tuile: 1/));
        });
    });

    describe('Game state updates', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.gameState = { ...mockGameState };
            component.currentPlayer = { ...mockPlayer };
        });

        it('should update game state and sync current player', () => {
            const updatedGameState: GameState = {
                ...mockGameState,
                players: [{ ...mockPlayer, life: 90 }],
            };

            component['updateGameState'](updatedGameState);

            expect(component.gameState).toEqual(updatedGameState);
            expect(component.currentPlayer.life).toBe(90);
            expect(mockLobbyService.setCurrentPlayer).toHaveBeenCalledWith(component.currentPlayer);
        });

        it('should update combat state based on game state', () => {
            component.isInCombat = true;
            const updatedGameState: GameState = {
                ...mockGameState,
            };

            component['updateGameState'](updatedGameState);

            expect(component.isInCombat).toBe(false);
        });
    });

    describe('Debug mode', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.currentPlayer = { ...mockPlayer, isHost: true };
            component.lobbyId = mockLobbyId;
        });

        it('should toggle debug mode for host player', () => {
            const event = new KeyboardEvent('keydown', { key: 'd' });
            component.handleKeyboardEvent(event);

            expect(mockLobbyService.setDebug).toHaveBeenCalledWith(mockLobbyId, true);

            mockLobbyService.setDebug.calls.reset();
            component.handleKeyboardEvent(event);

            expect(mockLobbyService.setDebug).toHaveBeenCalledWith(mockLobbyId, false);
        });

        it('should not toggle debug mode for non-host player', () => {
            component.currentPlayer.isHost = false;
            const event = new KeyboardEvent('keydown', { key: 'd' });
            component.handleKeyboardEvent(event);

            expect(mockLobbyService.setDebug).not.toHaveBeenCalled();
        });
    });

    describe('Game status getters', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.gameState = { ...mockGameState };
        });

        it('should return correct game name', () => {
            expect(component.getGameName()).toBe(PLAYING_PAGE_DESCRIPTION.gameName);
        });

        it('should return player count', () => {
            expect(component.getPlayerCount()).toBe(1);
        });

        it('should return active player name', () => {
            expect(component.getActivePlayer()).toBe(mockPlayer.name);

            component.gameState.currentPlayer = 'unknown';
            expect(component.getActivePlayer()).toBe('Unknown');
        });

        it('should return players array', () => {
            expect(component.getPlayers()).toEqual(mockGameState.players);
        });

        it('should return deleted players array', () => {
            expect(component.getDeletedPlayers()).toEqual([]);

            const deletedPlayer = { ...mockPlayer, id: 'deleted' };
            component.gameState.deletedPlayers = [deletedPlayer];
            expect(component.getDeletedPlayers()).toEqual([deletedPlayer]);
        });
    });

    describe('Cleanup and abandonment', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.gameState = mockGameState;
            component.currentPlayer = mockPlayer;
            component.lobbyId = mockLobbyId;
        });

        it('should disconnect and navigate to home on abandon', () => {
            component.gameState.animation = false;
            component.abandon();

            expect(mockLobbyService.disconnect).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
        });

        it('should not disconnect if game is animating', () => {
            component.gameState.animation = true;
            component.abandon();

            expect(mockLobbyService.disconnect).not.toHaveBeenCalled();
        });

        it('should unsubscribe from all subscriptions on ngOnDestroy', () => {
            const abandonSpy = spyOn(component, 'abandon');
            component.ngOnDestroy();

            expect(abandonSpy).toHaveBeenCalled();
        });
    });

    describe('Event handling', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.lobbyId = mockLobbyId;
            component.currentPlayer = mockPlayer;
        });

        it('should handle lobby updated event and update players', () => {
            const updatedLobby: GameLobby = {
                ...mockLobby,
                players: [{ ...mockPlayer, life: 80 }],
            };

            mockLobbyService.onLobbyUpdated.and.returnValue(of({ lobby: updatedLobby }));
            component['setupGameListeners']();

            expect(mockLobbyService.updatePlayers).toHaveBeenCalledWith(mockLobbyId, updatedLobby.players);
        });

        it('should disconnect and navigate home if player not found in updated lobby', () => {
            const updatedLobby: GameLobby = {
                ...mockLobby,
                players: [{ ...mockPlayer, id: 'other-player' }],
            };

            mockLobbyService.onLobbyUpdated.and.returnValue(of({ lobby: updatedLobby }));
            component['setupGameListeners']();

            expect(mockLobbyService.disconnectFromRoom).toHaveBeenCalledWith(mockLobbyId);
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
        });

        it('should handle flee success and show appropriate notification', () => {
            // When current player is the fleeing player
            component.currentPlayer = { ...mockPlayer };
            mockLobbyService.onFleeSuccess.and.returnValue(of({ fleeingPlayer: component.currentPlayer }));
            component['setupGameListeners']();

            expect(component.isInCombat).toBe(false);
            expect(component.currentPlayer.life).toBe(component.currentPlayer.maxLife);
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith('Vous avez fuit le combat.');

            // When another player is the fleeing player
            mockNotificationService.showInfo.calls.reset();
            const otherPlayer = { ...mockPlayer, name: 'OtherPlayer' };
            mockLobbyService.onFleeSuccess.and.returnValue(of({ fleeingPlayer: otherPlayer }));
            component['setupGameListeners']();

            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(`${otherPlayer.name} a fui le combat.`);
        });

        it('should handle game over and navigate home', () => {
            spyOn(component, 'abandon');
            mockLobbyService.onGameOver.and.returnValue(of({ winner: 'Winner' }));
            component['setupGameListeners']();

            expect(component.abandon).toHaveBeenCalled();
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Winner'));
        });
    });

    describe('Player turn notifications', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.currentPlayer = mockPlayer;
            component.gameState = mockGameState;
        });

        it('should show success notification for current player turn', () => {
            component['notifyPlayerTurn'](mockPlayer.id);

            expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(PLAYING_PAGE_DESCRIPTION.yourTurn);
        });

        it('should show info notification for other player turn', () => {
            const otherPlayer = { ...mockPlayer, id: 'other-player' };
            component.gameState.players.push(otherPlayer);
            component['notifyPlayerTurn'](otherPlayer.id);

            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining(otherPlayer.name));
        });
    });

    describe('Getters', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.gameState = mockGameState;
        });

        it('should return correct isAnimated value', () => {
            expect(component.isAnimated).toBe(false);

            component.gameState.animation = true;
            expect(component.isAnimated).toBe(true);
        });

        it('should return correct isPlayerTurn value', () => {
            expect(component.isPlayerTurn).toBe(true);

            component.gameState.currentPlayer = 'other-player';
            expect(component.isPlayerTurn).toBe(false);
        });
    });
});
