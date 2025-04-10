/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { GameEvents } from '@common/events';
import { Subject } from 'rxjs';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let service: ChatService;
    let mockSocket: any;
    let mockIo: jasmine.Spy;

    beforeEach(() => {
        // Create a complete mock socket object
        mockSocket = {
            on: jasmine.createSpy('on').and.callFake((event: string, cb: Function) => {
                if (event === 'connect') {
                    mockSocket.connectCallback = cb;
                }
            }),
            once: jasmine.createSpy('once'),
            emit: jasmine.createSpy('emit'),
            connect: jasmine.createSpy('connect').and.callFake(() => {
                mockSocket.connected = true;
                if (mockSocket.connectCallback) {
                    mockSocket.connectCallback();
                }
            }),
            disconnect: jasmine.createSpy('disconnect').and.callFake(() => {
                mockSocket.connected = false;
            }),
            connected: false,
        };

        // Mock the io function
        mockIo = jasmine.createSpy('io').and.returnValue(mockSocket);
        (window as any).io = mockIo;

        TestBed.configureTestingModule({});
        service = TestBed.inject(ChatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize socket with correct URL and autoConnect false', () => {
        expect(mockIo).toHaveBeenCalledWith('http://localhost:3000', { autoConnect: false });
    });

    it('should set up connect listener', () => {
        expect(mockSocket.on).toHaveBeenCalledWith('connect', jasmine.any(Function));
    });

    describe('joinLobby', () => {
        it('should connect socket if not already connected', () => {
            mockSocket.connected = false;
            service.joinLobby('test-lobby');
            expect(mockSocket.connect).toHaveBeenCalled();
        });

        it('should emit joinLobby immediately if already connected', () => {
            mockSocket.connected = true;
            service.joinLobby('test-lobby');
            expect(mockSocket.emit).toHaveBeenCalledWith('joinLobby', 'test-lobby');
        });

        it('should emit joinLobby on connect if not initially connected', () => {
            mockSocket.connected = false;
            // const connectCallback = jasmine.createSpy('connectCallback');
            mockSocket.once.and.callFake((event: string, cb: Function) => {
                if (event === 'connect') {
                    cb(); // Simulate connection
                }
            });

            service.joinLobby('test-lobby');
            expect(mockSocket.emit).toHaveBeenCalledWith('joinLobby', 'test-lobby');
        });
    });

    describe('sendMessage', () => {
        it('should emit sendMessage with correct data when connected', () => {
            mockSocket.connected = true;
            service.sendMessage('lobby1', 'player1', 'Hello');
            expect(mockSocket.emit).toHaveBeenCalledWith('sendMessage', {
                lobbyId: 'lobby1',
                playerName: 'player1',
                message: 'Hello',
            });
        });

        it('should not emit when not connected', () => {
            mockSocket.connected = false;
            service.sendMessage('lobby1', 'player1', 'Hello');
            expect(mockSocket.emit).not.toHaveBeenCalled();
        });
    });

    describe('Message Handling', () => {
        it('should add chat message with timestamp', () => {
            const initialCount = service.chatMessages.length;
            service.addChatMessage('player1', 'Hello');
            expect(service.chatMessages.length).toBe(initialCount + 1);
            expect(service.chatMessages[initialCount].playerName).toBe('player1');
            expect(service.chatMessages[initialCount].message).toBe('Hello');
            expect(service.chatMessages[initialCount].timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });

        it('should handle incoming chat messages', () => {
            // Setup the chat message callback
            const testMessage = { playerName: 'remote', message: 'Hi there' };
            mockSocket.on.and.callFake((event: string, cb: () => void) => {
                if (event === GameEvents.ChatMessage) {
                    cb();
                }
            });

            // Trigger the connection to setup handlers
            mockSocket.connect();

            expect(service.chatMessages.length).toBe(0);
            expect(service.chatMessages[0].playerName).toBe(testMessage.playerName);
            expect(service.chatMessages[0].message).toBe(testMessage.message);
        });
    });

    describe('Utility Methods', () => {
        it('should provide message observable', () => {
            const observable = service.onMessage();
            expect(observable).toEqual(jasmine.any(Subject));
        });

        it('should disconnect socket', () => {
            service.disconnect();
            expect(mockSocket.disconnect).toHaveBeenCalled();
        });

        it('should reset messages', () => {
            service.addChatMessage('player1', 'message1');
            service.resetMessages();
            expect(service.chatMessages.length).toBe(0);
        });

        it('should format time correctly', () => {
            const mockDate = new Date(2023, 0, 1, 13, 5, 9);
            jasmine.clock().install();
            jasmine.clock().mockDate(mockDate);

            const time = (service as any).getFormattedTime();
            expect(time).toBe('13:05:09');
        });

        it('should pad single-digit time values', () => {
            const mockDate = new Date(2023, 0, 1, 9, 5, 7);
            jasmine.clock().install();
            jasmine.clock().mockDate(mockDate);

            const time = (service as any).getFormattedTime();
            expect(time).toBe('09:05:07');
        });

        it('should pad time values correctly', () => {
            expect((service as any).padTime(9)).toBe('09');
            expect((service as any).padTime(10)).toBe('10');
            expect((service as any).padTime(0)).toBe('00');
        });
    });
});
