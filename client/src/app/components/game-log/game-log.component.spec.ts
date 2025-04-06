/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { EventType } from '@common/events';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Subject } from 'rxjs';
import { LobbyService } from 'src/app/services/lobby.service';
import { GameLogComponent } from './game-log.component';

describe('GameLogComponent', () => {
    let component: GameLogComponent;
    let lobbyServiceMock: jasmine.SpyObj<LobbyService>;

    beforeEach(async () => {
        lobbyServiceMock = jasmine.createSpyObj('LobbyService', ['onEventLog']);
        await TestBed.configureTestingModule({
            imports: [GameLogComponent],
            providers: [{ provide: LobbyService, useValue: lobbyServiceMock }],
        }).compileComponents();
        const fixture = TestBed.createComponent(GameLogComponent);
        component = fixture.componentInstance;
        component.currentPlayer = { name: 'Player1' } as Player;
    });

    it('should initialize with default values', () => {
        expect(component.activeTab).toBe('gameLog');
        expect(component.gameLog).toEqual([]);
        expect(component.filterByCurrentPlayer).toBeFalse();
    });

    it('should filter game log by current player when filterByCurrentPlayer is true', () => {
        component.gameLog = [
            { timestamp: '10:00:00', eventType: 'Event1', involvedPlayer: 'Player1' },
            { timestamp: '10:01:00', eventType: 'Event2', involvedPlayer: 'Player2' },
        ];
        component.filterByCurrentPlayer = true;

        const filteredLog = component.filterGameLog;

        expect(filteredLog.length).toBe(1);
        expect(filteredLog[0].involvedPlayer).toBe('Player1');
    });

    it('should not filter game log when filterByCurrentPlayer is false', () => {
        component.gameLog = [
            { timestamp: '10:00:00', eventType: 'Event1', involvedPlayer: 'Player1' },
            { timestamp: '10:01:00', eventType: 'Event2', involvedPlayer: 'Player2' },
        ];
        component.filterByCurrentPlayer = false;

        const filteredLog = component.filterGameLog;

        expect(filteredLog.length).toBe(2);
    });

    it('should format time correctly', () => {
        const TEST_HOUR = 9;
        const TEST_MINUTES = 5;
        const TEST_SECONDS = 3;
        spyOn(Date.prototype, 'getHours').and.returnValue(TEST_HOUR);
        spyOn(Date.prototype, 'getMinutes').and.returnValue(TEST_MINUTES);
        spyOn(Date.prototype, 'getSeconds').and.returnValue(TEST_SECONDS);

        const formattedTime = component['getFormattedTime']();

        expect(formattedTime).toBe('09:05:03');
    });

    it('should pad time values less than PAD_TIME_VALUE', () => {
        const PAD_TIME_VALUE = 5;
        const paddedTime = component['padTime'](PAD_TIME_VALUE);
        expect(paddedTime).toBe('05');
    });

    it('should not pad time values greater than or equal to PAD_TIME_VALUE', () => {
        const PAD_TIME_VALUE = 10;
        const paddedTime = component['padTime'](PAD_TIME_VALUE);
        expect(paddedTime).toBe('10');
    });

    it('should scroll to the bottom of the element', () => {
        const SCROLL_HEIGHT = 100;
        const mockElement = { scrollTop: 0, scrollHeight: 100 } as HTMLElement;
        spyOn(document, 'getElementById').and.returnValue(mockElement);

        component['scrollToBottom']('gameLog');

        expect(mockElement.scrollTop).toBe(SCROLL_HEIGHT);
    });

    it('should handle events from lobbyService and add logs', () => {
        const eventLogSubject = new Subject<{
            eventType: EventType;
            gameState: GameState;
            involvedPlayers?: string[];
            involvedPlayer?: string;
            description?: string;
        }>();

        lobbyServiceMock.onEventLog.and.returnValue(eventLogSubject.asObservable());
        spyOn(component, 'addGameLog');

        component.ngOnInit();

        eventLogSubject.next({
            eventType: EventType.TurnStarted,
            gameState: {
                id: 'game1',
                board: [],
                turnCounter: 0,
                availableMoves: [],
                currentPlayer: '1',
                players: [
                    {
                        id: '1',
                        name: 'Player1',
                        pendingItem: 0,
                        avatar: '',
                        isHost: false,
                        life: 100,
                        maxLife: 100,
                        speed: 0,
                        attack: 0,
                        defense: 0,
                        winCount: 0,
                    },
                ],
                shortestMoves: [],
                playerPositions: [],
                spawnPoints: [],
                currentPlayerMovementPoints: 0,
                currentPlayerActionPoints: 0,
                debug: false,
                gameMode: 'normal',
            },
        });

        expect(component.addGameLog).toHaveBeenCalledWith(EventType.TurnStarted, 'Player1');
    });
    it('should handle DoorClosed, DoorOpened, FlagPicked, and ItemPicked events and add logs correctly', () => {
        const eventTypes = [EventType.DoorClosed, EventType.DoorOpened, EventType.FlagPicked, EventType.ItemPicked];
        const eventLogSubject = new Subject<{
            eventType: EventType;
            gameState: GameState;
            involvedPlayers?: string[];
            involvedPlayer?: string;
            description?: string;
        }>();
        lobbyServiceMock.onEventLog.and.returnValue(eventLogSubject.asObservable());
        spyOn(component, 'addGameLog');
        component.ngOnInit();
        eventTypes.forEach((eventType) => {
            const eventData = {
                eventType,
                gameState: {
                    id: 'game1',
                    board: [],
                    turnCounter: 0,
                    availableMoves: [],
                    currentPlayer: '1',
                    players: [
                        {
                            id: '1',
                            name: 'Player1',
                            pendingItem: 0,
                            avatar: '',
                            isHost: false,
                            life: 100,
                            maxLife: 100,
                            speed: 0,
                            attack: 0,
                            defense: 0,
                            winCount: 0,
                        },
                    ],
                    shortestMoves: [],
                    playerPositions: [],
                    spawnPoints: [],
                    currentPlayerMovementPoints: 0,
                    currentPlayerActionPoints: 0,
                    debug: false,
                    gameMode: 'normal',
                },
            };
            eventLogSubject.next(eventData);
            expect(component.addGameLog).toHaveBeenCalledWith(eventType, 'Player1');
        });
    });

    it('should handle CombatStarted event and add log with involvedPlayers', () => {
        const eventLogSubject = new Subject<{
            eventType: EventType;
            gameState: GameState;
            involvedPlayers?: string[];
            involvedPlayer?: string;
            description?: string;
        }>();
        lobbyServiceMock.onEventLog.and.returnValue(eventLogSubject.asObservable());
        spyOn(component, 'addGameLog');
        component.ngOnInit();

        const fakeGameState = {} as GameState;

        const combatEvent = {
            eventType: EventType.CombatStarted,
            gameState: fakeGameState,
            involvedPlayers: ['Player1', 'Player2'],
        };

        eventLogSubject.next(combatEvent);

        expect(component.addGameLog).toHaveBeenCalledWith(EventType.CombatStarted, undefined, ['Player1', 'Player2']);
    });

    it('should handle DebugActivated and DebugDeactivated events and add logs without player info', () => {
        const eventLogSubject = new Subject<{
            eventType: EventType;
            gameState: GameState;
            involvedPlayers?: string[];
            involvedPlayer?: string;
            description?: string;
        }>();
        lobbyServiceMock.onEventLog.and.returnValue(eventLogSubject.asObservable());
        spyOn(component, 'addGameLog');
        component.ngOnInit();

        const fakeGameState = {} as GameState;

        const debugActivatedEvent = { eventType: EventType.DebugActivated, gameState: fakeGameState };
        const debugDeactivatedEvent = { eventType: EventType.DebugDeactivated, gameState: fakeGameState };

        eventLogSubject.next(debugActivatedEvent);
        eventLogSubject.next(debugDeactivatedEvent);

        expect(component.addGameLog).toHaveBeenCalledWith(EventType.DebugActivated);
        expect(component.addGameLog).toHaveBeenCalledWith(EventType.DebugDeactivated);
    });

    it('should handle PlayerAbandonned event and add log with involvedPlayer', () => {
        const eventLogSubject = new Subject<{
            eventType: EventType;
            gameState: GameState;
            involvedPlayers?: string[];
            involvedPlayer?: string;
            description?: string;
        }>();
        lobbyServiceMock.onEventLog.and.returnValue(eventLogSubject.asObservable());
        spyOn(component, 'addGameLog');
        component.ngOnInit();

        const fakeGameState = {} as GameState;

        const abandonEvent = {
            eventType: EventType.PlayerAbandonned,
            gameState: fakeGameState,
            involvedPlayer: 'Player1',
        };

        eventLogSubject.next(abandonEvent);

        expect(component.addGameLog).toHaveBeenCalledWith(EventType.PlayerAbandonned, 'Player1');
    });

    it('should handle AttackResult, FleeSuccess, FleeFailure, and CombatEnded events and add logs with involvedPlayers and description', () => {
        const eventTypes = [EventType.AttackResult, EventType.FleeSuccess, EventType.FleeFailure, EventType.CombatEnded];
        const eventLogSubject = new Subject<{
            eventType: EventType;
            gameState: GameState;
            involvedPlayers?: string[];
            involvedPlayer?: string;
            description?: string;
        }>();
        lobbyServiceMock.onEventLog.and.returnValue(eventLogSubject.asObservable());
        spyOn(component, 'addGameLog');
        component.ngOnInit();

        const fakeGameState = {} as GameState;

        eventTypes.forEach((eventType) => {
            const eventData = {
                eventType,
                gameState: fakeGameState,
                involvedPlayers: ['Player1', 'Player2'],
                description: 'Test description',
            };
            eventLogSubject.next(eventData);
            expect(component.addGameLog).toHaveBeenCalledWith(eventType, undefined, ['Player1', 'Player2'], 'Test description');
        });
    });
    describe('addGameLog method', () => {
        beforeEach(() => {
            spyOn(component as any, 'scrollToBottom');
        });

        it('should add a log entry with all parameters', () => {
            const fakeTimestamp = '12:34:56';
            spyOn<any>(component, 'getFormattedTime').and.returnValue(fakeTimestamp);

            component.addGameLog(EventType.CombatStarted, 'Player1', ['Player1', 'Player2'], 'A description');

            expect(component.gameLog.length).toBe(1);
            expect(component.gameLog[0]).toEqual({
                timestamp: fakeTimestamp,
                eventType: EventType.CombatStarted,
                involvedPlayer: 'Player1',
                involvedPlayers: ['Player1', 'Player2'],
                description: 'A description',
            });
            expect((component as any).scrollToBottom).toHaveBeenCalledWith('gameLog');
        });

        it('should add a log entry with only eventType', () => {
            const fakeTimestamp = '23:45:01';
            spyOn<any>(component, 'getFormattedTime').and.returnValue(fakeTimestamp);

            component.addGameLog(EventType.DebugActivated);

            expect(component.gameLog.length).toBe(1);
            expect(component.gameLog[0]).toEqual({
                timestamp: fakeTimestamp,
                eventType: EventType.DebugActivated,
                involvedPlayer: undefined,
                involvedPlayers: undefined,
                description: undefined,
            });
            expect((component as any).scrollToBottom).toHaveBeenCalledWith('gameLog');
        });

        it('should accumulate multiple log entries', () => {
            const fakeTimestamp = '00:00:00';
            spyOn<any>(component, 'getFormattedTime').and.returnValue(fakeTimestamp);

            component.addGameLog(EventType.FleeSuccess, 'Player1');
            component.addGameLog(EventType.DebugDeactivated);

            expect(component.gameLog.length).toBe(2);
            expect(component.gameLog[0]).toEqual({
                timestamp: fakeTimestamp,
                eventType: EventType.FleeSuccess,
                involvedPlayer: 'Player1',
                involvedPlayers: undefined,
                description: undefined,
            });
            expect(component.gameLog[1]).toEqual({
                timestamp: fakeTimestamp,
                eventType: EventType.DebugDeactivated,
                involvedPlayer: undefined,
                involvedPlayers: undefined,
                description: undefined,
            });
            expect((component as any).scrollToBottom).toHaveBeenCalledWith('gameLog');
            expect((component as any).scrollToBottom).toHaveBeenCalledTimes(2);
        });
    });
});
