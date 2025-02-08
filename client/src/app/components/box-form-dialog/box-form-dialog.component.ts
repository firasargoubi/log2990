import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

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
    constructor(public dialogRef: MatDialogRef<BoxFormDialogComponent>) {
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

    save(): void {
        this.form.updateValueAndValidity();
        localStorage.setItem('form', JSON.stringify(this.form.value));
    }
}
