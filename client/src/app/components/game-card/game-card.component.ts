import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ConfirmDeleteComponent } from '@app/components/confirm-delete/confirm-delete.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
    selector: 'app-game-card',
    templateUrl: './game-card.component.html',
    styleUrls: ['./game-card.component.scss'],
    imports: [MatCardModule, MatTooltipModule, DatePipe, MatButtonModule, MatSlideToggleModule, RouterLink],
})
export class GameCardComponent {
    @Input() game!: Game;
    @Output() delete = new EventEmitter<Game>();
    @Output() visibilityChange = new EventEmitter<Game>();

    isLoading = false;
    constructor(
        private gameService: GameService,
        private dialog: MatDialog,
        private notificationService: NotificationService,
    ) {}

    async deleteGame() {
        if (!this.game || this.isLoading) return;
        const dialogRef = this.dialog.open(ConfirmDeleteComponent);
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.isLoading = true;
                this.gameService
                    .deleteGame(this.game.id)
                    .pipe(
                        tap(() => {
                            this.delete.emit(this.game);
                            this.notificationService.showSuccess('Jeu supprimé avec succès');
                        }),
                        catchError(() => {
                            this.notificationService.showError('Impossible de supprimer le jeu');
                            return of(null);
                        }),
                        tap(() => {
                            this.isLoading = false;
                        }),
                    )
                    .subscribe();
            }
        });
    }

    toggleVisibility(isVisible: boolean) {
        if (this.isLoading) return;
        this.isLoading = true;

        this.gameService
            .updateVisibility(this.game.id, isVisible)
            .pipe(
                tap((updatedGame: Game | null) => {
                    if (updatedGame) {
                        this.game = updatedGame;
                        this.visibilityChange.emit(updatedGame);
                        this.notificationService.showSuccess('Visibilité du jeu mise à jour');
                    } else {
                        this.notificationService.showError('Mise à jour de la visibilité échouée');
                    }
                }),
                catchError(() => {
                    this.notificationService.showError('Impossible de modifier la visibilité');
                    return of(null);
                }),
                tap(() => (this.isLoading = false)),
            )
            .subscribe();
    }
}
