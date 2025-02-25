import { Component, Input } from '@angular/core';
const FOUR_PLAYERS = 4;
@Component({
    selector: 'app-game-info',
    templateUrl: './game-info.component.html',
    styleUrls: ['./game-info.component.scss'],
})
export class GameInfoComponent {
    @Input() mapSize: string = 'Moyenne';
    @Input() playerCount: number = FOUR_PLAYERS;
    @Input() activePlayer: string = 'Player 1';
    @Input() players: { name: string; wins: number; hasAbandoned: boolean }[] = [];
}
