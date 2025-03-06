import { CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { CREATE_PAGE_CONSTANTS, GAME_IMAGES } from '@app/Consts/app.constants';
import { LobbyService } from '@app/services/lobby.service';
import { Player } from '@common/player';
import { CurrentPlayerService } from '@app/services/current-player.service';

const DEFAULT_STAT_VALUE = 4;

@Component({
    selector: 'app-box-form-dialog',
    templateUrl: './box-form-dialog.component.html',
    styleUrls: ['./box-form-dialog.component.scss'],
    imports: [CommonModule, RouterModule],
})
export class BoxFormDialogComponent {
    form: FormGroup;
    gameList: Game[] = [];
    notificationService = inject(NotificationService);
    lobbyService = inject(LobbyService);
    currentPlayerService = inject(CurrentPlayerService);
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
    increasedAttribute: string | null = null;
    diceAttribute: string | null = null;

    constructor(
        public dialogRef: MatDialogRef<BoxFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { boxId: string; game: Game; gameList: Game[]; lobbyId: string },
        private gameService: GameService,
        private router: Router,
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

    get isFormComplete(): boolean {
        return this.form.valid && !!this.increasedAttribute && !!this.diceAttribute;
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
            this.attributeClicked$ = true;
            this.increasedAttribute = attribute;
        }
    }

    pickDice(attribute: string): void {
        this.diceClicked$ = true;
        this.diceAttribute = attribute;
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

    onSubmit(event: Event): void {
        event.preventDefault();
        if (this.isFormComplete) {
            this.save();
        } else {
            this.notificationService.showError(
                'Veuillez attribuer le bonus de +2 pour la vie ou la vitesse et le bonus de dé (6 faces) pour l’attaque ou la défense.',
            );
        }
    }

    save(): void {
        this.form.updateValueAndValidity();
        if (!this.increasedAttribute || !this.diceAttribute) {
            this.notificationService.showError('Veuillez remplir toutes les conditions de bonus.');
            return;
        }
        const gameExists = this.gameList.some((game) => game.id === this.data.game.id);
        if (!gameExists || !this.data.game.isVisible) {
            this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorGameDeleted);
            return;
        }
        if (this.form.valid) {
            const formData = this.form.value;
            const bonus: { life?: number; speed?: number; attack?: number; defense?: number } = {};
            if (this.increasedAttribute === 'life') {
                bonus.life = 2;
            } else if (this.increasedAttribute === 'speed') {
                bonus.speed = 2;
            }
            if (!this.diceAttribute) {
                if (this.increasedAttribute === 'attack') {
                    bonus.attack = 2;
                } else if (this.increasedAttribute === 'defense') {
                    bonus.defense = 2;
                }
            }
            if (this.diceAttribute === 'attack') {
                bonus.attack = 6;
                bonus.defense = 4;
            } else if (this.diceAttribute === 'defense') {
                bonus.defense = 6;
                bonus.attack = 4;
            }
            const playerData: Player = {
                id: this.generatePlayerId(),
                name: formData.name,
                avatar: formData.avatar,
                isHost: false,
                life: formData.life,
                speed: formData.speed,
                attack: formData.attack,
                defense: formData.defense,
                bonus,
            };
            this.lobbyService.addPlayerToLobby(this.data.lobbyId, playerData);
            this.currentPlayerService.setCurrentPlayer(playerData, this.data.game.id);
            this.dialogRef.close();
            this.router.navigate([`/waiting/${this.data.lobbyId}`], { replaceUrl: true });
        }
    }

    private generatePlayerId(): string {
        return crypto.randomUUID();
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
