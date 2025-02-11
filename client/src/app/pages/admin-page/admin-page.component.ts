import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { ADMIN_PAGE_CONSTANTS, GAME_MODES, GAME_SIZE } from '@app/Consts/app.constants';
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
    private gameService = inject(GameService);
    private notificationService = inject(NotificationService);
    private isFirstLoad = true;
    private modeTranslation: Record<string, string> = GAME_MODES;
    private sizeTranslation: Record<string, string> = GAME_SIZE;

    ngOnInit(): void {
        this.fetchGames();
    }

    translateMode(mode: string): string {
        return this.modeTranslation[mode] || mode;
    }

    translateSize(size: string): string {
        return this.sizeTranslation[size] || size;
    }

    fetchGames() {
        this.gameService
            .fetchGames()
            .pipe(
                tap((allGames) => {
                    this.games = allGames.map((game) => ({
                        ...game,
                        mode: this.translateMode(game.mode),
                        mapSize: this.translateSize(game.mapSize),
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
