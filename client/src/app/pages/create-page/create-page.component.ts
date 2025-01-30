import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { GameCreation, GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';

const API_URL = 'http://localhost:3000/api/game';

@Component({
    selector: 'app-create-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, GameCreationCardComponent, MatCardModule],
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent implements OnInit {
    @Input() games!: GameCreation[];

    constructor(private dialog: MatDialog) {}

    ngOnInit(): void {
        this.fetchGames();
    }

    async fetchGames() {
        const response = await fetch(`${API_URL}/all`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const allGames: GameCreation[] = await response.json();
        this.games = allGames.filter((game) => game.isVisible);
    }

    onBoxClick(game: GameCreation): void {
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
