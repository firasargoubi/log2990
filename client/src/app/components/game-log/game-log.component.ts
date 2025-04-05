import { Component, inject, OnInit } from '@angular/core';
import { PAD_TIME_VALUE } from '@app/Consts/app-constants';
import { LobbyService } from '@app/services/lobby.service';

@Component({
    selector: 'app-game-log',
    templateUrl: './game-log.component.html',
    styleUrls: ['./game-log.component.scss'],
})
export class GameLogComponent implements OnInit {
    activeTab: string = 'gameLog';
    gameLog: { timestamp: string; eventType: string; involvedPlayers?: string[]; involvedPlayer?: string; description?: string }[] = [];
    private lobbyService = inject(LobbyService);

    ngOnInit(): void {
        this.lobbyService.onEventLog().subscribe((data) => {
            if (
                data.eventType === 'Le tour a commencé' ||
                data.eventType === 'Une porte a été fermée' ||
                data.eventType === 'Une porte a été ouverte'
            ) {
                const involvedPlayerId = data.gameState.currentPlayer;
                const involvedPlayer = data.gameState.players.find((player) => player.id === involvedPlayerId)?.name;
                this.addGameLog(data.eventType, involvedPlayer);
            } else if (data.eventType === 'Un combat a commencé') {
                const involvedPlayers = data?.involvedPlayers;
                this.addGameLog(data.eventType, undefined, involvedPlayers);
            } else if (data.eventType === 'Un combat a terminé') {
                const description = 'Le gagnant est ' + (data?.involvedPlayers?.[0] ?? 'inconnu');
                this.addGameLog(data.eventType, undefined, undefined, description);
            } else if (data.eventType === 'Debug activé' || data.eventType === 'Debug désactivé') {
                this.addGameLog(data.eventType, undefined, undefined, undefined);
            }
        });
    }

    addGameLog(eventType: string, involvedPlayer?: string, involvedPlayers?: string[], description?: string): void {
        const timestamp = this.getFormattedTime();
        const event = {
            timestamp,
            eventType,
            involvedPlayer,
            involvedPlayers,
            description,
        };
        this.gameLog.push(event);
        this.scrollToBottom('gameLog');
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
}
