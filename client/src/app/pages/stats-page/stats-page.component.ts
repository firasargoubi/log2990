import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';

@Component({
    selector: 'app-stats-page',
    standalone: true,
    imports: [CommonModule],
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
    boardSize: number = 0;
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
                this.coveredTilePercentage = Math.floor((this.gameState.visitedTiles.length / this.boardSize) * 100);
            }

            if (this.gameState.endDate) {
                this.gameState.startDate = this.parseDate(this.gameState.startDate);
                this.gameState.endDate = this.parseDate(this.gameState.endDate);
                const durationMs = this.gameState.endDate.getTime() - this.gameState.startDate.getTime();
                const totalSeconds = Math.floor(durationMs / 1000);
                this.timeHours = Math.floor(totalSeconds / 3600);
                this.timeMinutes = Math.floor((totalSeconds % 3600) / 60);
                this.timeSeconds = totalSeconds % 60;
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

    sortTable(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.gameState.players.sort((a: Player, b: Player) => {
            const aVal = this.getValue(a, column);
            const bVal = this.getValue(b, column);

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    private getValue(p: Player, column: string): string | number {
        const valueGetters: Record<string, (player: Player) => string | number> = {
            name: (player) => player.name.toLowerCase(),
            fightCount: (player) => player.fightCount ?? 0,
            fleeCount: (player) => player.fleeCount ?? 0,
            winCount: (player) => player.winCount ?? 0,
            loseCount: (player) => player.loseCount ?? 0,
            damageReceived: (player) => player.damageReceived ?? 0,
            damageDealt: (player) => player.damageDealt ?? 0,
            itemsPicked: (player) => player.itemsPicked?.length ?? 0,
            tilesVisited: (player) => player.visitedTiles?.length ?? 0,
        };

        const getter = valueGetters[column];
        return getter ? getter(p) : 0;
    }

    private parseDate(value: Date | string): Date {
        return value instanceof Date ? value : new Date(value);
    }
}
