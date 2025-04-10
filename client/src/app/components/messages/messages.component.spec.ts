/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/services/chat.service';
import { MessagesComponent } from './messages.component';
import { Player } from '@common/player';

describe('MessagesComponent', () => {
    let component: MessagesComponent;
    let fixture: ComponentFixture<MessagesComponent>;
    let chatServiceMock: jasmine.SpyObj<ChatService>;

    beforeEach(async () => {
        // Create a spy object for ChatService with the methods we need
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

        // Set required input properties
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
            // Arrange
            const testMessages = [{ playerName: 'player1', message: 'test', timestamp: '00:00:00' }];

            // Directly set the mock value on the chatServiceMock
            Object.defineProperty(chatServiceMock, 'chatMessages', {
                get: () => testMessages,
                configurable: true,
            });

            // Act & Assert
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
            // Only logs with involvedPlayer "Alice" or with involvedPlayers array including "Alice" should be returned
            expect(result.length).toBe(2);
            expect(result).toEqual([
                { timestamp: 't1', eventType: 'Test', involvedPlayer: 'Alice' },
                { timestamp: 't3', eventType: 'Test', involvedPlayers: ['Alice', 'Charlie'] },
            ]);
        });
    });
});
