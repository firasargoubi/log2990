import { CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
import { Game } from '@common/game.interface';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { CREATE_PAGE_CONSTANTS, GAME_IMAGES } from '@app/Consts/app.constants';

const DEFAULT_STAT_VALUE = 4;
const SIX_VALUE_DICE = 6;

@Component({
    selector: 'app-box-form-dialog',
    templateUrl: './box-form-dialog.component.html',
    styleUrls: ['./box-form-dialog.component.scss'],
    imports: [CommonModule, RouterModule],
})
export class BoxFormDialogComponent {
    form: FormGroup;
    gameList: Game[] = [];
    avatars = [
        GAME_IMAGES.fawn,
        GAME_IMAGES.bear,
        GAME_IMAGES.castor,
        GAME_IMAGES.squirrel1,
        GAME_IMAGES.owl,
        GAME_IMAGES.rabbit,
        GAME_IMAGES.squirrel2,
        GAME_IMAGES.pigeon,
        GAME_IMAGES.rat,
        GAME_IMAGES.fox,
        GAME_IMAGES.dear,
        GAME_IMAGES.raccoon,
    ];

    formValid$: boolean = false;
    attributeClicked$: boolean = false;
    diceClicked$: boolean = false;

    private notificationService = inject(NotificationService);
    private router = inject(Router);

    constructor(
        public dialogRef: MatDialogRef<BoxFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { boxId: string; game: Game; gameList: Game[] },
        private gameService: GameService,
    ) {
        this.loadGames();

        this.form = new FormGroup({
            name: new FormControl('New Player', [Validators.required]),
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

    linkRoute(): void {
        if (!(this.form.get('name')?.value === 'New Player')) {
            this.router.navigate([PageUrl.Waiting]);
        }
    }

    save(): void {
        this.form.updateValueAndValidity();
        const gameExists = this.gameList.some((game) => game.id === this.data.game.id);
        if (!gameExists || !this.data.game.isVisible) {
            this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorGameDeleted);
            return;
        }
        if (this.form.valid) {
            localStorage.setItem('form', JSON.stringify(this.form.value));
            this.linkRoute();
        }
    }

    private loadGames(): void {
        this.gameService.fetchVisibleGames().subscribe({
            next: (allGames) => {
                this.gameList = allGames;
            },
            error: () => this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorLoadingGames),
        });
    }
}
