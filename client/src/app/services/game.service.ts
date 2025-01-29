import { Injectable } from '@angular/core';
import { Game } from '@app/components/game-card/game-card.component';

const API_URL = 'http://localhost:3000/api/game';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    games: Game[] = [];

    get gamesList(): Game[] {
        return this.games;
    }

    async fetchGames() {
        const response = await fetch(`${API_URL}/all`);
        this.games = await response.json();
    }

    async deleteGame(id: number) {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete game: ${response.statusText}`);
        }
    }

    async toggleVisibility(id: number, isVisible: boolean) {
        const response = await fetch(`${API_URL}/${id}`, {
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
    }
}
