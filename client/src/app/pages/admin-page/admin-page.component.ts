import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Game } from '@app/components/game-card/game-card.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [GameListComponent, MatCardModule],
})
export class AdminPageComponent {
    games: Game[] = [];
    constructor(private gameService: GameService) {
        this.gameService.fetchGames();
        this.games = this.gameService.gamesList;
    }
    onEditGame(game: Game) {
        return game;
        // TODO: Implémenter  l'édition d’un jeu avec serveur, bdd et vue d'édition
    }

    onDeleteGame() {
        this.gameService.fetchGames();
        this.games = this.gameService.gamesList;
    }

    onToggleVisibility() {
        this.gameService.fetchGames();
        this.games = this.gameService.gamesList;
    }
}
