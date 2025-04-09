import { Injectable } from '@angular/core';
import { GameEvents } from '@common/events';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

interface Message {
    playerName: string;
    content: string;
    lobbyId?: string;
}

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    chatMessages: { timestamp: string; playerName: string; message: string }[] = [];
    eventLog: { timestamp: string; eventType: string; description: string; involvedPlayers: string[] }[] = [];
    private socket: Socket;
    private messageSubject = new Subject<Message>();

    constructor() {
        this.socket = io('http://localhost:3000', { autoConnect: false });

        this.socket.on('connect', () => {
            this.socket.on(GameEvents.ChatMessage, (data: { playerName: string; message: string }) => {
                this.addChatMessage(data.playerName, data.message);
            });
        });
    }

    joinLobby(lobbyId: string): void {
        this.socket.connect();

        if (this.socket.connected) {
            this.socket.emit('joinLobby', lobbyId);
        } else {
            this.socket.once('connect', () => {
                this.socket.emit('joinLobby', lobbyId);
            });
        }
    }

    sendMessage(lobbyId: string, playerName: string, message: string): void {
        if (this.socket.connected) {
            this.socket.emit('sendMessage', {
                lobbyId,
                playerName,
                message,
            });
        }
    }

    addChatMessage(playerName: string, message: string): void {
        const timestamp = this.getFormattedTime();
        this.chatMessages.push({ timestamp, playerName, message });
    }

    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        const timestamp = this.getFormattedTime();
        const event = { timestamp, eventType, description, involvedPlayers };
        this.eventLog.push(event);
    }

    onMessage() {
        return this.messageSubject.asObservable();
    }

    disconnect(): void {
        this.socket.disconnect();
    }

    resetMessages(): void {
        this.chatMessages = [];
    }

    private getFormattedTime(): string {
        const now = new Date();
        const hours = this.padTime(now.getHours());
        const minutes = this.padTime(now.getMinutes());
        const seconds = this.padTime(now.getSeconds());
        return `${hours}:${minutes}:${seconds}`;
    }

    private padTime(value: number): string {
        return value < 10 ? `0${value}` : value.toString();
    }
}
