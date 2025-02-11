import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, Router } from '@angular/router';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

const DEFAULT_STAT_VALUE = 4;
const SIX_VALUE_DICE = 6;
const PULLING_INTERVAL = 5000;

@Component({
    selector: 'app-box-form-dialog',
    templateUrl: './box-form-dialog.component.html',
    styleUrls: ['./box-form-dialog.component.scss'],
    imports: [CommonModule, RouterModule],
})
export class BoxFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    gameList: Game[] = [];

    avatars = [
        'assets/perso/1.jpg',
        'assets/perso/2.jpg',
        'assets/perso/3.jpg',
        'assets/perso/4.jpg',
        'assets/perso/5.jpg',
        'assets/perso/6.jpg',
        'assets/perso/7.jpg',
        'assets/perso/8.jpg',
        'assets/perso/9.jpg',
        'assets/perso/10.jpg',
        'assets/perso/11.jpg',
        'assets/perso/12.jpg',
    ];

    formValid$: boolean = false;
    attributeClicked$: boolean = false;
    diceClicked$: boolean = false;

    private pollingSubscription!: Subscription;
    constructor(
        public dialogRef: MatDialogRef<BoxFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { boxId: string; game: Game; gameList: Game[] },
        private gameService: GameService,
        private snackBar: MatSnackBar,
        private router: Router,

    ) {
        this.loadGames();

        this.form = new FormGroup({
            name: new FormControl(data.game.name, [Validators.required]),
            avatar: new FormControl(this.avatars[0], [Validators.required]),
            life: new FormControl(DEFAULT_STAT_VALUE, [Validators.min(0)]),
            speed: new FormControl(DEFAULT_STAT_VALUE, [Validators.min(0)]),
            attack: new FormControl(DEFAULT_STAT_VALUE, [Validators.min(0)]),
            defense: new FormControl(DEFAULT_STAT_VALUE, [Validators.min(0)]),
        });

        this.form.statusChanges.subscribe(() => {
            this.formValid$ = this.form.valid;
        });
    }

    get gameExists(): boolean {
        return this.gameList.some((game) => game.id === this.data.game.id);
    }

    ngOnInit(): void {
        this.pollingSubscription = interval(PULLING_INTERVAL)
            .pipe(switchMap(() => this.gameService.fetchVisibleGames()))
            .subscribe({
                next: (updatedGames) => {
                    if (JSON.stringify(this.gameList) !== JSON.stringify(updatedGames)) {
                        this.gameList = updatedGames;
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

    closeDialog(): void {
        if (this.form.valid) {
            this.dialogRef.close(this.form.value);
        }
    }

    cancel(): void {
        this.dialogRef.close(null);
    }

    selectAvatar(avatar: string): void {
        this.form.get('avatar')?.setValue(avatar);
    }

    inputName(event: Event): void {
        const inputName = (event.target as HTMLInputElement).value;
        this.form.get('name')?.setValue(inputName);
    }

    increase(attribute: string): void {
        if (!this.attributeClicked$) {
            const formControl = this.form.get(attribute);
            const currentValue = formControl?.value;
            formControl?.setValue(currentValue + 2);
            this.attributeClicked$ = true;
        }
    }

    pickDice(attribute: string): void {
        const opposite = attribute === 'attack' ? 'defense' : 'attack';
        this.form.get(attribute)?.setValue(SIX_VALUE_DICE);
        this.form.get(opposite)?.setValue(DEFAULT_STAT_VALUE);
        this.diceClicked$ = true;
    }

    resetAttributes(): void {
        this.form.patchValue({
            life: DEFAULT_STAT_VALUE,
            speed: DEFAULT_STAT_VALUE,
            attack: DEFAULT_STAT_VALUE,
            defense: DEFAULT_STAT_VALUE,
        });
        this.attributeClicked$ = false;
        this.diceClicked$ = false;
    }

    async save(): Promise<void> {
        this.form.updateValueAndValidity();

        if (this.form.valid) {
            localStorage.setItem('form', JSON.stringify(this.form.value));
            const gameExists = this.gameList.some((game) => game.id === this.data.game.id);
            if (!gameExists || !this.data.game.isVisible) {
                alert('Ce jeu a été supprimé ou sa visibilité a changéee entre temps, Veuillez choisir un autre jeu.');
                return;
            }
            this.router.navigate(['/waiting']);

            this.dialogRef.close(this.form.value);
        }
    }

    private loadGames(): void {
        this.gameService.fetchVisibleGames().subscribe({
            next: (allGames) => {
                this.gameList = allGames;
            },
            error: (err) => this.snackBar.open('Erreur lors du chargement des jeux', 'Fermer', { duration: 3000 }),
        });
    }
}
