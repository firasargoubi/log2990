import { DatePipe } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameService } from '@app/services/game.service';

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
    @Output() visibilityChange = new EventEmitter<Game>();

    gameService = inject(GameService);
    editGame() {
        this.edit.emit(this.game);
    }

    deleteGame() {
        try {
            this.gameService.deleteGame(this.game.id);
            this.delete.emit(this.game);
        } catch (error) {}
    }

    async toggleVisibility(isVisible: boolean) {
        try {
            this.game.isVisible = isVisible;
            this.gameService.toggleVisibility(this.game.id, isVisible);
            this.visibilityChange.emit(this.game);
        } catch (error) {}
    }
}
