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
    chatMessages = this.chatService.chatMessages;

    eventLog = this.chatService.eventLog;
    activeTab: string = 'chat';
    newMessage: string = '';
    player: string = ''; // Define the player property with an initial value

    constructor(private chatService: ChatService) {}

    ngOnInit(): void {
        // Listen for new chat messages
        this.chatService.onMessage().subscribe((message) => {
            console.log('New message received:', message);
        });
    }

    ngOnDestroy(): void {
        this.chatService.disconnect();
    }

    sendMessage(playerName: string, message: string): void {
        this.chatService.sendMessage(playerName, message);
        this.chatService.addChatMessage(playerName, message);
        this.newMessage = ''; // Clear input after sending message
    }

    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        this.chatService.addEvent(eventType, description, involvedPlayers);
    }
}
