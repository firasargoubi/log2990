import { Injectable } from '@angular/core';
import { PAD_TIME_VALUE } from '@app/Consts/app-constants';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    chatMessages: { timestamp: string; playerName: string; message: string }[] = [];

    addChatMessage(playerName: string, message: string): void {
        const timestamp = this.getFormattedTime();
        this.chatMessages.push({ timestamp, playerName, message });
    }

    getFormattedTime(): string {
        const now = new Date();
        const hours = this.padTime(now.getHours());
        const minutes = this.padTime(now.getMinutes());
        const seconds = this.padTime(now.getSeconds());
        return `${hours}:${minutes}:${seconds}`;
    }

    private padTime(value: number): string {
        return value < PAD_TIME_VALUE ? `0${value}` : value.toString();
    }
}
