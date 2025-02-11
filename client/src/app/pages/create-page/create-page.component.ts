import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
    private pollingSubscription!: Subscription;

    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private gameService: GameService,
    ) {}

    ngOnInit(): void {
        this.loadGames();

        this.pollingSubscription = interval(PULLING_INTERVAL)
            .pipe(switchMap(() => this.gameService.fetchVisibleGames()))
            .subscribe({
                next: (updatedGames) => {
                    if (JSON.stringify(this.games) !== JSON.stringify(updatedGames)) {
                        this.games = updatedGames;
                    }
                },
                error: (err) => this.snackBar.open('Erreur lors du rafraîchissement des jeux', 'Fermer', { duration: 3000 }),
            });
    }

    ngOnDestroy(): void {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }
<<<<<<< HEAD
    onBoxClick(game: Game): void {
        const dialogRef = this.dialog.open(BoxFormDialogComponent, {
            data: { boxId: game.id, game, gameList: this.games },
        });
=======
>>>>>>> 0155a9105ad9098fadf4a96b0576dc144534ce8d

    onBoxClick(game: Game): void {

    const dialogRef = this.dialog.open(BoxFormDialogComponent, {
        data: { boxId: game.id, game, gameList: this.games },
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
                this.games = allGames;
            },
            error: (err) => this.snackBar.open('Erreur lors du chargement des jeux', 'Fermer', { duration: 3000 }),
        });
    }
}