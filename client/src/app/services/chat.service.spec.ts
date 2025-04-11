/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let service: ChatService;
    let mockSocket: any;
    let mockIo: jasmine.Spy;

    beforeEach(() => {
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

        mockIo = jasmine.createSpy('io').and.returnValue(mockSocket);
        (window as any).io = mockIo;

        TestBed.configureTestingModule({});
        service = TestBed.inject(ChatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
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
    });

    it('should format time correctly', () => {
        const mockDate = new Date(2023, 0, 1, 13, 5, 9);
        jasmine.clock().install();
        jasmine.clock().mockDate(mockDate);

        const time = (service as any).getFormattedTime();
        expect(time).toBe('13:05:09');
    });
    it('should pad time values correctly', () => {
        expect((service as any).padTime(9)).toBe('09');
        expect((service as any).padTime(10)).toBe('10');
        expect((service as any).padTime(0)).toBe('00');
    });
});
