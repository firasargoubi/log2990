import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { ObjectsTypes } from '@common/game.interface';

@Component({
    selector: 'app-game-info',
    templateUrl: './game-info.component.html',
    styleUrls: ['./game-info.component.scss'],
    imports: [CommonModule],
})
export class GameInfoComponent {
    @Input() gameName: string = '';
    @Input() gameDescription: string = '';
    @Input() gameMode: string = '';
    @Input() mapSize: string = '';
    @Input() playerCount: number = 0;
    @Input() activePlayer: string = '';
    @Input() players: Player[] = [];
    @Input() deletedPlayers: Player[] = [];
    @Input() isCTF: boolean = false;
    @Input() gameState: GameState | undefined;
    objectTypes = ObjectsTypes;

    getPlayersDeleted(): Player[] {
        return this.deletedPlayers;
    }

    getTeam(player: Player): string {
        if (!this.gameState?.teams) return '';
        return this.gameState.teams.team1.some((p) => p.id === player.id) ? 'Red' : 'Blue';
    }
}
