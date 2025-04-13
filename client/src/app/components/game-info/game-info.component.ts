import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GameState } from '@common/game-state';
import { ObjectsTypes } from '@common/game.interface';
import { Player } from '@common/player';

@Component({
    selector: 'app-game-info',
    templateUrl: './game-info.component.html',
    styleUrls: ['./game-info.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class GameInfoComponent {
    @Input() gameName: string = '';
    @Input() gameMode: string = '';
    @Input() mapSize: string = '';
    @Input() playerCount: number = 0;
    @Input() activePlayer: string = '';
    @Input() players: Player[] = [];
    @Input() deletedPlayers: Player[] = [];
    @Input() isCTF: boolean = false;
    @Input() gameState: GameState | undefined;

    objectTypes = ObjectsTypes;
    getPlayersDeleted(playerId: string): boolean {
        return this.deletedPlayers?.some((p) => p.id === playerId) || false;
    }

    getTeam(player: Player): string {
        if (!this.gameState?.teams) return '';
        return this.gameState.teams.team1.some((p) => p.id === player.id) ? 'Red' : 'Blue';
    }
}
