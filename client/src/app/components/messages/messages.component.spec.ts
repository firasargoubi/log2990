/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/services/chat.service';
import { MessagesComponent } from './messages.component';

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

    describe('sendMessage()', () => {
        it('should call chatService.sendMessage with correct parameters when message is valid', () => {
            component.newMessage = 'Hello world';
            component.sendMessage();

            expect(chatServiceMock.sendMessage).toHaveBeenCalledWith('test-lobby', 'test-player', 'Hello world');
        });

        it('should not send message when empty', () => {
            component.newMessage = '';
            component.sendMessage();

            expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();
        });

        it('should not send message when exceeding max length', () => {
            component.newMessage = 'a'.repeat(201); // MAX_MESSAGE_LENGTH + 1
            component.sendMessage();

            expect(chatServiceMock.sendMessage).not.toHaveBeenCalled();
        });

        it('should clear newMessage after sending', () => {
            component.newMessage = 'Test message';
            component.sendMessage();

            expect(component.newMessage).toBe('');
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
            expect(tabs[1].textContent).toContain('Events');
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

            expect(component.activeTab).toBe('events');
            const activeTab = fixture.nativeElement.querySelector('.tabs button.active');
            expect(activeTab.textContent).toContain('Events');
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
});
