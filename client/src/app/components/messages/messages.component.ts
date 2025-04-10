import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAX_MESSAGE_LENGTH } from '@app/Consts/app-constants';
import { ChatService } from '@app/services/chat.service';
import { LobbyService } from '@app/services/lobby.service';
import { EventType } from '@common/events';
import { Player } from '@common/player';

@Component({
    selector: 'app-messages',
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.scss'],
    standalone: true,
    imports: [FormsModule, CommonModule],
})
export class MessagesComponent implements OnInit {
    private static listenersInitialized = false;
    @Input() lobbyId: string;
    @Input() playerName: string = '';
    @Input() currentPlayer: Player;
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
        if (!MessagesComponent.listenersInitialized) {
            this.chatInitialization();
            MessagesComponent.listenersInitialized = true;
        }
        this.gameListeners();
    }

    sendMessage(): void {
        if (!this.newMessage || this.newMessage.length > MAX_MESSAGE_LENGTH) return;
        this.lobbyService.sendMessage(this.lobbyId, this.playerName, this.newMessage);
        this.newMessage = '';
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

    private chatInitialization(): void {
        this.lobbyService.onMessageReceived().subscribe((data) => {
            const { playerName, message } = data;
            this.chatService.addChatMessage(playerName, message);
        });
    }

    private addGameLog(eventType: string, involvedPlayer?: string, involvedPlayers?: string[], description?: string): void {
        const timestamp = this.chatService.getFormattedTime();
        const event = {
            timestamp,
            eventType,
            involvedPlayer,
            involvedPlayers,
            description,
        };
        this.gameLog.push(event);
    }
}
