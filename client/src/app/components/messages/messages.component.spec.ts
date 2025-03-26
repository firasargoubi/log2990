/* eslint-disable @typescript-eslint/no-magic-numbers */
import { MessagesComponent } from './messages.component';

describe('MessagesComponent', () => {
    let component: MessagesComponent;

    beforeEach(() => {
        component = new MessagesComponent();
    });

    it('should initialize with empty chatMessages, eventLog, and activeTab set to chat', () => {
        expect(component.chatMessages).toEqual([]);
        expect(component.eventLog).toEqual([]);
        expect(component.activeTab).toBe('chat');
    });

    describe('addChatMessage', () => {
        it('should add a message with timestamp, player name, and message content', () => {
            const mockDate = new Date(2023, 10, 1, 12, 30, 45);
            jasmine.clock().install();
            jasmine.clock().mockDate(mockDate);

            component.addChatMessage('Player1', 'Hello there');
            const message = component.chatMessages[0];

            expect(component.chatMessages.length).toBe(1);
            expect(message.playerName).toBe('Player1');
            expect(message.message).toBe('Hello there');
            expect(message.timestamp).toBe('12:30:45');

            jasmine.clock().uninstall();
        });

        it('should format timestamp with leading zeros for single-digit values', () => {
            const mockDate = new Date(2023, 10, 1, 5, 3, 9);
            jasmine.clock().install();
            jasmine.clock().mockDate(mockDate);

            component.addChatMessage('Player', 'Test');
            expect(component.chatMessages[0].timestamp).toBe('05:03:09');

            jasmine.clock().uninstall();
        });

        it('should scroll to the bottom of the chatMessages container', () => {
            const mockElement = { scrollHeight: 150, scrollTop: 0 };
            spyOn(document, 'getElementById').and.returnValue(mockElement as HTMLElement);

            component.addChatMessage('Player', 'Hi');
            expect(document.getElementById).toHaveBeenCalledWith('chatMessages');
            expect(mockElement.scrollTop).toBe(150);
        });

        it('should handle missing chatMessages container gracefully', () => {
            spyOn(document, 'getElementById').and.returnValue(null);
            expect(() => component.addChatMessage('Player', 'Message')).not.toThrow();
            expect(component.chatMessages.length).toBe(1);
        });
    });

    describe('addEvent', () => {
        it('should add an event with timestamp, type, description, and involved players', () => {
            const mockDate = new Date(2023, 10, 1, 14, 15, 16);
            jasmine.clock().install();
            jasmine.clock().mockDate(mockDate);

            component.addEvent('attack', 'Player attacked enemy', ['Player1', 'Enemy']);
            const event = component.eventLog[0];

            expect(component.eventLog.length).toBe(1);
            expect(event.eventType).toBe('attack');
            expect(event.description).toBe('Player attacked enemy');
            expect(event.involvedPlayers).toEqual(['Player1', 'Enemy']);
            expect(event.timestamp).toBe('14:15:16');

            jasmine.clock().uninstall();
        });

        it('should format event timestamps correctly with leading zeros', () => {
            const mockDate = new Date(2023, 10, 1, 9, 5, 2);
            jasmine.clock().install();
            jasmine.clock().mockDate(mockDate);

            component.addEvent('item', 'Picked up item', ['Player']);
            expect(component.eventLog[0].timestamp).toBe('09:05:02');

            jasmine.clock().uninstall();
        });

        it('should scroll to the bottom of the eventLog container', () => {
            const mockElement = { scrollHeight: 200, scrollTop: 0 };
            spyOn(document, 'getElementById').and.returnValue(mockElement as HTMLElement);

            component.addEvent('defend', 'Player defended', ['Player']);
            expect(document.getElementById).toHaveBeenCalledWith('eventLog');
            expect(mockElement.scrollTop).toBe(200);
        });

        it('should handle missing eventLog container gracefully', () => {
            spyOn(document, 'getElementById').and.returnValue(null);
            expect(() => component.addEvent('move', 'Player moved', ['Player'])).not.toThrow();
            expect(component.eventLog.length).toBe(1);
        });
    });
});
