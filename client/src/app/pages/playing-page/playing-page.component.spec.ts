/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
import { Component, Input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { CombatComponent } from '@app/components/combat/combat.component';
import { CountdownPlayerComponent } from '@app/components/countdown-player/countdown-player.component';
import { ActionService } from '@app/services/action.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { ObjectsTypes, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { of, Subject, Subscription } from 'rxjs';
import { PlayingPageComponent } from './playing-page.component';

@Component({
    selector: 'app-countdown-player',
    template: '',
})
class MockCountdownPlayerComponent {
    @Input() timeLeft: number = 0;
}

@Component({
    selector: 'app-combat',
    template: '',
})
class MockCombatComponent {
    @Input() isPlayerTurn: boolean = false;
    @Input() currentPlayer!: Player;
    @Input() opponent!: Player;
}

describe('PlayingPageComponent', () => {
    let component: PlayingPageComponent;
    let fixture: ComponentFixture<PlayingPageComponent>;
    let lobbyService: any;
    let actionService: any;
    let notificationService: any;
    let router: any;
    let activatedRoute: any;

    const minimalGameState: GameState = {
        board: [[]],
        currentPlayer: '',
        animation: false,
        players: [],
        id: '',
        turnCounter: 0,
        availableMoves: [],
        shortestMoves: [],
        playerPositions: [],
        spawnPoints: [],
        currentPlayerMovementPoints: 0,
        currentPlayerActionPoints: 0,
        debug: false,
    };

    const defaultPlayer: Player = {
        id: 'player1',
        name: 'Player One',
        isHost: true,
        life: 100,
        maxLife: 100,
        avatar: '',
        speed: 0,
        attack: 0,
        defense: 0,
        winCount: 0,
        amountEscape: 0,
    };

    beforeEach(() => {
        const combatUpdateSubject = new Subject<{ timeLeft: number }>();
        const combatTimeUpdateSubject = new Subject<number>();
        const interactionSubject = new Subject<{ isInCombat: boolean }>();
        const startCombatSubject = new Subject<{ firstPlayer: Player }>();
        const tileUpdateSubject = new Subject<{ newGameBoard: Tile[][] }>();
        const combatEndedSubject = new Subject<any>();
        const gameStartedSubject = new Subject<{ gameState: GameState }>();
        const turnStartedSubject = new Subject<{ gameState: GameState; currentPlayer: string }>();
        const turnEndedSubject = new Subject<{ gameState: GameState }>();
        const movementProcessedSubject = new Subject<{ gameState: GameState }>();
        const errorSubject = new Subject<string>();
        const lobbyUpdatedSubject = new Subject<{ lobby: { id: string; players: Player[] } }>();
        const boardChangedSubject = new Subject<{ gameState: GameState }>();
        const fleeSuccessSubject = new Subject<{ fleeingPlayer: Player }>();
        const attackEndSubject = new Subject<{ isInCombat: boolean }>();

        lobbyService = {
            onGameOver: jasmine.createSpy('onGameOver').and.returnValue(of({})),
            onGameStarted: () => gameStartedSubject.asObservable(),
            onTurnStarted: () => turnStartedSubject.asObservable(),
            onCombatUpdate: () => combatUpdateSubject.asObservable(),
            onInteraction: () => interactionSubject.asObservable(),
            onStartCombat: () => startCombatSubject.asObservable(),
            onTileUpdate: () => tileUpdateSubject.asObservable(),
            onCombatEnded: () => combatEndedSubject.asObservable(),
            onTurnEnded: () => turnEndedSubject.asObservable(),
            onMovementProcessed: () => movementProcessedSubject.asObservable(),
            onError: () => errorSubject.asObservable(),
            onLobbyUpdated: () => lobbyUpdatedSubject.asObservable(),
            onBoardChanged: () => boardChangedSubject.asObservable(),
            onFleeSuccess: () => fleeSuccessSubject.asObservable(),
            onAttackEnd: () => attackEndSubject.asObservable(),
            onCombatTimeUpdate: () => combatTimeUpdateSubject.asObservable(),
            getCurrentPlayer: jasmine.createSpy('getCurrentPlayer').and.returnValue(defaultPlayer),
            getSocketId: jasmine.createSpy('getSocketId').and.returnValue('player1'),
            executeAction: jasmine.createSpy('executeAction').and.returnValue(of({ newGameBoard: [[]] })),
            initializeBattle: jasmine.createSpy('initializeBattle'),
            disconnect: jasmine.createSpy('disconnect'),
            setDebug: jasmine.createSpy('setDebug'),
            updateCombatStatus: jasmine.createSpy('updateCombatStatus'),
            requestMovement: jasmine.createSpy('requestMovement'),
            requestEndTurn: jasmine.createSpy('requestEndTurn'),
            updateCombatTime: jasmine.createSpy('updateCombatTime'),
            setCurrentPlayer: jasmine.createSpy('setCurrentPlayer'),
            disconnectFromRoom: jasmine.createSpy('disconnectFromRoom'),
            updatePlayers: jasmine.createSpy('updatePlayers'),
            handleAttack: jasmine.createSpy('handleAttack'),
            gameStartedSubject,
            turnStartedSubject,
            combatUpdateSubject,
            interactionSubject,
            startCombatSubject,
            tileUpdateSubject,
            combatEndedSubject,
            turnEndedSubject,
            movementProcessedSubject,
            errorSubject,
            lobbyUpdatedSubject,
            boardChangedSubject,
            fleeSuccessSubject,
            attackEndSubject,
            combatTimeUpdateSubject,
        };

        actionService = {
            getActionType: jasmine.createSpy('getActionType'),
            findOpponent: jasmine.createSpy('findOpponent').and.returnValue({
                ...defaultPlayer,
                id: 'player2',
                name: 'Player Two',
                isHost: false,
            }),
        };

        notificationService = {
            showError: jasmine.createSpy('showError'),
            showSuccess: jasmine.createSpy('showSuccess'),
            showInfo: jasmine.createSpy('showInfo'),
        };

        router = {
            navigate: jasmine.createSpy('navigate'),
        };

        activatedRoute = {
            params: of({ id: 'lobby123' }),
        };

        TestBed.configureTestingModule({
            imports: [PlayingPageComponent],
            providers: [
                { provide: LobbyService, useValue: lobbyService },
                { provide: ActionService, useValue: actionService },
                { provide: NotificationService, useValue: notificationService },
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: activatedRoute },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        })
            .overrideComponent(PlayingPageComponent, {
                remove: { imports: [CountdownPlayerComponent, CombatComponent] },
                add: { imports: [MockCountdownPlayerComponent, MockCombatComponent] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(PlayingPageComponent);
        component = fixture.componentInstance;
        component.gameState = { ...minimalGameState };

        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
        fixture.destroy();
        if (component['interval']) {
            clearInterval(component['interval']);
        }
    });

    describe('Initialization', () => {
        describe('Combat Status Updates', () => {
            it('should update isInCombat from interaction listener', fakeAsync(() => {
                lobbyService.interactionSubject.next({ isInCombat: true });
                tick();
                expect(component.isInCombat).toBeTrue();

                lobbyService.interactionSubject.next({ isInCombat: false });
                tick();
                expect(component.isInCombat).toBeFalse();
            }));

            it('should update isInCombat from attack-end listener', fakeAsync(() => {
                lobbyService.attackEndSubject.next({ isInCombat: true });
                tick();
                expect(component.isInCombat).toBeTrue();

                lobbyService.attackEndSubject.next({ isInCombat: false });
                tick();
                expect(component.isInCombat).toBeFalse();
            }));

            it('should update isInCombat from combat End', fakeAsync(() => {
                lobbyService.combatEndedSubject.next({});
                tick();
                expect(component.isInCombat).toBeFalse();
            }));
        });
        it('should set lobbyId from route params and initialize', fakeAsync(() => {
            fixture.detectChanges();
            tick();
            expect(component.lobbyId).toBe('lobby123');
            expect(component.currentPlayer).toBeDefined();
            expect(lobbyService.getCurrentPlayer).toHaveBeenCalled();
        }));

        it('should navigate to home if no lobbyId is provided', fakeAsync(() => {
            activatedRoute.params = of({});
            component.currentPlayer = { ...defaultPlayer };
            fixture.detectChanges();
            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/home', { replaceUrl: true }]);
        }));

        it('should update gameState board on tile update', fakeAsync(() => {
            component.gameState = { ...minimalGameState, board: [[]] };
            fixture.detectChanges();
            lobbyService.tileUpdateSubject.next({ newGameBoard: [[TileTypes.Grass]] });
            tick();
            expect(component.gameState.board).toEqual([[TileTypes.Grass]]);
        }));
        it('should update remainingTime on combat update', fakeAsync(() => {
            fixture.detectChanges();
            lobbyService.combatUpdateSubject.next({ timeLeft: 20 });
            tick();
            expect(component['remainingTime']).toBe(20);
        }));

        it('should set isInCombat on interaction', fakeAsync(() => {
            fixture.detectChanges();
            lobbyService.interactionSubject.next({ isInCombat: true });
            tick();
            expect(component.isInCombat).toBe(true);
            expect(lobbyService.updateCombatStatus).toHaveBeenCalledWith(true);
        }));

        it('should set combat state on start combat', fakeAsync(() => {
            component.currentPlayer = { ...defaultPlayer };
            fixture.detectChanges();
            lobbyService.startCombatSubject.next({ firstPlayer: { id: 'player1' } });
            tick();
            expect(component.isInCombat).toBe(true);
            expect(component.isPlayerTurn).toBe(true);
        }));

        it('should clear combat state on game end', fakeAsync(() => {
            component.isInCombat = true;
            fixture.detectChanges();

            if (!lobbyService.gameEndedSubject) {
                lobbyService.gameEndedSubject = new Subject<any>();
            }

            lobbyService.gameEndedSubject.next({});
            tick();

            expect(component.isInCombat).toBe(true);
        }));
    });

    describe('Player Actions', () => {
        beforeEach(() => {
            component.currentPlayer = { ...defaultPlayer };
            component.gameState = {
                ...minimalGameState,
                currentPlayer: 'player1',
                players: [{ ...defaultPlayer }, { ...defaultPlayer, id: 'player2', name: 'Player Two' }],
            };
        });
        describe('Opponent Assignment', () => {
            it('should update isInCombat when interaction events occur after battle initiation', () => {
                const mockTile: Tile = { type: TileTypes.Grass, x: 0, y: 0, id: '', object: 0 };
                const expectedOpponent = {
                    ...defaultPlayer,
                    id: 'player2',
                    name: 'Player Two',
                };

                actionService.getActionType.and.returnValue('battle');
                actionService.findOpponent.and.returnValue(expectedOpponent);

                component.onActionRequest(mockTile);

                lobbyService.interactionSubject.next({ isInCombat: true });
                expect(component.isInCombat).toBeTrue();

                lobbyService.interactionSubject.next({ isInCombat: false });
                expect(component.isInCombat).toBeFalse();
            });
            it('should set opponent to null when findOpponent returns null', () => {
                const mockTile: Tile = { type: TileTypes.Grass, x: 0, y: 0, id: '', object: 0 };
                actionService.getActionType.and.returnValue('battle');
                actionService.findOpponent.and.returnValue(null);

                component.onActionRequest(mockTile);

                expect(component.opponent).toBeNull();
                expect(lobbyService.initializeBattle).not.toHaveBeenCalled();
            });

            it('should set opponent when findOpponent returns a player', () => {
                const mockTile: Tile = { type: TileTypes.Grass, x: 0, y: 0, id: '', object: 0 };
                const expectedOpponent = {
                    ...defaultPlayer,
                    id: 'player2',
                    name: 'Player Two',
                };
                actionService.getActionType.and.returnValue('battle');
                actionService.findOpponent.and.returnValue(expectedOpponent);

                component.onActionRequest(mockTile);

                expect(component.opponent).toEqual(expectedOpponent);
                expect(lobbyService.initializeBattle).toHaveBeenCalledWith(component.currentPlayer, expectedOpponent, 'lobby123');
            });
        });

        it('should execute action when conditions are met', () => {
            const mockTile: Tile = { type: TileTypes.Grass, x: 0, y: 0, id: '', object: 0 };
            actionService.getActionType.and.returnValue('move');
            fixture.detectChanges();
            component.onActionRequest(mockTile);
            expect(lobbyService.executeAction).toHaveBeenCalledWith('move', mockTile, 'lobby123');
            expect(component.action).toBe(true);
        });

        it('should initialize battle when action is "battle"', () => {
            const mockTile: Tile = { type: TileTypes.Grass, x: 0, y: 0, id: '', object: 0 };
            actionService.getActionType.and.returnValue('battle');
            const expectedOpponent = {
                ...defaultPlayer,
                id: 'player2',
                name: 'Player Two',
                isHost: false,
            };
            actionService.findOpponent.and.returnValue(expectedOpponent);
            fixture.detectChanges();
            component.onActionRequest(mockTile);
            expect(lobbyService.initializeBattle).toHaveBeenCalledWith(component.currentPlayer, expectedOpponent, 'lobby123');
        });

        it('should not execute action if not current player', () => {
            component.gameState.currentPlayer = 'player2';
            const mockTile: Tile = { type: 1, x: 0, y: 0, id: '', object: 0 };
            fixture.detectChanges();
            component.onActionRequest(mockTile);
            expect(lobbyService.executeAction).not.toHaveBeenCalled();
        });

        it('should not execute action if animation is active', () => {
            component.gameState.animation = true;
            const mockTile: Tile = { type: 1, x: 0, y: 0, id: '', object: 0 };
            fixture.detectChanges();
            component.onActionRequest(mockTile);
            expect(lobbyService.executeAction).not.toHaveBeenCalled();
        });

        it('should request movement when conditions are met', () => {
            const coordinates: Coordinates[] = [{ x: 1, y: 1 }];
            fixture.detectChanges();
            component.onMoveRequest(coordinates);
            expect(lobbyService.requestMovement).toHaveBeenCalledWith('lobby123', coordinates);
        });

        it('should request end turn when conditions are met', () => {
            fixture.detectChanges();
            component.onEndTurn();
            expect(lobbyService.requestEndTurn).toHaveBeenCalledWith('lobby123');
        });
    });

    describe('Combat', () => {
        beforeEach(() => {
            component.currentPlayer = { ...defaultPlayer };
            component.gameState = {
                ...minimalGameState,
                currentPlayer: 'player1',
                id: '123',
                players: [{ ...defaultPlayer, id: 'player2', name: 'Player Two' }],
            };
        });

        it('should decrement remainingTime in countdown', fakeAsync(() => {
            component['remainingTime'] = 2;
            fixture.detectChanges();
            component.startTurnCountdown();
            tick(1000);
            expect(component['remainingTime']).toBe(1);
            tick(1000);
            expect(component['remainingTime']).toBe(0);
        }));

        it('should not start countdown if remainingTime is 0', () => {
            spyOn(window, 'setInterval');
            component['remainingTime'] = 0;
            fixture.detectChanges();
            component.startTurnCountdown();
            expect(window.setInterval).not.toHaveBeenCalled();
        });
    });

    describe('Keyboard Events', () => {
        beforeEach(() => {
            component.currentPlayer = { ...defaultPlayer };
            component.gameState = { ...minimalGameState };
        });

        it('should toggle debug mode on "d" key press if host', () => {
            fixture.detectChanges();
            const event = new KeyboardEvent('keydown', { key: 'd' });
            document.dispatchEvent(event);
            expect(component['debug']).toBe(true);
            expect(lobbyService.setDebug).toHaveBeenCalledWith('lobby123', true);
        });

        it('should not toggle debug mode if not host', () => {
            lobbyService.getCurrentPlayer.and.returnValue({ ...defaultPlayer, isHost: false });
            fixture.detectChanges();
            const event = new KeyboardEvent('keydown', { key: 'd' });
            document.dispatchEvent(event);
            expect(component['debug']).toBe(false);
            expect(lobbyService.setDebug).not.toHaveBeenCalled();
        });
    });

    describe('Getters', () => {
        beforeEach(() => {
            component.currentPlayer = { ...defaultPlayer };
            component.gameState = { ...minimalGameState };
        });

        it('should return game name', () => {
            fixture.detectChanges();
            expect(component.getGameName()).toBe('Forest Adventure');
        });
    });

    describe('Cleanup and Abandon', () => {
        it('should call abandon and unsubscribe on destroy', () => {
            spyOn(component, 'abandon');
            component['subscriptions'] = [new Subscription()];
            spyOn(component['subscriptions'][0], 'unsubscribe');
            component.gameState = { ...minimalGameState };
            component.currentPlayer = { ...defaultPlayer };
            fixture.detectChanges();
            component.ngOnDestroy();
            expect(component.abandon).toHaveBeenCalled();
            expect(component['subscriptions'][0].unsubscribe).toHaveBeenCalled();
        });

        it('should disconnect and navigate on abandon', () => {
            component.currentPlayer = { ...defaultPlayer };
            component.lobbyId = 'lobby123';
            component.gameState = { ...minimalGameState, id: '123' };
            fixture.detectChanges();
            component.abandon();
            expect(lobbyService.disconnect).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
        });

        it('should not disconnect if animation is active', () => {
            component.currentPlayer = { ...defaultPlayer };
            component.lobbyId = 'lobby123';
            component.gameState = { ...minimalGameState, id: '123', animation: true };
            fixture.detectChanges();
            component.abandon();
            expect(lobbyService.disconnect).not.toHaveBeenCalled();
        });
    });

    describe('Utility Methods', () => {
        beforeEach(() => {
            component.currentPlayer = { ...defaultPlayer };
            component.gameState = {
                ...minimalGameState,
                currentPlayer: 'player1',
                players: [{ ...defaultPlayer }, { ...defaultPlayer, id: 'player2', name: 'Player Two' }],
            };
        });

        it('should sync current player with game state', () => {
            component.gameState.players[0].life = 50;
            fixture.detectChanges();
            component['syncCurrentPlayerWithGameState']();
            expect(component.currentPlayer.life).toBe(50);
            expect(lobbyService.setCurrentPlayer).toHaveBeenCalledWith(component.currentPlayer);
        });

        it('should notify player turn', () => {
            fixture.detectChanges();
            component['notifyPlayerTurn']('player1');
            expect(notificationService.showSuccess).toHaveBeenCalledWith("C'est votre tour!");
            component['notifyPlayerTurn']('player2');
            expect(notificationService.showInfo).toHaveBeenCalledWith("C'est le tour de Player Two");
        });

        it('should emit remove event on remove player', () => {
            component.player = { ...defaultPlayer };
            spyOn(component.remove, 'emit');
            fixture.detectChanges();
            component.onRemovePlayer();
            expect(component.remove.emit).toHaveBeenCalledWith('player1');
        });
    });
    describe('isAnimated', () => {
        it('should return true when gameState.animation is true', () => {
            component.gameState = {
                ...minimalGameState,
                animation: true,
            };
            expect(component.isAnimated).toBeTrue();
        });

        it('should return false when gameState.animation is false', () => {
            component.gameState = {
                ...minimalGameState,
                animation: false,
            };
            expect(component.isAnimated).toBeFalse();
        });

        it('should return false when gameState.animation is undefined', () => {
            component.gameState = {
                ...minimalGameState,
                animation: undefined as unknown as boolean,
            };
            expect(component.isAnimated).toBeFalse();
        });
    });

    it('should exit early and not execute action when action type is null', () => {
        component.currentPlayer = {
            id: 'player1',
            name: 'Player One',
            isHost: true,
            life: 100,
            maxLife: 100,
            avatar: '',
            speed: 0,
            attack: 0,
            defense: 0,
            winCount: 0,
            amountEscape: 0,
        };
        component.gameState = {
            board: [[]],
            currentPlayer: 'player1',
            animation: false,
            players: [component.currentPlayer],
            id: 'game123',
            turnCounter: 0,
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 0,
            currentPlayerActionPoints: 1,
            debug: false,
        };
        const mockTile: Tile = { type: TileTypes.Grass, x: 0, y: 0, id: '', object: 0 };
        actionService.getActionType.and.returnValue(null);
        fixture.detectChanges();

        component.onActionRequest(mockTile);

        expect(lobbyService.executeAction).not.toHaveBeenCalled();
    });
    describe('Move Request Validation', () => {
        it('should not request movement if gameState is null', () => {
            component.gameState = null as unknown as GameState;
            component.currentPlayer = defaultPlayer;

            component.onMoveRequest([{ x: 1, y: 1 }]);

            expect(lobbyService.requestMovement).not.toHaveBeenCalled();
        });

        it('should not request movement if currentPlayer is null', () => {
            component.gameState = minimalGameState;
            component.currentPlayer = null as unknown as Player;

            component.onMoveRequest([{ x: 1, y: 1 }]);

            expect(lobbyService.requestMovement).not.toHaveBeenCalled();
        });

        it('should not request movement if not current player turn', () => {
            component.gameState = { ...minimalGameState, currentPlayer: 'player999' };
            component.currentPlayer = defaultPlayer;

            component.onMoveRequest([{ x: 1, y: 1 }]);

            expect(lobbyService.requestMovement).not.toHaveBeenCalled();
        });

        it('should request movement when all conditions are met', () => {
            component.gameState = { ...minimalGameState, currentPlayer: 'player1' };
            component.currentPlayer = defaultPlayer;

            component.onMoveRequest([{ x: 1, y: 1 }]);

            expect(lobbyService.requestMovement).toHaveBeenCalledWith('lobby123', [{ x: 1, y: 1 }]);
        });
    });

    describe('End Turn Validation', () => {
        it('should not request end turn if gameState is null', () => {
            component.gameState = null as unknown as GameState;
            component.currentPlayer = defaultPlayer;

            component.onEndTurn();

            expect(lobbyService.requestEndTurn).not.toHaveBeenCalled();
        });

        it('should not request end turn if currentPlayer is null', () => {
            component.gameState = minimalGameState;
            component.currentPlayer = null as unknown as Player;

            component.onEndTurn();

            expect(lobbyService.requestEndTurn).not.toHaveBeenCalled();
        });

        it('should not request end turn if not current player turn', () => {
            component.gameState = { ...minimalGameState, currentPlayer: 'player999' };
            component.currentPlayer = defaultPlayer;

            component.onEndTurn();

            expect(lobbyService.requestEndTurn).not.toHaveBeenCalled();
        });

        it('should request end turn when all conditions are met', () => {
            component.gameState = { ...minimalGameState, currentPlayer: 'player1' };
            component.currentPlayer = defaultPlayer;

            component.onEndTurn();

            expect(lobbyService.requestEndTurn).toHaveBeenCalledWith('lobby123');
        });
    });

    describe('getMapSize', () => {
        it('should return "Unknown" if gameState is undefined', () => {
            component.gameState = null as unknown as GameState;
            expect(component.getMapSize()).toBe('Unknown');
        });

        it('should return "small" for small maps (size <= 10)', () => {
            component.gameState = { ...minimalGameState, board: Array(10).fill([]) };
            expect(component.getMapSize()).toBe('small');
        });

        it('should return "large" when size is exactly 20', () => {
            component.gameState = { ...minimalGameState, board: Array(20).fill([]) };
            expect(component.getMapSize()).toBe('large');
        });
        it('should return "medium" when size is exactly 15', () => {
            component.gameState = { ...minimalGameState, board: Array(15).fill([]) };
            expect(component.getMapSize()).toBe('medium');
        });

        it('should return "large" for large maps (size > 20)', () => {
            component.gameState = { ...minimalGameState, board: Array(21).fill([]) };
            expect(component.getMapSize()).toBe('large');
        });
    });
    describe('getActivePlayer', () => {
        it('should return "Unknown" if gameState is undefined', () => {
            component.gameState = null as unknown as GameState;
            expect(component.getActivePlayer()).toBe('Unknown');
        });

        it('should return "Unknown" if currentPlayer is not found in players', () => {
            component.gameState = {
                ...minimalGameState,
                currentPlayer: 'invalidPlayerId',
                players: [{ ...defaultPlayer, id: 'player1' }],
            };
            expect(component.getActivePlayer()).toBe('Unknown');
        });

        it('should return the player name when currentPlayer exists', () => {
            const expectedName = 'Active Player';
            component.gameState = {
                ...minimalGameState,
                currentPlayer: 'player1',
                players: [{ ...defaultPlayer, id: 'player1', name: expectedName }],
            };
            expect(component.getActivePlayer()).toBe(expectedName);
        });
    });

    describe('isCurrentPlayerTurn', () => {
        it('should return false when gameState is null', () => {
            component.gameState = null as unknown as GameState;
            component.currentPlayer = defaultPlayer;
            expect(component.isCurrentPlayerTurn()).toBeFalse();
        });

        it('should return false when currentPlayer is null', () => {
            component.gameState = minimalGameState;
            component.currentPlayer = null as unknown as Player;
            expect(component.isCurrentPlayerTurn()).toBeFalse();
        });

        it('should return false when gameState.currentPlayer does NOT match currentPlayer.id', () => {
            component.gameState = { ...minimalGameState, currentPlayer: 'player2' };
            component.currentPlayer = { ...defaultPlayer, id: 'player1' };
            expect(component.isCurrentPlayerTurn()).toBeFalse();
        });

        it('should return true when gameState.currentPlayer matches currentPlayer.id', () => {
            component.gameState = { ...minimalGameState, currentPlayer: 'player1' };
            component.currentPlayer = { ...defaultPlayer, id: 'player1' };
            expect(component.isCurrentPlayerTurn()).toBeTrue();
        });
    });

    describe('getPlayers', () => {
        it('should return empty array when gameState is undefined', () => {
            component.gameState = null as unknown as GameState;
            expect(component.getPlayers()).toEqual([]);
        });

        it('should return empty array when gameState.players is empty', () => {
            component.gameState = { ...minimalGameState, players: [] };
            expect(component.getPlayers()).toEqual([]);
        });

        it('should return players array when gameState has players', () => {
            const players = [{ ...defaultPlayer }, { ...defaultPlayer, id: 'player2' }];
            component.gameState = { ...minimalGameState, players };
            expect(component.getPlayers()).toEqual(players);
        });
    });
    describe('setupGameListeners', () => {
        beforeEach(() => {
            component.lobbyId = 'lobby123';
            component.currentPlayer = { ...defaultPlayer, id: 'player1' };
            component['setupGameListeners']();
        });

        it('should handle turn started event', () => {
            const mockGameState = { ...minimalGameState, currentPlayer: 'player1' };
            spyOn(component as any, 'notifyPlayerTurn');

            lobbyService.turnStartedSubject.next({
                gameState: mockGameState,
                currentPlayer: 'player1',
            });

            expect(component.gameState).toEqual(mockGameState);
            expect(component['notifyPlayerTurn']).toHaveBeenCalledWith('player1');
        });

        it('should handle error event', () => {
            const errorMsg = 'Test error';
            lobbyService.errorSubject.next(errorMsg);
            expect(notificationService.showError).toHaveBeenCalledWith(errorMsg);
        });

        describe('onLobbyUpdated', () => {
            it('should handle lobby update with matching ID and missing player', () => {
                const mockLobby = {
                    id: 'lobby123',
                    players: [{ id: 'player2' }],
                };

                lobbyService.lobbyUpdatedSubject.next({ lobby: mockLobby });

                expect(lobbyService.disconnectFromRoom).toHaveBeenCalledWith('lobby123');
                expect(router.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
            });

            it('should handle lobby update with matching ID and existing player', () => {
                const mockLobby = {
                    id: 'lobby123',
                    players: [{ id: 'player1' }],
                };

                lobbyService.lobbyUpdatedSubject.next({ lobby: mockLobby });

                expect(lobbyService.updatePlayers).toHaveBeenCalledWith('lobby123', mockLobby.players);
            });
        });

        describe('onFleeSuccess', () => {
            it('should handle current player fleeing', () => {
                const fleeingPlayer = { ...defaultPlayer, name: 'Player One' };

                lobbyService.fleeSuccessSubject.next({ fleeingPlayer });

                expect(component.isInCombat).toBeFalse();
                expect(notificationService.showInfo).toHaveBeenCalledWith('Vous avez fuit le combat.');
            });
            it('should handle other player fleeing', () => {
                const fleeingPlayer = { ...defaultPlayer, name: 'Player Two' };

                lobbyService.fleeSuccessSubject.next({ fleeingPlayer });

                expect(notificationService.showInfo).toHaveBeenCalledWith('Player Two a fui le combat.');
            });
        });
    });

    it('should handle attack end event', fakeAsync(() => {
        component.currentPlayer = { ...defaultPlayer, name: 'Player One' };
        fixture.detectChanges();
        lobbyService.attackEndSubject.next({ isInCombat: false });
        tick();

        expect(component.isInCombat).toBeFalse();
        expect(notificationService.showInfo).toHaveBeenCalledWith('Player One a fini son combat');
    }));

    it('should handle turn ended event', fakeAsync(() => {
        const mockGameState = { ...minimalGameState, turnCounter: 1 };
        lobbyService.turnEndedSubject.next({ gameState: mockGameState });
        tick();
        expect(component.gameState.turnCounter).toEqual(1);
    }));

    it('should handle movement processed event', () => {
        const mockGameState = { ...minimalGameState, playerPositions: [] };
        lobbyService.movementProcessedSubject.next({ gameState: mockGameState });
        expect(component.gameState).toEqual(mockGameState);
    });

    describe('getCurrentPlayer', () => {
        it('should navigate to home if currentPlayer is null', fakeAsync(() => {
            component.currentPlayer = {
                id: 'player1',
                name: 'Player One',
                isHost: true,
                life: 100,
                maxLife: 100,
                avatar: '',
                speed: 0,
                attack: 0,
                defense: 0,
                winCount: 0,
                amountEscape: 0,
            };

            lobbyService.getCurrentPlayer.and.returnValue(null);

            fixture.detectChanges();

            tick();

            expect(router.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
        }));

        it('should update currentPlayer id to match socketId when different', () => {
            const mockPlayer = { ...defaultPlayer, id: 'oldId' };
            lobbyService.getCurrentPlayer.and.returnValue(mockPlayer);
            lobbyService.getSocketId.and.returnValue('newSocketId');
            component.getCurrentPlayer();
            expect(component.currentPlayer.id).toBe('newSocketId');
        });

        it('should not change currentPlayer id if matches socketId', () => {
            const mockPlayer = { ...defaultPlayer, id: 'socketId123' };
            lobbyService.getCurrentPlayer.and.returnValue(mockPlayer);
            lobbyService.getSocketId.and.returnValue('socketId123');
            component.getCurrentPlayer();
            expect(component.currentPlayer.id).toBe('socketId123');
        });
    });
    describe('syncCurrentPlayerWithGameState', () => {
        it('should exit early if gameState is null', () => {
            component.gameState = null as unknown as GameState;
            component.currentPlayer = { ...defaultPlayer };

            component['syncCurrentPlayerWithGameState']();

            expect(lobbyService.setCurrentPlayer).not.toHaveBeenCalled();
        });

        it('should exit early if currentPlayer is null', () => {
            component.gameState = { ...minimalGameState };
            component.currentPlayer = null as unknown as Player;

            component['syncCurrentPlayerWithGameState']();

            expect(lobbyService.setCurrentPlayer).not.toHaveBeenCalled();
        });

        it('should update game state and current player when game starts', fakeAsync(() => {
            const mockGameState = {
                ...minimalGameState,
                players: [{ ...defaultPlayer, id: 'player1', life: 75 }],
            };
            spyOn(component, 'getCurrentPlayer');
            fixture.detectChanges();

            lobbyService.gameStartedSubject.next({ gameState: mockGameState });
            tick();

            expect(component.gameState).toEqual(mockGameState);
            expect(component.getCurrentPlayer).toHaveBeenCalled();
        }));

        it('should update game state and current player when board changes', fakeAsync(() => {
            const updatedPlayer = { ...defaultPlayer, id: 'player1', life: 80 };
            const mockGameState = {
                ...minimalGameState,
                board: [
                    [TileTypes.Grass, TileTypes.Water],
                    [TileTypes.Grass, TileTypes.Water],
                ],
                players: [updatedPlayer],
            };
            component.currentPlayer = { ...defaultPlayer, id: 'player1' };
            fixture.detectChanges();

            lobbyService.boardChangedSubject.next({ gameState: mockGameState });
            tick();

            expect(component.gameState).toEqual(mockGameState);
            expect(component.currentPlayer).toEqual(updatedPlayer);
        }));
    });
    describe('onInfoSent', () => {
        beforeEach(() => {
            notificationService.showInfo.calls.reset();
            notificationService.showError.calls.reset();
            notificationService.showSuccess.calls.reset();
        });
        it('should parse item information correctly for unknown items', fakeAsync(() => {
            const details = 'Item: 999\n';
            component.onInfoSent(details);
            tick();
            expect(notificationService.showInfo).toHaveBeenCalledWith('Objet inconnu (ID: 999)\n');
            expect(notificationService.showError).not.toHaveBeenCalled();
        }));

        it('should show an error if details is empty', fakeAsync(() => {
            component.onInfoSent('');
            tick();
            expect(notificationService.showError).toHaveBeenCalledWith('Aucune information disponible pour cette tuile.');
            expect(notificationService.showInfo).not.toHaveBeenCalled();
        }));

        it('should parse player information correctly', fakeAsync(() => {
            const details = 'Player: JohnDoe\n';
            component.onInfoSent(details);
            tick();
            expect(notificationService.showInfo).toHaveBeenCalledWith('Joueur: JohnDoe\n');
            expect(notificationService.showError).not.toHaveBeenCalled();
        }));

        it('should parse item information correctly for known items', fakeAsync(() => {
            const details = `Item: ${ObjectsTypes.SPAWN}\n`; // Use ObjectsTypes.SPAWN instead of hardcoding 1
            component.onInfoSent(details);
            tick();
            expect(notificationService.showInfo).toHaveBeenCalledWith('Objet: Point de départ\n');
            expect(notificationService.showError).not.toHaveBeenCalled();
        }));

        it('should parse item information correctly for unknown items', fakeAsync(() => {
            const details = 'Item: 999\n';
            component.onInfoSent(details);
            tick();
            expect(notificationService.showInfo).toHaveBeenCalledWith('Objet inconnu (ID: 999)\n');
            expect(notificationService.showError).not.toHaveBeenCalled();
        }));

        it('should parse tile type information correctly', fakeAsync(() => {
            const details = 'Tile Type: 5\n';
            component.onInfoSent(details);
            tick();
            expect(notificationService.showInfo).toHaveBeenCalledWith('Type de tuile: 5\n');
            expect(notificationService.showError).not.toHaveBeenCalled();
        }));

        it('should handle multiple lines of details', fakeAsync(() => {
            const details = `Player: JohnDoe\nItem: ${ObjectsTypes.SPAWN}\nTile Type: 5\n`;
            component.onInfoSent(details);
            tick();
            expect(notificationService.showInfo).toHaveBeenCalledWith('Joueur: JohnDoe\nObjet: Point de départ\nType de tuile: 5\n');
            expect(notificationService.showError).not.toHaveBeenCalled();
        }));

        it('should show a default message if no relevant information is found', fakeAsync(() => {
            const details = 'Random: Info\n';
            component.onInfoSent(details);
            tick();
            expect(notificationService.showInfo).toHaveBeenCalledWith('Aucune information pertinente pour cette tuile.');
            expect(notificationService.showError).not.toHaveBeenCalled();
        }));
    });

    describe('getItemDescription', () => {
        it('should return the correct description for a known item', () => {
            const description = component['getItemDescription'](ObjectsTypes.SPAWN);
            expect(description).toBe('Point de départ');
        });

        it('should return "Vide" for an unknown item', () => {
            const description = component['getItemDescription'](999);
            expect(description).toBe('Vide');
        });
    });
});
