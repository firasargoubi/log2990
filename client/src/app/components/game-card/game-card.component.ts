import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ConfirmDeleteComponent } from '@app/components/confirm-delete/confirm-delete.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
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
    @Output() edit = new EventEmitter<Game>();
    @Output() delete = new EventEmitter<Game>();
    @Output() visibilityChange = new EventEmitter<Game>();

    isLoading = false;
    constructor(
        private gameService: GameService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
    ) {}

    editGame() {
        this.edit.emit(this.game);
    }

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
                            this.showSuccessNotification('Jeu supprimé avec succès');
                        }),
                        catchError(() => {
                            this.showErrorNotification('Impossible de supprimer le jeu');
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
                        this.showSuccessNotification('Visibilité du jeu mise à jour');
                    } else {
                        this.showErrorNotification('Mise à jour de la visibilité échouée');
                    }
                }),
                catchError(() => {
                    this.showErrorNotification('Impossible de modifier la visibilité');
                    return of(null);
                }),
                tap(() => (this.isLoading = false)),
            )
            .subscribe();
    }

    private showSuccessNotification(message: string) {
        this.snackBar.open(message, 'Fermer', {
            duration: 3000,
            panelClass: ['success-notification'],
        });
    }

    private showErrorNotification(message: string) {
        this.snackBar.open(message, 'Fermer', {
            duration: 3000,
            panelClass: ['error-notification'],
        });
    }
}
