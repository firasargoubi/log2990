import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { STATS_CONSTS } from '@app/Consts/stats-constants';

@Component({
    selector: 'app-stats-page',
    imports: [],
    templateUrl: './stats-page.component.html',
    styleUrls: ['./stats-page.component.scss'],
})
export class StatsPageComponent {
    winnersNames: string[] = [];
    winnersAvatars: string[] = [];
    gameState!: GameState;
    timeSeconds: number = 0;
    timeMinutes: number = 0;
    timeHours: number = 0;
    boardSize: number;
    coveredTilePercentage: number = 0;
    sortColumn: string = '';
    sortDirection: 'asc' | 'desc' = 'asc';

    constructor(private router: Router) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras.state as {
            winner: string;
            lobbyId: string;
            gameState: GameState;
        };

        if (state) {
            this.winnersNames = Array.isArray(state.winner) ? state.winner : state.winner.split(', ').map((name) => name.trim());
            this.gameState = state.gameState;
            this.boardSize = this.gameState.board.length * this.gameState.board[0].length;

            if (this.gameState.visitedTiles) {
                this.coveredTilePercentage = Math.floor((this.gameState.visitedTiles.length / this.boardSize) * STATS_CONSTS.percentage);
            }

            if (this.gameState.endDate) {
                this.gameState.startDate = this.parseDate(this.gameState.startDate);
                this.gameState.endDate = this.parseDate(this.gameState.endDate);
                const durationMs = this.gameState.endDate.getTime() - this.gameState.startDate.getTime();
                const totalSeconds = Math.floor(durationMs / STATS_CONSTS.secondsDiv);
                this.timeHours = Math.floor(totalSeconds / STATS_CONSTS.hoursDiv);
                this.timeMinutes = Math.floor((totalSeconds % STATS_CONSTS.hoursDiv) / STATS_CONSTS.timeDiv);
                this.timeSeconds = totalSeconds % STATS_CONSTS.timeDiv;
            }
            this.winnersAvatars = this.gameState.players.filter((player) => this.winnersNames.includes(player.name)).map((player) => player.avatar);
        } else {
            this.winnersNames = ['Unknown'];
        }
    }

    get formattedDuration(): string {
        const hours = this.timeHours.toString().padStart(2, '0');
        const minutes = this.timeMinutes.toString().padStart(2, '0');
        const seconds = this.timeSeconds.toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    return() {
        this.router.navigate([PageUrl.Home], { replaceUrl: true });
    }

    trackByName(index: number, name: string) {
        return name;
    }

    floor(number: number): number {
        return Math.floor(number);
    }

    sortPlayersBy(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.gameState.players.sort((a: Player, b: Player) => {
            const valueA = this.getSortValue(a, column);
            const valueB = this.getSortValue(b, column);

            if ((valueA as number) < (valueB as number)) return 1;
            if ((valueA as number) > (valueB as number)) return -1;
            return 0;
        });
    }

    private getSortValue(player: Player, column: string): unknown {
        switch (column) {
            case 'fightCount':
                return player.fightCount;
            case 'fleeCount':
                return player.fleeCount;
            case 'winCount':
                return player.winCount;
            case 'loseCount':
                return player.loseCount;
            case 'damageReceived':
                return player.damageReceived || 0;
            case 'damageDealt':
                return player.damageDealt || 0;
            case 'itemsPicked':
                return player.itemsPicked?.length || 0;
            case 'visitedTiles':
                return (player.visitedTiles?.length || 0) / this.boardSize;
            default:
                return 0;
        }
    }

    private parseDate(value: Date | string): Date {
        return value instanceof Date ? value : new Date(value);
    }
}
