import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

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
export class GameInfoComponent implements OnInit {
    @Input() gameName: string = '';
    @Input() gameDescription: string = '';
    @Input() gameMode: string = '';
    @Input() mapSize: string = '';
    @Input() playerCount: number = 0;
    @Input() activePlayer: string = '';
    @Input() players: Player[] = [];

    ngOnInit(): void {
        if (this.players && this.players.length > 0) {
            console.log('Players:', this.players);
        } else {
            console.warn('No players data available');
        }
    }
}
