import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [GameListComponent, MatCardModule, RouterLink],
})
export class AdminPageComponent implements OnInit {
    games: Game[] = [];
    gameService = inject(GameService);

    ngOnInit(): void {
        this.fetchGames();
    }

    fetchGames() {
        this.gameService.fetchGames().subscribe({
            next: (allGames) => {
                this.games = allGames;
            },
        });
    }

    onDeleteGame() {
        this.fetchGames();
    }

    onToggleVisibility() {
        this.fetchGames();
    }
}
