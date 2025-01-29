import { DatePipe } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

const API_URL = 'http://localhost:3000/api/game';
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

    editGame() {
        this.edit.emit(this.game);
    }

    async deleteGame() {
        const response = await fetch(`${API_URL}/${this.game.id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete game: ${response.statusText}`);
        }

        this.delete.emit(this.game);
    }

    async toggleVisibility(isVisible: boolean) {
        this.game.isVisible = isVisible;
        const response = await fetch(`${API_URL}/${this.game.id}`, {
            method: 'PUT',
            headers: {
                // TODO: fix cette règle de lint
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isVisible }), // Only send the visibility update
        });

        if (!response.ok) {
            throw new Error(`Failed to update visibility: ${response.statusText}`);
        }

        const updatedGameResponse = await response.json();
        this.visibilityChange.emit(updatedGameResponse);
    }
}
