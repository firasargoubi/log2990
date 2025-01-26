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
        const response = await fetch(`${API_URL}/all`);
        this.games = await response.json();
    }

    onEditGame(game: Game) {
        return game;
        // TODO: Implémenter  l'édition d’un jeu avec serveur, bdd et vue d'édition
    }

    onDeleteGame() {
        this.fetchGames();
    }

    onToggleVisibility() {
        this.fetchGames();
    }
}
