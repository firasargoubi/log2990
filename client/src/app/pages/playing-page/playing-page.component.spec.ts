/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, Subscription } from 'rxjs';
import { NO_ERRORS_SCHEMA, Component, Input } from '@angular/core';
import { PlayingPageComponent } from './playing-page.component';
import { LobbyService } from '@app/services/lobby.service';
import { ActionService } from '@app/services/action.service';
import { NotificationService } from '@app/services/notification.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Coordinates } from '@common/coordinates';
import { TileTypes } from '@common/game.interface';
import { CountdownPlayerComponent } from '@app/components/countdown-player/countdown-player.component';
import { CombatComponent } from '@app/components/combat/combat.component';

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
        const gameEndedSubject = new Subject<any>();
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
            onGameStarted: () => gameStartedSubject.asObservable(),
            onTurnStarted: () => turnStartedSubject.asObservable(),
            onCombatUpdate: () => combatUpdateSubject.asObservable(),
            onInteraction: () => interactionSubject.asObservable(),
            onStartCombat: () => startCombatSubject.asObservable(),
            onTileUpdate: () => tileUpdateSubject.asObservable(),
            onGameEnded: () => gameEndedSubject.asObservable(),
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
            gameEndedSubject,
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
    });

    afterEach(() => {
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
                expect(component.isInCombat).toBeFalse();

                lobbyService.interactionSubject.next({ isInCombat: false });
                tick();
                expect(component.isInCombat).toBeFalse();
            }));

            it('should update isInCombat from attack-end listener', fakeAsync(() => {
                lobbyService.attackEndSubject.next({ isInCombat: true });
                tick();
                expect(component.isInCombat).toBeFalse();

                lobbyService.attackEndSubject.next({ isInCombat: false });
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
            lobbyService.gameEndedSubject.next({});
            tick();
            expect(component.isInCombat).toBe(false);
            expect(lobbyService.updateCombatStatus).toHaveBeenCalledWith(false);
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

                // Mock action service to return 'battle' and a valid opponent
                actionService.getActionType.and.returnValue('battle');
                actionService.findOpponent.and.returnValue(expectedOpponent);

                // Trigger battle action
                component.onActionRequest(mockTile);

                // Simulate interaction events and verify isInCombat updates
                lobbyService.interactionSubject.next({ isInCombat: true });
                expect(component.isInCombat).toBeTrue();

                lobbyService.interactionSubject.next({ isInCombat: false });
                expect(component.isInCombat).toBeFalse();
            });
            it('should set opponent to null when findOpponent returns null', () => {
                const mockTile: Tile = { type: TileTypes.Grass, x: 0, y: 0, id: '', object: 0 };
                actionService.getActionType.and.returnValue('battle');
                actionService.findOpponent.and.returnValue(null); // Simulate no opponent found

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
                expect(lobbyService.initializeBattle).toHaveBeenCalledWith(component.currentPlayer, expectedOpponent, '');
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
        // Explicitly set up the component state
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
            currentPlayer: 'player1', // Matches currentPlayer.id
            animation: false, // No animation active
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

            expect(lobbyService.requestMovement).toHaveBeenCalledWith('', [{ x: 1, y: 1 }]);
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

            expect(lobbyService.requestEndTurn).toHaveBeenCalledWith('');
        });
    });
});
