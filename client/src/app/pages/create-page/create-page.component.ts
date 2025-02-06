import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { catchError, of, tap } from 'rxjs';

@Component({
    selector: 'app-create-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, GameCreationCardComponent, MatCardModule, RouterLink],
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent implements OnInit {
    @Input() games!: Game[];
    gameService = inject(GameService);
    notificationService = inject(NotificationService);

    constructor(private dialog: MatDialog) {}

    ngOnInit(): void {
        this.fetchGames();
    }

    fetchGames() {
        this.gameService
            .fetchVisibleGames()
            .pipe(
                tap((allGames) => {
                    this.notificationService.showSuccess('Jeux visibles chargés avec succès.');
                    this.games = allGames;
                }),
                catchError(() => {
                    this.notificationService.showError('Chargement des jeux visible impossible. Réessayez plus tard.');
                    return of([]);
                }),
            )
            .subscribe();
    }

    onBoxClick(game: Game): void {
        const dialogRef = this.dialog.open(BoxFormDialogComponent, {
            width: '400px',
            data: { boxId: game.id, game },
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Handle the result, for example: update the game list or process data
            } else {
                // Handle dialog cancellation, if needed
            }
        });
    }
}
