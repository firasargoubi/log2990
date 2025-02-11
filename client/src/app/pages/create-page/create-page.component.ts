import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CREATE_PAGE_CONSTANTS, GAME_MODES, GAME_SIZE } from '@app/Consts/app.constants';

const PULLING_INTERVAL = 5000;

@Component({
    selector: 'app-create-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, GameCreationCardComponent, MatCardModule, RouterLink],
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent implements OnInit, OnDestroy {
    @Input() games$: Observable<Game[]> = new Observable<Game[]>();
    games: Game[] = [];
    notificationService = inject(NotificationService);
    private pollingSubscription!: Subscription;
    private modeTranslation: Record<string, string> = GAME_MODES;
    private sizeTranslation: Record<string, string> = GAME_SIZE;

    constructor(
        private dialog: MatDialog,
        private gameService: GameService,
    ) {}

    ngOnInit(): void {
        this.loadGames();

        this.pollingSubscription = interval(PULLING_INTERVAL)
            .pipe(switchMap(() => this.gameService.fetchVisibleGames()))
            .subscribe({
                next: (updatedGames) => {
                    this.games = updatedGames.map((game) => ({
                        ...game,
                        mode: this.translateMode(game.mode), // ✅ Ensure translations persist
                        mapSize: this.translateSize(game.mapSize), // ✅ Ensure translations persist
                    }));
                },
                error: () => this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorRefreshGames),
            });
    }

    translateMode(mode: string): string {
        return this.modeTranslation[mode] || mode;
    }

    translateSize(size: string): string {
        return this.sizeTranslation[size] || size;
    }

    ngOnDestroy(): void {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }

    onBoxClick(game: Game): void {
        const translatedGame = {
            ...game,
            mode: this.translateMode(game.mode),
            mapSize: this.translateSize(game.mapSize),
        };

        const dialogRef = this.dialog.open(BoxFormDialogComponent, {
            data: { boxId: game.id, game: translatedGame, gameList: this.games },
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    this.loadGames();
                }
            },
        });
    }

    private loadGames(): void {
        this.gameService.fetchVisibleGames().subscribe({
            next: (allGames) => {
                this.games = allGames.map((game) => ({
                    ...game,
                    mode: this.translateMode(game.mode), // ✅ Always translate mode
                    mapSize: this.translateSize(game.mapSize), // ✅ Always translate size
                }));
            },
            error: () => this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorLoadingGames),
        });
    }
}
