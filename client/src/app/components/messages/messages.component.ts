import { Component } from '@angular/core';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent {
    chatMessages: { timestamp: string; playerName: string; message: string }[] = []; // Tableau des messages du clavardage
    eventLog: { timestamp: string; eventType: string; description: string; involvedPlayers: string[] }[] = []; // Tableau des événements de jeu
    activeTab: string = 'chat'; // Onglet actif (chat ou journal de jeu)

    // Fonction pour ajouter un message de chat
    addChatMessage(playerName: string, message: string): void {
        const timestamp = this.getFormattedTime();
        this.chatMessages.push({ timestamp, playerName, message });
        this.scrollToBottom('chatMessages'); // Faire défiler vers le bas
    }

    // Fonction pour ajouter un événement au journal
    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        const timestamp = this.getFormattedTime();
        const event = { timestamp, eventType, description, involvedPlayers };
        this.eventLog.push(event);
        this.scrollToBottom('eventLog'); // Faire défiler vers le bas
    }

    // Fonction pour obtenir l'horodatage formaté
    private getFormattedTime(): string {
        const now = new Date();
        const hours = this.padTime(now.getHours());
        const minutes = this.padTime(now.getMinutes());
        const seconds = this.padTime(now.getSeconds());
        return `${hours}:${minutes}:${seconds}`;
    }

    // Ajouter un zéro devant si l'heure est inférieure à 10 (pour les minutes et secondes)
    private padTime(value: number): string {
        return value < 10 ? `0${value}` : value.toString();
    }

    private scrollToBottom(elementId: string): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }
}
