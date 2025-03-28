import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface Player {
    id: string;
    name: string;
    avatar: string;
    isHost: boolean;
    life: number;
    speed: number;
    attack: number;
    defense: number;
    bonus?: {
        life?: number;
        speed?: number;
        attack?: 'D4' | 'D6';
        defense?: 'D4' | 'D6';
    };
}

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
    getPlayersDeleted(): Player[] {
        return this.deletedPlayers;
    }
}
