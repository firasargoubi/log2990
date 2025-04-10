import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { PAD_TIME_VALUE } from '@app/Consts/app-constants';
import { FormsModule } from '@angular/forms';
import { EventType } from '@common/events';
import { ChatService } from '@app/services/chat.service';
import { LobbyService } from '@app/services/lobby.service';
import { Player } from '@common/player';

const MAX_MESSAGE_LENGTH = 200;
@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
    standalone: true,
    imports: [FormsModule, CommonModule],
})
export class MessagesComponent implements OnInit {
    @Input() lobbyId: string;
    @Input() playerName: string = '';
    @Input() currentPlayer: Player;
    @ViewChild('gameLog') gameLogRef!: ElementRef<HTMLDivElement>;
    messages: { playerName: string; message: string; timestamp: string }[] = [];
    activeTab: 'chat' | 'gameLog' = 'chat';
    newMessage: string = '';
    filterByCurrentPlayer = false;
    private gameLog: { timestamp: string; eventType: string; involvedPlayer?: string; involvedPlayers?: string[]; description?: string }[] = [];
    private lobbyService = inject(LobbyService);
    private chatService = inject(ChatService);

    get chatMessages() {
        return this.chatService.chatMessages;
    }

    get filterGameLog(): { timestamp: string; eventType: string; involvedPlayer?: string; involvedPlayers?: string[]; description?: string }[] {
        if (!this.filterByCurrentPlayer) {
            return this.gameLog;
        }
        return this.gameLog.filter(
            (log) => log.involvedPlayer === this.currentPlayer.name || (log.involvedPlayers && log.involvedPlayers.includes(this.currentPlayer.name)),
        );
    }

    ngOnInit(): void {
        this.gameListeners();
    }

    sendMessage(): void {
        if (!this.newMessage || this.newMessage.length > MAX_MESSAGE_LENGTH) return;
        this.chatService.sendMessage(this.lobbyId, this.playerName, this.newMessage);
        this.newMessage = '';
    }

    addEvent(eventType: string, description: string, involvedPlayers: string[]): void {
        this.chatService.addEvent(eventType, description, involvedPlayers);
    }

    private gameListeners(): void {
        this.lobbyService.onEventLog().subscribe((data) => {
            const eventType = data.eventType;
            switch (eventType) {
                case EventType.TurnStarted:
                case EventType.DoorClosed:
                case EventType.DoorOpened:
                case EventType.FlagPicked:
                case EventType.ItemPicked: {
                    const involvedPlayerId = data.gameState.currentPlayer;
                    const involvedPlayer = data.gameState.players.find((player) => player.id === involvedPlayerId)?.name;
                    this.addGameLog(eventType, involvedPlayer);
                    break;
                }
                case EventType.CombatStarted:
                case EventType.PlayerAbandonned: {
                    this.addGameLog(eventType, undefined, data?.involvedPlayers);
                    break;
                }
                case EventType.DebugActivated:
                case EventType.DebugDeactivated: {
                    this.addGameLog(eventType);
                    break;
                }
                case EventType.AttackResult:
                case EventType.FleeSuccess:
                case EventType.FleeFailure:
                case EventType.CombatEnded: {
                    this.addGameLog(eventType, undefined, data?.involvedPlayers, data?.description);
                    break;
                }
                default:
                    break;
            }
        });
    }
    private addGameLog(eventType: string, involvedPlayer?: string, involvedPlayers?: string[], description?: string): void {
        const timestamp = this.getFormattedTime();
        const event = {
            timestamp,
            eventType,
            involvedPlayer,
            involvedPlayers,
            description,
        };
        this.gameLog.push(event);
        this.scrollToBottom();
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

    private scrollToBottom(): void {
        setTimeout(() => {
            const element = this.gameLogRef?.nativeElement;
            if (element) {
                element.scrollTop = element.scrollHeight;
            }
        }, 0);
    }
}
