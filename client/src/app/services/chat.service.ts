import { Injectable } from '@angular/core';
import { PAD_TIME_VALUE } from '@app/Consts/app.constants';
import { Subject } from 'rxjs';

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
    private socket: WebSocket;
    private messageSubject = new Subject<Message>();

    constructor() {
        this.connect();
    }

    // Méthode pour envoyer un message
    sendMessage(playerName: string, message: string): void {
        const messageData = { playerName, content: message };
        this.socket.send(JSON.stringify(messageData));
    }

    // Ajouter un message au chat
    addChatMessage(playerName: string, message: string): void {
        const timestamp = this.getFormattedTime();
        this.chatMessages.push({ timestamp, playerName, message });
        this.scrollToBottom('chatMessages');
    }

    // Ajouter un événement à l'historique
    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        const timestamp = this.getFormattedTime();
        const event = { timestamp, eventType, description, involvedPlayers };
        this.eventLog.push(event);
        this.scrollToBottom('eventLog');
    }

    // Obtenir les messages en temps réel

    onMessage() {
        return this.messageSubject.asObservable();
    }

    // Fermer la connexion WebSocket
    disconnect(): void {
        this.socket.close();
    }

    private getFormattedTime(): string {
        const now = new Date();
        const hours = this.padTime(now.getHours());
        const minutes = this.padTime(now.getMinutes());
        const seconds = this.padTime(now.getSeconds());
        return `${hours}:${minutes}:${seconds}`;
    }

    private padTime(value: number): string {
        return value < PAD_TIME_VALUE ? `0${value}` : value.toString();
    }

    private scrollToBottom(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    private connect(): void {
        this.socket = new WebSocket('ws://votre-serveur-websocket.com');

        this.socket.onmessage = (event) => {
            const messageData = JSON.parse(event.data);
            this.messageSubject.next(messageData);
        };

        this.socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        this.socket.onerror = (error) => {
            console.log('WebSocket Error: ', error);
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }
}
