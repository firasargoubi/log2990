/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { PLAYING_PAGE, PLAYING_PAGE_DESCRIPTION } from '@app/Consts/app.constants';
import { PageUrl } from '@app/Consts/route-constants';
import { ActionService } from '@app/services/action.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { ObjectsTypes, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';

import { BehaviorSubject, of } from 'rxjs';
import { PlayingPageComponent } from './playing-page.component';

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
        amountEscape: 0,
    } as Player;

    const mockGameState: GameState = {
        id: 'abc',
        turnCounter: 0,
        shortestMoves: [],
        playerPositions: [{ x: 1, y: 1 }],
        spawnPoints: [],
        currentPlayerMovementPoints: 1,
        debug: false,
        players: [mockPlayer],
        currentPlayer: 'player1',
        board: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        deletedPlayers: [],
        currentPlayerActionPoints: 1,
        animation: false,
        availableMoves: [],
        combat: { isActive: false },
        gameMode: 'standard',
    } as GameState;

    const mockLobby: GameLobby = {
        id: mockLobbyId,
        players: [mockPlayer],
    } as GameLobby;

    const mockTile: Tile = { x: 1, y: 1, type: 0, object: 0 } as Tile;

    function setupMocks() {
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
            'teamCreated',
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

        mockLobbyService.teamCreated.and.returnValue(
            of({
                team1Server: [],
                team2Server: [],
            }),
        );

        TestBed.configureTestingModule({
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

        // Initialize component with default values for testing
        component.lobbyId = mockLobbyId;
        component.currentPlayer = { ...mockPlayer };
        component.gameState = { ...mockGameState };
    }

    beforeEach(async () => {
        await setupMocks();
    });

    afterEach(() => {
        // Cleanup to prevent side effects between tests
        if (component && component.ngOnDestroy) {
            component.ngOnDestroy();
        }
    });

    it('should create and initialize with default values', () => {
        expect(component).toBeTruthy();
        expect(component.action).toBe(false);
        expect(component.isInCombat).toBe(false);
        expect(component.opponent).toBeNull();
    });

    describe('Core functionality', () => {
        beforeEach(() => {
            // Reset spies for each test
            mockLobbyService.requestMovement.calls.reset();
            mockLobbyService.requestEndTurn.calls.reset();
            mockNotificationService.showError.calls.reset();
            mockNotificationService.showInfo.calls.reset();
            mockNotificationService.showSuccess.calls.reset();
        });

        it('should handle route params and navigate to home if no lobbyId', () => {
            mockActivatedRoute.params.next({});
            component.ngOnInit();
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
        });

        it('should initialize correctly with lobbyId', () => {
            // Initial setup is done in setupMocks
            component.ngOnInit();
            expect(component.lobbyId).toBe(mockLobbyId);
            expect(mockLobbyService.getCurrentPlayer).toHaveBeenCalled();
        });

        it('should handle player turn management', () => {
            component.gameState.currentPlayer = mockPlayer.id;
            expect(component.isCurrentPlayerTurn()).toBe(true);
            component.onEndTurn();
            expect(mockLobbyService.requestEndTurn).toHaveBeenCalledWith(mockLobbyId);

            // Not player's turn
            component.gameState.currentPlayer = 'other-player';
            expect(component.isCurrentPlayerTurn()).toBe(false);
            component.onEndTurn();
            expect(mockLobbyService.requestEndTurn.calls.count()).toBe(1); // No additional call
        });

        it('should handle movement requests', () => {
            const coordinates: Coordinates[] = [{ x: 1, y: 1 }];

            // Valid case
            component.gameState.currentPlayer = mockPlayer.id;
            component.onMoveRequest(coordinates);
            expect(mockLobbyService.requestMovement).toHaveBeenCalledWith(mockLobbyId, coordinates);

            // Not player's turn
            mockLobbyService.requestMovement.calls.reset();
            component.gameState.currentPlayer = 'other-player';
            component.onMoveRequest(coordinates);
            expect(mockLobbyService.requestMovement).not.toHaveBeenCalled();

            // Missing gameState
            mockLobbyService.requestMovement.calls.reset();
            component.gameState = undefined as any;
            component.onMoveRequest(coordinates);
            expect(mockLobbyService.requestMovement).not.toHaveBeenCalled();

            // Restore gameState for other tests
            component.gameState = { ...mockGameState };
        });

        it('should handle actions like opening and closing doors', () => {
            // Setup valid conditions
            component.gameState.currentPlayer = mockPlayer.id;
            component.gameState.currentPlayerActionPoints = 1;
            component.gameState.animation = false;

            // Test openDoor
            mockActionService.getActionType.and.returnValue('openDoor');
            component.onActionRequest(mockTile);
            expect(mockLobbyService.openDoor).toHaveBeenCalledWith(mockLobbyId, mockTile);

            // Test closeDoor
            mockActionService.getActionType.and.returnValue('closeDoor');
            component.onActionRequest(mockTile);
            expect(mockLobbyService.closeDoor).toHaveBeenCalledWith(mockLobbyId, mockTile);

            // No action points
            component.gameState.currentPlayerActionPoints = 0;
            component.onActionRequest(mockTile);
            expect(mockNotificationService.showError).toHaveBeenCalled();

            // Reset for next test
            component.gameState.currentPlayerActionPoints = 1;
            mockNotificationService.showError.calls.reset();

            // During animation
            component.gameState.animation = true;
            component.onActionRequest(mockTile);
            expect(mockLobbyService.closeDoor.calls.count()).toBe(1); // No additional call
            expect(mockNotificationService.showError).not.toHaveBeenCalled();

            // Reset animation state
            component.gameState.animation = false;
        });

        it('should handle battle actions', () => {
            // Setup for battle
            component.gameState.currentPlayer = mockPlayer.id;
            component.gameState.currentPlayerActionPoints = 1;
            component.gameState.animation = false;
            const opponent = { ...mockPlayer, id: 'opponent' };

            mockActionService.getActionType.and.returnValue('battle');
            mockActionService.findOpponent.and.returnValue(opponent);

            component.onActionRequest(mockTile);
            expect(component.isInCombat).toBe(true);
            expect(mockLobbyService.startCombat).toHaveBeenCalledWith(mockLobbyId, mockPlayer, opponent);
        });

        it('should toggle action flag in handleAction method', () => {
            component.action = false;
            component.handleAction();
            expect(component.action).toBe(true);

            component.handleAction();
            expect(component.action).toBe(false);
        });
    });

    describe('Information handling', () => {
        it('should handle player info messages', () => {
            component.onInfoSent('Player: TestPlayer');
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Joueur: TestPlayer'));
        });

        it('should handle item info messages', () => {
            component.onInfoSent(`Item: ${ObjectsTypes.SPAWN}`);
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Point de départ'));

            mockNotificationService.showInfo.calls.reset();
            component.onInfoSent('Item: 999');
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Objet inconnu'));
        });

        it('should handle tile type info messages', () => {
            component.onInfoSent('Tile Type: 1');
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Type de tuile: 1'));
        });

        it('should handle empty or invalid info', () => {
            component.onInfoSent('');
            expect(mockNotificationService.showError).toHaveBeenCalled();

            mockNotificationService.showInfo.calls.reset();
            mockNotificationService.showError.calls.reset();
            component.onInfoSent('Irrelevant info');
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Aucune information pertinente'));
        });
    });

    describe('Game state and player management', () => {
        it('should get current player information', () => {
            // Reset current player
            component.currentPlayer = undefined as any;

            // Test with valid player
            mockLobbyService.getCurrentPlayer.and.returnValue({ ...mockPlayer });
            component.getCurrentPlayer();
            expect(component.currentPlayer).toEqual(mockPlayer);

            // Test with different socket ID
            const differentSocketId = 'different-socket-id';
            mockLobbyService.getSocketId.and.returnValue(differentSocketId);
            component.getCurrentPlayer();
            expect(component.currentPlayer.id).toBe(differentSocketId);

            // Test with no player
            mockLobbyService.getCurrentPlayer.and.returnValue(null);
            const prevPlayer = { ...component.currentPlayer };
            component.getCurrentPlayer();
            expect(component.currentPlayer).toEqual(prevPlayer); // Should keep previous value
        });

        it('should sync current player with game state', () => {
            // Test with player in game state
            const updatedPlayer = { ...mockPlayer, life: 80 };
            component.gameState = {
                ...mockGameState,
                players: [updatedPlayer],
            };
            component.currentPlayer = { ...mockPlayer };
            component.syncCurrentPlayerWithGameState();
            expect(component.currentPlayer).toEqual(updatedPlayer);
            expect(mockLobbyService.setCurrentPlayer).toHaveBeenCalledWith(updatedPlayer);

            // Test with no matching player
            mockLobbyService.setCurrentPlayer.calls.reset();
            component.gameState.players = [{ ...mockPlayer, id: 'different-id' }];
            component.syncCurrentPlayerWithGameState();
            expect(mockLobbyService.setCurrentPlayer).not.toHaveBeenCalled();

            // Test with missing gameState
            mockLobbyService.setCurrentPlayer.calls.reset();
            component.gameState = undefined as any;
            component.syncCurrentPlayerWithGameState();
            expect(mockLobbyService.setCurrentPlayer).not.toHaveBeenCalled();
        });

        it('should update game state with player info', () => {
            // Test with active combat
            const combatGameState = {
                ...mockGameState,
                combat: { isActive: true },
            };
            component.isInCombat = true;
            component['updateGameState'](combatGameState);
            expect(component.isInCombat).toBe(true);

            // Test with inactive combat
            const noCombatGameState = {
                ...mockGameState,
                combat: { isActive: false },
            };
            component['updateGameState'](noCombatGameState);
            expect(component.isInCombat).toBe(false);
        });

        it('should notify players about turns', () => {
            // Current player's turn
            component['notifyPlayerTurn'](mockPlayer.id);
            expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(PLAYING_PAGE_DESCRIPTION.yourTurn);

            // Other player's turn
            mockNotificationService.showSuccess.calls.reset();
            const otherPlayer = { ...mockPlayer, id: 'other-id', name: 'OtherPlayer' };
            component.gameState.players = [mockPlayer, otherPlayer];
            component['notifyPlayerTurn'](otherPlayer.id);
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringMatching(otherPlayer.name));

            // Unknown player
            mockNotificationService.showInfo.calls.reset();
            mockNotificationService.showSuccess.calls.reset();
            component['notifyPlayerTurn']('unknown-id');
            expect(mockNotificationService.showInfo).not.toHaveBeenCalled();
            expect(mockNotificationService.showSuccess).not.toHaveBeenCalled();
        });
    });

    describe('Game operations', () => {
        it('should handle debug mode toggling', () => {
            // Test for host player
            component.currentPlayer.isHost = true;
            const keyEvent = new KeyboardEvent('keydown', { key: PLAYING_PAGE.debugKey });
            component.handleKeyboardEvent(keyEvent);
            expect(mockLobbyService.setDebug).toHaveBeenCalledWith(mockLobbyId, true);

            // Test toggle off
            component.handleKeyboardEvent(keyEvent);
            expect(mockLobbyService.setDebug).toHaveBeenCalledWith(mockLobbyId, false);

            // Test for non-host player
            mockLobbyService.setDebug.calls.reset();
            component.currentPlayer.isHost = false;
            component.handleKeyboardEvent(keyEvent);
            expect(mockLobbyService.setDebug).not.toHaveBeenCalled();
        });

        it('should handle abandon game', () => {
            // Normal case
            component.gameState.animation = false;
            component.abandon();
            expect(mockLobbyService.disconnect).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });

            // During animation
            mockLobbyService.disconnect.calls.reset();
            mockRouter.navigate.calls.reset();
            component.gameState.animation = true;
            component.abandon();
            expect(mockLobbyService.disconnect).not.toHaveBeenCalled();

            // Without gameState
            mockRouter.navigate.calls.reset();
            component.gameState = undefined as any;
            component.abandon();
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
        });

        it('should test ngOnDestroy', () => {
            const abandonSpy = spyOn(component, 'abandon');
            component.ngOnDestroy();
            expect(abandonSpy).toHaveBeenCalled();
        });
    });

    describe('Game abilities', () => {
        it('should check for available actions', () => {
            // With door
            component.gameState.board = [
                [0, 0, 0],
                [0, 0, TileTypes.DoorClosed],
                [0, 0, 0],
            ];
            component.gameState.playerPositions = [{ x: 1, y: 1 }];
            component.gameState.currentPlayerActionPoints = 1;
            expect(component['canPerformAction']()).toBe(true);

            // With adjacent player
            component.gameState.board = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ];
            component.gameState.playerPositions = [
                { x: 1, y: 1 }, // Current player
                { x: 1, y: 2 }, // Adjacent player
            ];
            expect(component['canPerformAction']()).toBe(true);

            // No action points
            component.gameState.currentPlayerActionPoints = 0;
            expect(component['canPerformAction']()).toBe(false);

            // No doors or adjacent players
            component.gameState.currentPlayerActionPoints = 1;
            component.gameState.playerPositions = [{ x: 1, y: 1 }];
            expect(component['canPerformAction']()).toBe(false);

            // Player at board edge
            component.gameState.playerPositions = [{ x: 0, y: 0 }];
            expect(component['canPerformAction']()).toBe(false);
        });
    });

    describe('Game event subscriptions', () => {
        it('should handle flee event', fakeAsync(() => {
            // Setup
            component.isInCombat = true;
            const fleeEvent = { fleeingPlayer: mockPlayer };
            mockLobbyService.onFleeSuccess.and.returnValue(of(fleeEvent));

            // Run setupGameListeners
            component['setupGameListeners']();
            tick();

            // Assertions
            expect(component.isInCombat).toBe(false);
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Vous avez fuit'));

            // Test with other player
            mockNotificationService.showInfo.calls.reset();
            const otherPlayer = { ...mockPlayer, name: 'OtherPlayer' };
            const otherFleeEvent = { fleeingPlayer: otherPlayer };
            mockLobbyService.onFleeSuccess.and.returnValue(of(otherFleeEvent));

            component['setupGameListeners']();
            tick();

            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('OtherPlayer a fui'));
        }));

        it('should handle lobby updated event', fakeAsync(() => {
            // Test player found in updated lobby
            const updatedLobby = {
                ...mockLobby,
                players: [{ ...mockPlayer, life: 80 }],
            };
            mockLobbyService.onLobbyUpdated.and.returnValue(of({ lobby: updatedLobby }));

            component['setupGameListeners']();
            tick();

            expect(mockLobbyService.updatePlayers).toHaveBeenCalledWith(mockLobbyId, updatedLobby.players);

            // Test player not found
            mockLobbyService.updatePlayers.calls.reset();
            const lobbyWithoutPlayer = {
                ...mockLobby,
                players: [{ ...mockPlayer, id: 'different-id' }],
            };
            mockLobbyService.onLobbyUpdated.and.returnValue(of({ lobby: lobbyWithoutPlayer }));

            component['setupGameListeners']();
            tick();

            expect(mockLobbyService.disconnectFromRoom).toHaveBeenCalledWith(mockLobbyId);
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
        }));

        it('should handle game over event', fakeAsync(() => {
            const abandonSpy = spyOn(component, 'abandon');
            mockLobbyService.onGameOver.and.returnValue(of({ winner: 'Winner' }));

            component['setupGameListeners']();
            tick();

            expect(abandonSpy).toHaveBeenCalled();
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Winner'));
        }));

        it('should handle combat events', fakeAsync(() => {
            // Test combat start
            mockLobbyService.onStartCombat.and.returnValue(of({ firstPlayer: mockPlayer }));
            component['setupGameListeners']();
            tick();
            expect(component.isInCombat).toBe(false);

            // Test combat end
            component.isInCombat = true;
            mockLobbyService.onCombatEnded.and.returnValue(of({ loser: mockPlayer }));
            component['setupGameListeners']();
            tick();
            expect(component.isInCombat).toBe(false);
            expect(component.currentPlayer.amountEscape).toBe(0);
        }));

        it('should handle turn started event', fakeAsync(() => {
            const notifyPlayerTurnSpy = spyOn<any>(component, 'notifyPlayerTurn');
            const updateGameStateSpy = spyOn<any>(component, 'updateGameState');

            mockLobbyService.onTurnStarted.and.returnValue(
                of({
                    gameState: mockGameState,
                    currentPlayer: mockPlayer.id,
                    availableMoves: [],
                }),
            );

            component['setupGameListeners']();
            tick();

            expect(updateGameStateSpy).toHaveBeenCalledWith(mockGameState);
            expect(notifyPlayerTurnSpy).toHaveBeenCalledWith(mockPlayer.id);
        }));

        it('should handle movement processed event', fakeAsync(() => {
            const updateGameStateSpy = spyOn<any>(component, 'updateGameState');

            // Set up for auto end turn
            component.gameState = {
                ...mockGameState,
                currentPlayerMovementPoints: 1,
                currentPlayerActionPoints: 1,
                teams: { team1: [], team2: [] }, // Ensure teams exist
            };
            component.gameState.currentPlayer = mockPlayer.id;
            component.currentPlayer = mockPlayer;

            mockLobbyService.onMovementProcessed.and.returnValue(
                of({
                    gameState: component.gameState,
                    playerMoved: mockPlayer.id,
                    newPosition: { x: 1, y: 1 },
                }),
            );

            component['setupGameListeners']();
            tick();

            expect(updateGameStateSpy).toHaveBeenCalledWith(component.gameState);
        }));
    });

    describe('Getters and properties', () => {
        it('should return correct values from getters', () => {
            // isAnimated getter
            component.gameState.animation = true;
            expect(component.isAnimated).toBe(true);
            component.gameState.animation = false;
            expect(component.isAnimated).toBe(false);

            // isPlayerTurn getter
            component.gameState.currentPlayer = mockPlayer.id;
            expect(component.isPlayerTurn).toBe(true);
            component.gameState.currentPlayer = 'other-id';
            expect(component.isPlayerTurn).toBe(false);

            // Game name
            expect(component.getGameName()).toBe(PLAYING_PAGE_DESCRIPTION.gameName);

            // Player count
            expect(component.getPlayerCount()).toBe(1);

            // Active player name
            component.gameState.currentPlayer = mockPlayer.id;
            expect(component.getActivePlayer()).toBe(mockPlayer.name);
            component.gameState.currentPlayer = 'unknown';
            expect(component.getActivePlayer()).toBe('Unknown');

            // Players list
            expect(component.getPlayers()).toBe(component.gameState.players);

            // Deleted players
            expect(component.getDeletedPlayers()).toEqual([]);
            const deletedPlayer = { ...mockPlayer, id: 'deleted' };
            component.gameState.deletedPlayers = [deletedPlayer];
            expect(component.getDeletedPlayers()).toEqual([deletedPlayer]);
        });
    });
});
