import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '@app/services/chat.service';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
    standalone: true,
    imports: [FormsModule, CommonModule],
})
export class MessagesComponent {
    @Input() lobbyId: string;
    @Input() playerName: string = '';

    messages: { playerName: string; message: string; timestamp: string }[] = [];
    eventLog = this.chatService.eventLog;
    activeTab: string = 'chat';
    newMessage: string = '';

    constructor(private chatService: ChatService) {}

    get chatMessages() {
        return this.chatService.chatMessages;
    }

    sendMessage(): void {
        if (!this.newMessage || this.newMessage.length > 200) return;
        this.chatService.sendMessage(this.lobbyId, this.playerName, this.newMessage);
        this.newMessage = '';
    }

    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        this.chatService.addEvent(eventType, description, involvedPlayers);
    }
}
