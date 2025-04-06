import { Component, inject, Input, OnInit } from '@angular/core';
import { PAD_TIME_VALUE } from '@app/Consts/app-constants';
import { LobbyService } from '@app/services/lobby.service';
import { EventType } from '@common/events';
import { Player } from '@common/player';

@Component({
    selector: 'app-game-log',
    templateUrl: './game-log.component.html',
    styleUrls: ['./game-log.component.scss'],
})
export class GameLogComponent implements OnInit {
    @Input() currentPlayer: Player;
    activeTab: string = 'gameLog';
    gameLog: { timestamp: string; eventType: string; involvedPlayers?: string[]; involvedPlayer?: string; description?: string }[] = [];
    filterByCurrentPlayer = false;
    private lobbyService = inject(LobbyService);

    get filterGameLog(): { timestamp: string; eventType: string; involvedPlayers?: string[]; involvedPlayer?: string; description?: string }[] {
        if (!this.filterByCurrentPlayer) {
            return this.gameLog;
        }
        return this.gameLog.filter(
            (log) => log.involvedPlayer === this.currentPlayer.name || (log.involvedPlayers && log.involvedPlayers.includes(this.currentPlayer.name)),
        );
    }
    ngOnInit(): void {
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
                case EventType.CombatStarted: {
                    this.addGameLog(eventType, undefined, data?.involvedPlayers);
                    break;
                }
                case EventType.DebugActivated:
                case EventType.DebugDeactivated: {
                    this.addGameLog(eventType);
                    break;
                }
                case EventType.PlayerAbandonned: {
                    this.addGameLog(eventType, data?.involvedPlayer);
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
