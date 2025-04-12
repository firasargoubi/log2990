/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { PLAYING_PAGE, PLAYING_PAGE_DESCRIPTION } from '@app/consts/app-constants';
import { PageUrl } from '@app/consts/route-constants';
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

        mockLobbyService.getCurrentPlayer.and.returnValue(mockPlayer);
        mockLobbyService.getSocketId.and.returnValue(mockPlayer.id);

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
                updatedGameState: {} as GameState,
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

        component.lobbyId = mockLobbyId;
        component.currentPlayer = { ...mockPlayer };
        component.gameState = { ...mockGameState };
    }

    beforeEach(async () => {
        await setupMocks();
    });

    afterEach(() => {
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
            component.ngOnInit();
            expect(component.lobbyId).toBe(mockLobbyId);
            expect(mockLobbyService.getCurrentPlayer).toHaveBeenCalled();
        });

        it('should handle player turn management', () => {
            component.gameState.currentPlayer = mockPlayer.id;
            expect(component.isCurrentPlayerTurn()).toBe(true);
            component.onEndTurn();
            expect(mockLobbyService.requestEndTurn).toHaveBeenCalledWith(mockLobbyId);

            component.gameState.currentPlayer = 'other-player';
            expect(component.isCurrentPlayerTurn()).toBe(false);
            component.onEndTurn();
            expect(mockLobbyService.requestEndTurn.calls.count()).toBe(1);
        });

        it('should handle movement requests', () => {
            const coordinates: Coordinates[] = [{ x: 1, y: 1 }];

            component.gameState.currentPlayer = mockPlayer.id;
            component.onMoveRequest(coordinates);
            expect(mockLobbyService.requestMovement).toHaveBeenCalledWith(mockLobbyId, coordinates);

            mockLobbyService.requestMovement.calls.reset();
            component.gameState.currentPlayer = 'other-player';
            component.onMoveRequest(coordinates);
            expect(mockLobbyService.requestMovement).not.toHaveBeenCalled();

            mockLobbyService.requestMovement.calls.reset();
            component.gameState = undefined as any;
            component.onMoveRequest(coordinates);
            expect(mockLobbyService.requestMovement).not.toHaveBeenCalled();

            component.gameState = { ...mockGameState };
        });

        it('should handle actions like opening and closing doors', () => {
            component.gameState.currentPlayer = mockPlayer.id;
            component.gameState.currentPlayerActionPoints = 1;
            component.gameState.animation = false;

            mockActionService.getActionType.and.returnValue('openDoor');
            component.onActionRequest(mockTile);
            expect(mockLobbyService.openDoor).toHaveBeenCalledWith(mockLobbyId, mockTile);

            mockActionService.getActionType.and.returnValue('closeDoor');
            component.onActionRequest(mockTile);
            expect(mockLobbyService.closeDoor).toHaveBeenCalledWith(mockLobbyId, mockTile);

            component.gameState.currentPlayerActionPoints = 0;
            component.onActionRequest(mockTile);
            expect(mockNotificationService.showError).toHaveBeenCalled();

            component.gameState.currentPlayerActionPoints = 1;
            mockNotificationService.showError.calls.reset();

            component.gameState.animation = true;
            component.onActionRequest(mockTile);
            expect(mockLobbyService.closeDoor.calls.count()).toBe(1);
            expect(mockNotificationService.showError).not.toHaveBeenCalled();

            component.gameState.animation = false;
        });

        it('should handle battle actions', () => {
            component.gameState.currentPlayer = mockPlayer.id;
            component.gameState.currentPlayerActionPoints = 1;
            component.gameState.animation = false;
            const opponent = { ...mockPlayer, id: 'opponent' };

            mockActionService.getActionType.and.returnValue('battle');
            mockActionService.findOpponent.and.returnValue(opponent);

            component.onActionRequest(mockTile);
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
            component.currentPlayer = undefined as any;

            mockLobbyService.getCurrentPlayer.and.returnValue({ ...mockPlayer });
            component.getCurrentPlayer();
            expect(component.currentPlayer).toEqual(mockPlayer);
            const differentSocketId = 'different-socket-id';
            mockLobbyService.getSocketId.and.returnValue(differentSocketId);
            component.getCurrentPlayer();
            expect(component.currentPlayer.id).toBe(differentSocketId);
            mockLobbyService.getCurrentPlayer.and.returnValue(null);
            const prevPlayer = { ...component.currentPlayer };
            component.getCurrentPlayer();
            expect(component.currentPlayer).toEqual(prevPlayer);
        });

        it('should sync current player with game state', () => {
            const updatedPlayer = { ...mockPlayer, life: 80 };
            component.gameState = {
                ...mockGameState,
                players: [updatedPlayer],
            };
            component.currentPlayer = { ...mockPlayer };
            component.syncCurrentPlayerWithGameState();
            expect(component.currentPlayer).toEqual(updatedPlayer);
            expect(mockLobbyService.setCurrentPlayer).toHaveBeenCalledWith(updatedPlayer);

            mockLobbyService.setCurrentPlayer.calls.reset();
            component.gameState.players = [{ ...mockPlayer, id: 'different-id' }];
            component.syncCurrentPlayerWithGameState();
            expect(mockLobbyService.setCurrentPlayer).not.toHaveBeenCalled();

            mockLobbyService.setCurrentPlayer.calls.reset();
            component.gameState = undefined as any;
            component.syncCurrentPlayerWithGameState();
            expect(mockLobbyService.setCurrentPlayer).not.toHaveBeenCalled();
        });

        it('should update game state with player info', () => {
            const combatGameState = {
                ...mockGameState,
                combat: { isActive: true },
            };
            component.isInCombat = true;
            component['updateGameState'](combatGameState);
            expect(component.isInCombat).toBe(true);
        });

        it('should notify players about turns', () => {
            component['notifyPlayerTurn'](mockPlayer.id);
            expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(PLAYING_PAGE_DESCRIPTION.yourTurn);

            mockNotificationService.showSuccess.calls.reset();
            const otherPlayer = { ...mockPlayer, id: 'other-id', name: 'OtherPlayer' };
            component.gameState.players = [mockPlayer, otherPlayer];
            component['notifyPlayerTurn'](otherPlayer.id);
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringMatching(otherPlayer.name));

            mockNotificationService.showInfo.calls.reset();
            mockNotificationService.showSuccess.calls.reset();
            component['notifyPlayerTurn']('unknown-id');
            expect(mockNotificationService.showInfo).not.toHaveBeenCalled();
            expect(mockNotificationService.showSuccess).not.toHaveBeenCalled();
        });
    });

    describe('Game operations', () => {
        it('should toggle debug mode when host and not typing in an input/textarea/contenteditable', () => {
            component.currentPlayer.isHost = true;

            const inputTargets = [{ tagName: 'INPUT' }, { tagName: 'TEXTAREA' }, { tagName: 'DIV', getAttribute: () => 'true' }];

            for (const target of inputTargets) {
                const event = new KeyboardEvent('keydown', {
                    key: PLAYING_PAGE.debugKey,
                });
                Object.defineProperty(event, 'target', { value: target });
                component.handleKeyboardEvent(event);
            }

            expect(mockLobbyService.setDebug).not.toHaveBeenCalled();

            const safeTarget = {
                tagName: 'DIV',
                getAttribute: () => null,
            };

            const debugEvent = new KeyboardEvent('keydown', {
                key: PLAYING_PAGE.debugKey,
            });
            Object.defineProperty(debugEvent, 'target', { value: safeTarget });

            component.handleKeyboardEvent(debugEvent);
            expect(mockLobbyService.setDebug).toHaveBeenCalledWith(mockLobbyId, true);

            component.handleKeyboardEvent(debugEvent);
            expect(mockLobbyService.setDebug).toHaveBeenCalledWith(mockLobbyId, false);
        });

        it('should handle abandon game', () => {
            component.gameState.animation = false;
            component.abandon();
            expect(mockLobbyService.disconnect).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });

            mockLobbyService.disconnect.calls.reset();
            mockRouter.navigate.calls.reset();
            component.gameState.animation = true;
            component.abandon();
            expect(mockLobbyService.disconnect).not.toHaveBeenCalled();

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
            component.gameState.board = [
                [0, 0, 0],
                [0, 0, TileTypes.DoorClosed],
                [0, 0, 0],
            ];
            component.gameState.playerPositions = [{ x: 1, y: 1 }];
            component.gameState.currentPlayerActionPoints = 1;
            expect(component['canPerformAction']()).toBe(true);

            component.gameState.board = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ];
            component.gameState.playerPositions = [
                { x: 1, y: 1 },
                { x: 1, y: 2 },
            ];
            expect(component['canPerformAction']()).toBe(true);

            component.gameState.currentPlayerActionPoints = 0;
            expect(component['canPerformAction']()).toBe(false);

            component.gameState.currentPlayerActionPoints = 1;
            component.gameState.playerPositions = [{ x: 1, y: 1 }];
            expect(component['canPerformAction']()).toBe(false);

            component.gameState.playerPositions = [{ x: 0, y: 0 }];
            expect(component['canPerformAction']()).toBe(false);
        });
    });

    describe('Game event subscriptions', () => {
        it('should handle flee event', fakeAsync(() => {
            component.isInCombat = true;
            const fleeEvent = { fleeingPlayer: mockPlayer };
            mockLobbyService.onFleeSuccess.and.returnValue(of(fleeEvent));

            component['setupGameListeners']();
            tick();

            expect(component.isInCombat).toBe(false);
            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('Vous avez fuit'));

            mockNotificationService.showInfo.calls.reset();
            const otherPlayer = { ...mockPlayer, name: 'OtherPlayer' };
            const otherFleeEvent = { fleeingPlayer: otherPlayer };
            mockLobbyService.onFleeSuccess.and.returnValue(of(otherFleeEvent));

            component['setupGameListeners']();
            tick();

            expect(mockNotificationService.showInfo).toHaveBeenCalledWith(jasmine.stringContaining('OtherPlayer a fui'));
        }));

        it('should handle lobby updated event', fakeAsync(() => {
            const updatedLobby = {
                ...mockLobby,
                players: [{ ...mockPlayer, life: 80 }],
            };
            mockLobbyService.onLobbyUpdated.and.returnValue(of({ lobby: updatedLobby }));

            component['setupGameListeners']();
            tick();

            expect(mockLobbyService.updatePlayers).toHaveBeenCalledWith(mockLobbyId, updatedLobby.players);

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
            mockLobbyService.onStartCombat.and.returnValue(of({ firstPlayer: mockPlayer }));
            component['setupGameListeners']();
            tick();
            expect(component.isInCombat).toBe(false);

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

            component.gameState = {
                ...mockGameState,
                currentPlayerMovementPoints: 1,
                currentPlayerActionPoints: 1,
                teams: { team1: [], team2: [] },
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
            component.gameState.animation = true;
            expect(component.isAnimated).toBe(true);
            component.gameState.animation = false;
            expect(component.isAnimated).toBe(false);

            component.gameState.currentPlayer = mockPlayer.id;
            expect(component.isPlayerTurn).toBe(true);
            component.gameState.currentPlayer = 'other-id';
            expect(component.isPlayerTurn).toBe(false);

            expect(component.getGameName()).toBe(PLAYING_PAGE_DESCRIPTION.gameName);

            expect(component.getPlayerCount()).toBe(1);

            component.gameState.currentPlayer = mockPlayer.id;
            expect(component.getActivePlayer()).toBe(mockPlayer.name);
            component.gameState.currentPlayer = 'unknown';
            expect(component.getActivePlayer()).toBe('Unknown');

            expect(component.getPlayers()).toBe(component.gameState.players);

            expect(component.getDeletedPlayers()).toEqual([]);
            const deletedPlayer = { ...mockPlayer, id: 'deleted' };
            component.gameState.deletedPlayers = [deletedPlayer];
            expect(component.getDeletedPlayers()).toEqual([deletedPlayer]);
        });
    });
    describe('isSameTeam functionality', () => {
        it('should return true if both players are in team1', () => {
            component.gameState = {
                ...mockGameState,
                teams: {
                    team1: [
                        { ...mockPlayer },
                        {
                            id: 'opponent-id',
                            name: 'Opponent',
                            isHost: false,
                            life: 100,
                            maxLife: 100,
                            amountEscape: 0,
                            pendingItem: 0,
                            avatar: '',
                            speed: 10,
                            attack: 15,
                            defense: 5,
                            winCount: 0,
                        },
                    ],
                    team2: [],
                },
            };
            const opponent = { id: 'opponent-id' } as Player;
            const isSameTeam = component['isSameTeam'](mockPlayer, opponent);
            expect(isSameTeam).toBe(true);
        });

        it('should return true if both players are in team2', () => {
            component.gameState = {
                ...mockGameState,
                teams: {
                    team1: [],
                    team2: [
                        { ...mockPlayer },
                        {
                            id: 'opponent-id',
                            name: 'Opponent',
                            isHost: false,
                            life: 100,
                            maxLife: 100,
                            amountEscape: 0,
                            pendingItem: 0,
                            avatar: '',
                            speed: 10,
                            attack: 5,
                            defense: 3,
                            winCount: 0,
                        },
                    ],
                },
            };
            const opponent = { id: 'opponent-id' } as Player;
            const isSameTeam = component['isSameTeam'](mockPlayer, opponent);
            expect(isSameTeam).toBe(true);
        });

        it('should return false if players are in different teams', () => {
            component.gameState = {
                ...mockGameState,
                teams: {
                    team1: [{ ...mockPlayer }],
                    team2: [
                        {
                            id: 'opponent-id',
                            name: 'Opponent',
                            isHost: false,
                            life: 100,
                            maxLife: 100,
                            amountEscape: 0,
                            pendingItem: 0,
                            avatar: '',
                            speed: 10,
                            attack: 5,
                            defense: 3,
                            winCount: 0,
                        },
                    ],
                },
            };
            const opponent = { id: 'opponent-id' } as Player;
            const isSameTeam = component['isSameTeam'](mockPlayer, opponent);
            expect(isSameTeam).toBe(false);
        });

        it('should return false if one or both players are not in any team', () => {
            component.gameState = {
                ...mockGameState,
                teams: {
                    team1: [{ ...mockPlayer }],
                    team2: [],
                },
            };
            const opponent = { id: 'opponent-id' } as Player;
            const isSameTeam = component['isSameTeam'](mockPlayer, opponent);
            expect(isSameTeam).toBe(false);

            component.gameState.teams = {
                team1: [],
                team2: [],
            };
            const isSameTeamNoTeams = component['isSameTeam'](mockPlayer, opponent);
            expect(isSameTeamNoTeams).toBe(false);
        });
    });
});
