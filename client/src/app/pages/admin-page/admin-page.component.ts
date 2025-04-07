import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { ADMIN_PAGE_CONSTANTS, GameSize, GameType } from '@app/Consts/app-constants';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { SaveService } from '@app/services/save.service';
import { Game } from '@common/game.interface';
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
    private saveService = inject(SaveService);
    private notificationService = inject(NotificationService);
    private isFirstLoad = true;

    ngOnInit(): void {
        this.fetchGames();
    }

    fetchGames(): void {
        this.gameService
            .fetchGames()
            .pipe(
                tap((allGames) => {
                    this.games = allGames.map((game) => ({
                        ...game,
                        mode: this.translateMode(game.mode),
                        mapSize: this.translateSize(game.mapSize),
                    }));
                    this.saveService.updateGames(this.games);
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

    onDeleteGame(): void {
        this.fetchGames();
    }

    onToggleVisibility(): void {
        this.fetchGames();
    }

    private translateMode(mode: string): GameType {
        return mode as GameType;
    }

    private translateSize(size: string): GameSize {
        return size as GameSize;
    }
}
