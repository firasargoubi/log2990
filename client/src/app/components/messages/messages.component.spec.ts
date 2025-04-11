/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/services/chat.service';
import { EventType } from '@common/events';
import { Player } from '@common/player';
import { Subject } from 'rxjs';
import { MessagesComponent } from './messages.component';

describe('MessagesComponent', () => {
    let component: MessagesComponent;
    let fixture: ComponentFixture<MessagesComponent>;
    let chatServiceMock: jasmine.SpyObj<ChatService>;

    beforeEach(async () => {
        chatServiceMock = jasmine.createSpyObj('ChatService', ['sendMessage', 'addEvent', 'disconnect', 'resetMessages'], {
            chatMessages: [],
            eventLog: [],
        });

        await TestBed.configureTestingModule({
            imports: [FormsModule, CommonModule],
            providers: [{ provide: ChatService, useValue: chatServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(MessagesComponent);
        component = fixture.componentInstance;

        component.lobbyId = 'test-lobby';
        component.playerName = 'test-player';

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Input Properties', () => {
        it('should have lobbyId input', () => {
            expect(component.lobbyId).toBe('test-lobby');
        });

        it('should have playerName input', () => {
            expect(component.playerName).toBe('test-player');
        });
    });

    describe('chatMessages', () => {
        it('should return chat messages from service', () => {
            const testMessages = [{ playerName: 'player1', message: 'test', timestamp: '00:00:00' }];

            Object.defineProperty(chatServiceMock, 'chatMessages', {
                get: () => testMessages,
                configurable: true,
            });

            expect(component.chatMessages).toEqual(testMessages);
            expect(component.chatMessages.length).toBe(1);
            expect(component.chatMessages[0]).toEqual({
                playerName: 'player1',
                message: 'test',
                timestamp: '00:00:00',
            });
        });
    });

    describe('Template', () => {
        it('should display player name', () => {
            const element = fixture.nativeElement.querySelector('.chat-header strong');
            expect(element.textContent).toContain('test-player');
        });

        it('should have chat and events tabs', () => {
            const tabs = fixture.nativeElement.querySelectorAll('.tabs button');
            expect(tabs.length).toBe(2);
            expect(tabs[0].textContent).toContain('Chat');
            expect(tabs[1].textContent).toContain('Journal de Jeu');
        });

        it('should show chat tab by default', () => {
            expect(component.activeTab).toBe('chat');
            const chatTab = fixture.nativeElement.querySelector('.tabs button.active');
            expect(chatTab.textContent).toContain('Chat');
        });

        it('should switch to events tab when clicked', () => {
            const eventTab = fixture.nativeElement.querySelectorAll('.tabs button')[1];
            eventTab.click();
            fixture.detectChanges();

            expect(component.activeTab).toBe('gameLog');
            const activeTab = fixture.nativeElement.querySelector('.tabs button.active');
            expect(activeTab.textContent).toContain('Journal de Jeu');
        });

        it('should display message input with send button', () => {
            const input = fixture.nativeElement.querySelector('.message-input input');
            const button = fixture.nativeElement.querySelector('.message-input button');

            expect(input).toBeTruthy();
            expect(input.getAttribute('placeholder')).toBe('Tapez un message...');
            expect(input.getAttribute('maxlength')).toBe('200');
            expect(button).toBeTruthy();
            expect(button.textContent).toContain('Envoyer');
        });
    });
    describe('filterGameLog', () => {
        beforeEach(() => {
            const logs = [
                { timestamp: 't1', eventType: 'Test', involvedPlayer: 'Alice' },
                { timestamp: 't2', eventType: 'Test', involvedPlayer: 'Bob' },
                { timestamp: 't3', eventType: 'Test', involvedPlayers: ['Alice', 'Charlie'] },
                { timestamp: 't4', eventType: 'Test', involvedPlayers: ['Bob'] },
            ];
            (component as any).gameLog = logs;
            component.currentPlayer = { name: 'Alice' } as Player;
        });

        it('should return full gameLog when filterByCurrentPlayer is false', () => {
            component.filterByCurrentPlayer = false;
            const result = component.filterGameLog;
            expect(result.length).toBe(4);
            expect(result).toEqual((component as any).gameLog);
        });

        it('should filter gameLog by current player when filterByCurrentPlayer is true', () => {
            component.filterByCurrentPlayer = true;
            const result = component.filterGameLog;
            expect(result.length).toBe(2);
            expect(result).toEqual([
                { timestamp: 't1', eventType: 'Test', involvedPlayer: 'Alice' },
                { timestamp: 't3', eventType: 'Test', involvedPlayers: ['Alice', 'Charlie'] },
            ]);
        });
    });
    describe('sendMessage', () => {
        let lobbyServiceMock: jasmine.SpyObj<any>;

        beforeEach(() => {
            lobbyServiceMock = jasmine.createSpyObj('LobbyService', ['sendMessage', 'onEventLog', 'onMessageReceived']);
            lobbyServiceMock.onEventLog.and.returnValue({
                subscribe: () => ({
                    unsubscribe: () => {
                        /* no operation */
                    },
                }),
            });
            lobbyServiceMock.onMessageReceived.and.returnValue({
                subscribe: () => ({
                    unsubscribe: () => {
                        /* no operation */
                    },
                }),
            });
            (component as any).lobbyService = lobbyServiceMock;
            component.lobbyId = 'test-lobby';
            component.playerName = 'test-player';
        });

        it('should send message when newMessage is valid', () => {
            component.newMessage = 'Valid message';
            component.sendMessage();
            expect(lobbyServiceMock.sendMessage).toHaveBeenCalledWith('test-lobby', 'test-player', 'Valid message');
            expect(component.newMessage).toBe('');
        });

        it('should not send message when newMessage is empty', () => {
            component.newMessage = '';
            component.sendMessage();
            expect(lobbyServiceMock.sendMessage).not.toHaveBeenCalled();
        });

        it('should not send message when newMessage exceeds MAX_MESSAGE_LENGTH', () => {
            component.newMessage = 'a'.repeat(201);
            component.sendMessage();
            expect(lobbyServiceMock.sendMessage).not.toHaveBeenCalled();
        });
    });
    describe('gameListeners', () => {
        let eventLogSubject: Subject<{
            eventType: any;
            gameState: any;
            involvedPlayers?: string[];
            involvedPlayer?: string;
            description?: string;
        }>;
        let lobbyServiceMock: jasmine.SpyObj<any>;

        const fakeGameState = {
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
        };

        beforeEach(() => {
            lobbyServiceMock = jasmine.createSpyObj('LobbyService', ['onEventLog']);
            (component as any).lobbyService = lobbyServiceMock;
            eventLogSubject = new Subject();
            lobbyServiceMock.onEventLog.and.returnValue(eventLogSubject.asObservable());
        });

        it('should handle TurnStarted event and add log', () => {
            spyOn<any>(component, 'addGameLog');
            component.ngOnInit();

            eventLogSubject.next({
                eventType: EventType.TurnStarted,
                gameState: fakeGameState,
            });

            expect((component as any).addGameLog).toHaveBeenCalledWith(EventType.TurnStarted, 'Player1');
        });

        it('should handle DoorClosed, DoorOpened, FlagPicked, and ItemPicked events and add logs correctly', () => {
            const eventTypes = [EventType.DoorClosed, EventType.DoorOpened, EventType.FlagPicked, EventType.ItemPicked];
            spyOn<any>(component, 'addGameLog');
            component.ngOnInit();

            eventTypes.forEach((eventType) => {
                eventLogSubject.next({
                    eventType,
                    gameState: fakeGameState,
                });
                expect((component as any).addGameLog).toHaveBeenCalledWith(eventType, 'Player1');
            });
        });

        it('should handle CombatStarted event and add log with involvedPlayers', () => {
            spyOn<any>(component, 'addGameLog');
            component.ngOnInit();

            eventLogSubject.next({
                eventType: EventType.CombatStarted,
                gameState: fakeGameState,
                involvedPlayers: ['Player1', 'Player2'],
            });

            expect((component as any).addGameLog).toHaveBeenCalledWith(EventType.CombatStarted, undefined, ['Player1', 'Player2']);
        });

        it('should handle DebugActivated and DebugDeactivated events and add logs without player info', () => {
            spyOn<any>(component, 'addGameLog');
            component.ngOnInit();

            const emptyGameState = {} as any;
            eventLogSubject.next({ eventType: EventType.DebugActivated, gameState: emptyGameState });
            eventLogSubject.next({ eventType: EventType.DebugDeactivated, gameState: emptyGameState });

            expect((component as any).addGameLog).toHaveBeenCalledWith(EventType.DebugActivated);
            expect((component as any).addGameLog).toHaveBeenCalledWith(EventType.DebugDeactivated);
        });

        it('should handle AttackResult, FleeSuccess, FleeFailure, and CombatEnded events and add logs with involvedPlayers and description', () => {
            const eventTypes = [EventType.AttackResult, EventType.FleeSuccess, EventType.FleeFailure, EventType.CombatEnded];
            spyOn<any>(component, 'addGameLog');
            component.ngOnInit();

            eventTypes.forEach((eventType) => {
                eventLogSubject.next({
                    eventType,
                    gameState: {} as any,
                    involvedPlayers: ['Player1', 'Player2'],
                    description: 'Test description',
                });
                expect((component as any).addGameLog).toHaveBeenCalledWith(eventType, undefined, ['Player1', 'Player2'], 'Test description');
            });
        });
    });
    describe('private addGameLog', () => {
        beforeEach(() => {
            chatServiceMock.getFormattedTime = jasmine.createSpy('getFormattedTime').and.returnValue('fixed-timestamp');
        });

        it('should add an event log with all parameters provided', () => {
            (component as any).addGameLog('TestEvent', 'PlayerA', ['PlayerA', 'PlayerB'], 'Test description');
            const gameLog = (component as any).gameLog;
            const addedLog = gameLog[gameLog.length - 1];

            expect(addedLog).toEqual({
                timestamp: 'fixed-timestamp',
                eventType: 'TestEvent',
                involvedPlayer: 'PlayerA',
                involvedPlayers: ['PlayerA', 'PlayerB'],
                description: 'Test description',
            });
        });

        it('should add an event log with only the event type provided', () => {
            (component as any).addGameLog('SimpleEvent');
            const gameLog = (component as any).gameLog;
            const addedLog = gameLog[gameLog.length - 1];

            expect(addedLog).toEqual({
                timestamp: 'fixed-timestamp',
                eventType: 'SimpleEvent',
                involvedPlayer: undefined,
                involvedPlayers: undefined,
                description: undefined,
            });
        });
    });
    describe('chatInitialization', () => {
        let messageSubject: Subject<{ playerName: string; message: string }>;

        beforeEach(() => {
            messageSubject = new Subject<{ playerName: string; message: string }>();
            (component as any).lobbyService.onMessageReceived = () => messageSubject.asObservable();
        });

        it('should call chatService.addChatMessage when a new message is received', () => {
            (component as any).chatService.addChatMessage = jasmine.createSpy('addChatMessage');
            (component as any).chatInitialization();

            const testPayload = { playerName: 'Alice', message: 'Hello, world!' };
            messageSubject.next(testPayload);
            expect((component as any).chatService.addChatMessage).toHaveBeenCalledWith('Alice', 'Hello, world!');
        });
    });
});
