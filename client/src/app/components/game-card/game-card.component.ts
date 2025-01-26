import { DatePipe } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface Game {
    id: number;
    name: string;
    mapSize: string;
    mode: string;
    previewImage: string;
    description: string;
    lastModified: Date;
    isVisible: boolean;
}

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
    imports: [MatCardModule, MatTooltipModule, DatePipe, MatButtonModule, MatSlideToggleModule],
})
export class GameCardComponent {
    @Input() game!: Game;
    @Output() edit = new EventEmitter<Game>();
    @Output() delete = new EventEmitter<Game>();
    @Output() visibilityChange = new EventEmitter<{ game: Game; isVisible: boolean }>();

    editGame() {
        this.edit.emit(this.game);
    }

    deleteGame() {
        this.delete.emit(this.game);
    }

    toggleVisibility(isVisible: boolean) {
        this.visibilityChange.emit({ game: this.game, isVisible });
    }
}
