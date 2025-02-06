import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { catchError, of, tap } from 'rxjs';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [GameListComponent, MatCardModule, RouterLink],
})
export class AdminPageComponent implements OnInit {
    games: Game[] = [];
    gameService = inject(GameService);
    notificationService = inject(NotificationService);
    ngOnInit(): void {
        this.fetchGames();
    }

    fetchGames() {
        this.gameService
            .fetchGames()
            .pipe(
                tap((allGames) => {
                    this.games = allGames;
                    this.notificationService.showSuccess('Jeux chargés avec succès');
                }),
                catchError(() => {
                    this.notificationService.showError('Chargement des jeux impossible, réessayez plus tard.');
                    return of([]);
                }),
            )
            .subscribe();
    }

    onDeleteGame() {
        this.fetchGames();
    }

    onToggleVisibility() {
        this.fetchGames();
    }
}
