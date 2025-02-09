import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
        private gameService: GameService,
    ) {}

    ngOnInit(): void {
        this.loadGames();

        this.pollingSubscription = interval(5000)
            .pipe(switchMap(() => this.gameService.fetchVisibleGames()))
            .subscribe({
                next: (updatedGames) => {
                    if (JSON.stringify(this.games) !== JSON.stringify(updatedGames)) {
                        this.games = updatedGames; // Update only if there is a change
                    }
                },
                error: (err) => console.error('Erreur lors du rafraîchissement des jeux', err),
            });
    }

    ngOnDestroy(): void {
        // 🛑 Stop polling when the component is destroyed
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }
    }

    private loadGames(): void {
        this.gameService.fetchVisibleGames().subscribe({
            next: (allGames) => {
                this.games = allGames;
            },
            error: (err) => console.error('Erreur lors du chargement des jeux', err),
        });
    }


    onBoxClick(game: Game): void {
        console.log('Opening dialog for:', game);

        const dialogRef = this.dialog.open(BoxFormDialogComponent, {
            width: '400px',
            data: { boxId: game.id, game },
        });

        // ✅ Listen for dialog close and refresh games
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                console.log('Dialog closed with:', result);
                this.loadGames();
            }
        });

       
    }
}
