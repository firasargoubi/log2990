import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatService } from '@app/services/chat.service';
@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent implements OnInit, OnDestroy {
    chatMessages = this.chatService.chatMessages;
    eventLog = this.chatService.eventLog;
    activeTab: string = 'chat';

    constructor(private chatService: ChatService) {}

    ngOnInit(): void {
        // Écoute des messages entrants du serveur WebSocket
        this.chatService.onMessage().subscribe((message: { playerName: string; content: string }) => {
            this.chatService.addChatMessage(message.playerName, message.content);
        });
    }

    ngOnDestroy(): void {
        this.chatService.disconnect();
    }

    sendMessage(playerName: string, message: string): void {
        this.chatService.sendMessage(playerName, message);
    }

    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        this.chatService.addEvent(eventType, description, involvedPlayers);
    }
}
