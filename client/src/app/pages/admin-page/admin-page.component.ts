import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { catchError, of, tap } from 'rxjs';
import { ADMIN_PAGE_CONSTANTS, GAME_MODES, GAME_SIZE } from '@app/Consts/app.constants';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [GameListComponent, MatCardModule, RouterLink],
})
export class AdminPageComponent implements OnInit {
    games: Game[] = [];
    private gameService = inject(GameService);
    private notificationService = inject(NotificationService);
    private isFirstLoad = true;

    // Mode Translation Dictionary
    private MODE_TRANSLATION: Record<string, string> = GAME_MODES;

    // Map Size Translation Dictionary
    private SIZE_TRANSLATION: Record<string, string> = GAME_SIZE;

    ngOnInit(): void {
        this.fetchGames();
    }

    translateMode(mode: string): string {
        return this.MODE_TRANSLATION[mode] || mode;
    }

    translateSize(size: string): string {
        return this.SIZE_TRANSLATION[size] || size;
    }

    fetchGames() {
        this.gameService
            .fetchGames()
            .pipe(
                tap((allGames) => {
                    this.games = allGames.map((game) => ({
                        ...game,
                        mode: this.translateMode(game.mode), // Translate mode
                        mapSize: this.translateSize(game.mapSize), // Translate map size
                    }));

                    if (this.isFirstLoad) {
                        this.notificationService.showSuccess(ADMIN_PAGE_CONSTANTS.successFetchMessage);
                        this.isFirstLoad = false;
                    }
                }),
                catchError(() => {
                    this.notificationService.showError(ADMIN_PAGE_CONSTANTS.errorFetchMessage);
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
