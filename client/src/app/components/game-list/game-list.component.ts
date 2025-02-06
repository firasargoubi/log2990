import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { GameCardComponent } from '@app/components/game-card/game-card.component';
import { GameModeDialogComponent } from '@app/components/game-mode/game-mode.component';
import { Game } from '@app/interfaces/game.model';

@Component({
    selector: 'app-game-list',
    templateUrl: './game-list.component.html',
    styleUrls: ['./game-list.component.scss'],
    imports: [GameCardComponent, MatCardModule, MatTooltipModule, MatDialogModule],
})
export class GameListComponent {
    @Input() games: Game[] = [];
    @Output() deleteGame = new EventEmitter<Game>();
    @Output() visibilityChange = new EventEmitter<Game>();
    constructor(
        private dialog: MatDialog,
        private router: Router,
    ) {}
    // TODO: Ajouter et gérer événement de création de jeu avec nouveau component.

    onVisibilityChange(event: Game) {
        this.visibilityChange.emit(event);
    }
    openCreateDialog() {
        const dialogRef = this.dialog.open(GameModeDialogComponent, {
            width: '400px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Naviguer vers la page d'édition avec les paramètres
                this.router.navigate(['/edit'], {
                    queryParams: { mode: result.type, size: result.size },
                });
            }
        });
    }
}
