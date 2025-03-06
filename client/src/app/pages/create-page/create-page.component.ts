import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { CREATE_PAGE_CONSTANTS, GameSize, GameType } from '@app/Consts/app.constants';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-create-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, GameCreationCardComponent, MatCardModule, RouterLink],
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent implements OnInit {
    @Input() games$: Observable<Game[]> = new Observable<Game[]>();
    games: Game[] = [];

    // Services injection
    private notificationService = inject(NotificationService);
    private dialog = inject(MatDialog);
    private gameService = inject(GameService);

    ngOnInit(): void {
        this.loadGames();
    }

    private translateMode(mode: string): GameType {
        return mode as GameType;
    }

    private translateSize(size: string): GameSize {
        return size as GameSize;
    }

    onBoxClick(game: Game): void {
        this.gameService.verifyGameAccessible(game.id).subscribe({
            next: (isAccessible) => {
                if (isAccessible) {
                    this.openBoxFormDialog(game);
                } else {
                    this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorGameDeleted);
                    this.loadGames();
                }
            },
            error: () => {
                this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorGameDeleted);
                this.loadGames();
            },
        });
    }

    private openBoxFormDialog(game: Game): void {
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
                    mode: this.translateMode(game.mode),
                    mapSize: this.translateSize(game.mapSize),
                }));
            },
            error: () => this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorLoadingGames),
        });
    }
}
