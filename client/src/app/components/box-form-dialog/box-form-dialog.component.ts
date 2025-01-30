import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

const DEFAULT_STAT_VALUE = 4;
const FOUR_VALUE_DICE = 4;
const SIX_VALUE_DICE = 6;

@Component({
    selector: 'app-box-form-dialog',
    templateUrl: './box-form-dialog.component.html',
    styleUrls: ['./box-form-dialog.component.scss'],
    imports: [CommonModule, RouterModule],
})
export class BoxFormDialogComponent {
    form: FormGroup;
    avatars = [
        'assets/perso/1.png',
        'assets/perso/2.png',
        'assets/perso/3.png',
        'assets/perso/4.png',
        'assets/perso/5.png',
        'assets/perso/6.png',
        'assets/perso/7.png',
        'assets/perso/8.png',
        'assets/perso/9.png',
        'assets/perso/10.png',
        'assets/perso/11.png',
        'assets/perso/12.png',
    ];

    formValid$: boolean = false;
    attributeClicked$: boolean = false;
    diceClicked$: boolean = false;
    life: number = DEFAULT_STAT_VALUE;
    speed: number = DEFAULT_STAT_VALUE;
    attack: number;
    defense: number;
    constructor(
        public dialogRef: MatDialogRef<BoxFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { boxId: number },
    ) {
        this.form = new FormGroup({
            name: new FormControl('Player', [Validators.required]),
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

    inputName(event: Event) {
        const inputName = (event.target as HTMLInputElement).value;
        this.form.get('name')?.setValue(inputName);
    }

    increase(attribute: string) {
        if (!this.attributeClicked$) {
            this.form.get(attribute)?.setValue(this.form.get(attribute)?.value + 2);
            if (attribute === 'life') {
                this.life += 2;
            } else if (attribute === 'speed') {
                this.speed += 2;
            }
            this.attributeClicked$ = true;
        }
    }

    pickDice(attribute: string) {
        if (attribute === 'attack') {
            this.form.get('attack')?.setValue(SIX_VALUE_DICE);
            this.attack = 6;
            this.defense = 4;
        } else {
            this.form.get('defense')?.setValue(FOUR_VALUE_DICE);
            this.defense = 6;
            this.attack = 4;
        }
        this.diceClicked$ = true;
    }

    save(): void {
        this.form.updateValueAndValidity();
        localStorage.setItem('form', JSON.stringify(this.form.value));
    }
}
