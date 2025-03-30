import { Injectable } from '@angular/core';
import { GameEvents } from '@common/events'; // Adjust path as necessary
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

interface Message {
    playerName: string;
    content: string;
}

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    chatMessages: { timestamp: string; playerName: string; message: string }[] = [];
    eventLog: { timestamp: string; eventType: string; description: string; involvedPlayers: string[] }[] = [];
    private socket: Socket; // Define the socket variable
    private messageSubject = new Subject<Message>();

    constructor() {
        this.socket = io('http://localhost:3000'); // Replace with your actual server URL

        // Listen for chat messages
        this.socket.on(GameEvents.ChatMessage, (data: { playerName: string; message: string }) => {
            console.log(`${data.playerName}: ${data.message}`);
            // this.addChatMessage(data.playerName, data.message);
        });
    }

    // Send a message to the server
    sendMessage(lobbyId: string, message: string): void {
        if (this.socket.connected) {
            console.log('ouiii connected');
            this.socket.emit('sendMessage', lobbyId, message);
        } else {
            console.error('WebSocket is not connected!');
            this.socket.connect(); // Reconnect if necessary
        }
    }

    // Join a chat lobby
    joinChat(lobbyId: string): void {
        this.socket.emit('joinChat', lobbyId);
    }

    // Add a message to the chat log
    addChatMessage(playerName: string, message: string): void {
        const timestamp = this.getFormattedTime();
        console.log('on va push ', message);
        this.chatMessages.push({ timestamp, playerName, message });
        this.scrollToBottom('chatMessages');

        // Emit the new message so that other clients are notified
        this.messageSubject.next({ playerName, content: message });
    }

    // Add an event to the event log
    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        const timestamp = this.getFormattedTime();
        const event = { timestamp, eventType, description, involvedPlayers };
        this.eventLog.push(event);
        this.scrollToBottom('eventLog');
    }

    // Listen for incoming messages
    onMessage() {
        return this.messageSubject.asObservable();
    }

    // Disconnect from the WebSocket server
    disconnect(): void {
        this.socket.disconnect(); // Use disconnect method of Socket.io
    }

    // Helper function to get formatted time
    private getFormattedTime(): string {
        const now = new Date();
        const hours = this.padTime(now.getHours());
        const minutes = this.padTime(now.getMinutes());
        const seconds = this.padTime(now.getSeconds());
        return `${hours}:${minutes}:${seconds}`;
    }

    // Helper function to pad time values to 2 digits
    private padTime(value: number): string {
        return value < 10 ? `0${value}` : value.toString();
    }

    // Scroll the chat container to the bottom (for auto-scrolling)
    private scrollToBottom(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }
}
