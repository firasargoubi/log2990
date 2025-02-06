import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-create-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, GameCreationCardComponent, MatCardModule, RouterLink],
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent implements OnInit {
    @Input() games$: Observable<Game[]> = new Observable<Game[]>(); // Observable pour les jeux
    
    games: Game[] = []; // Stocke les jeux en tant que tableau
    constructor(
        private dialog: MatDialog,
        private gameService: GameService,
    ) {}

    ngOnInit(): void {
        this.loadGames();
    }

    
    private loadGames(): void {
        this.gameService.fetchVisibleGames().subscribe({
            next: (allGames) => {
                this.games = allGames; // Stocke les jeux sous forme de tableau
            },
            error: (err) => console.error('Erreur lors du chargement des jeux', err),
        });
    }
    
    

    onBoxClick(game: Game): void {
        const dialogRef = this.dialog.open(BoxFormDialogComponent, {
            width: '400px',
            data: { boxId: game.id, game },
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadGames();
            }
        });
    }
}
