import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Game } from '@app/components/game-card/game-card.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';

const API_URL = 'http://localhost:3000/api/game';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [GameListComponent, MatCardModule],
})
export class AdminPageComponent implements OnInit {
    games: Game[] = [];

    ngOnInit(): void {
        this.fetchGames();
    }

    async fetchGames() {
        try {
            const response = await fetch(`${API_URL}/all`);
            this.games = await response.json();
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    }
    onCreateGame() {
        // window.location.href = '/create-game';
    }

    onEditGame(game: Game) {
        return game;
        // TODO: Implémenter  l'édition d’un jeu avec serveur et bdd
    }

    onDeleteGame(game: Game) {
        this.games = this.games.filter((g) => g.id !== game.id);
        // TODO: Implémenter  la supression d’un jeu avec serveur et bdd
    }

    onToggleVisibility(event: { game: Game; isVisible: boolean }) {
        const game = this.games.find((g) => g.id === event.game.id);
        if (game) {
            game.isVisible = event.isVisible;
        } // TODO: Implémenter la gestion de la visibilité d’un jeu avec serveur et bdd
    }
}
