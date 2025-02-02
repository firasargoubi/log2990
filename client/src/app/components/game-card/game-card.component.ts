import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete.component';

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

    constructor(private gameService: GameService, private dialog: MatDialog) {}

    editGame() {
        this.edit.emit(this.game);
    }

    async deleteGame() {
        const dialiogRef = this.dialog.open(ConfirmDeleteComponent);
        dialiogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.gameService.deleteGame(this.game.id).subscribe({
                    next: () => this.delete.emit(this.game),
                });
            }
        });
          
    }

    toggleVisibility(isVisible: boolean) {
        this.gameService.updateVisibility(this.game.id, isVisible).subscribe({
            next: (updatedGame) => this.visibilityChange.emit(updatedGame),
        });
    }
}
