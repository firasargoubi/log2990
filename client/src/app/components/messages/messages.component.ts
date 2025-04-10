import { Component, ElementRef, ViewChild } from '@angular/core';
import { PAD_TIME_VALUE } from '@app/consts/app-constants';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
})
export class MessagesComponent {
    @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef;
    @ViewChild('eventLogContainer') eventLogContainer!: ElementRef;
    chatMessages: { timestamp: string; playerName: string; message: string }[] = [];
    eventLog: { timestamp: string; eventType: string; description: string; involvedPlayers: string[] }[] = [];
    activeTab: string = 'chat';

    addChatMessage(playerName: string, message: string): void {
        const timestamp = this.getFormattedTime();
        this.chatMessages.push({ timestamp, playerName, message });
        this.scrollToBottom('chatMessages');
    }

    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        const timestamp = this.getFormattedTime();
        const event = { timestamp, eventType, description, involvedPlayers };
        this.eventLog.push(event);
        this.scrollToBottom('eventLog');
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

    private scrollToBottom(container: 'chatMessages' | 'eventLog'): void {
        const target = container === 'chatMessages' ? this.chatMessagesContainer : this.eventLogContainer;
        if (target?.nativeElement) {
            target.nativeElement.scrollTop = target.nativeElement.scrollHeight;
        }
    }
}
