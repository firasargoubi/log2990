import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { ChatService } from '@app/services/chat.service';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
    imports: [
        FormsModule,
        CommonModule, // Add FormsModule to imports
    ],
})
export class MessagesComponent implements OnInit, OnDestroy {
    @Input() lobbyId: string; // Accepte lobbyId comme une entrée
    @Input() playerName: string = '';
    chatMessages = this.chatService.chatMessages;

    eventLog = this.chatService.eventLog;
    activeTab: string = 'chat';
    newMessage: string = '';

    constructor(private chatService: ChatService) {}

    ngOnInit(): void {
        if (this.lobbyId) {
            this.chatService.joinLobby(this.lobbyId);
        }

        this.chatService.onMessage().subscribe(() => {
            this.chatMessages = [...this.chatService.chatMessages];
        });
    }

    ngOnDestroy(): void {
        this.chatService.disconnect();
    }

    sendMessage(playerName: string, message: string): void {
        this.chatService.sendMessage(this.lobbyId, this.playerName, message);
        this.chatService.addChatMessage(this.playerName, message);
        this.newMessage = '';
    }

    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        this.chatService.addEvent(eventType, description, involvedPlayers);
    }
}
