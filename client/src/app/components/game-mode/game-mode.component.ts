import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

interface GameMode {
    type: 'classic' | 'capture';
    size: 'petite' | 'moyenne' | 'grande';
}

@Component({
    selector: 'app-game-mode-dialog',
    imports: [CommonModule, MatButtonModule, MatRadioModule, FormsModule, MatDialogModule],
    templateUrl: './game-mode.component.html',
    styleUrls: ['./game-mode.component.scss'],
})
export class GameModeDialogComponent {
    selectedMode: GameMode = {
        type: 'classic',
        size: 'moyenne',
    };

    constructor(private dialogRef: MatDialogRef<GameModeDialogComponent>) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        this.dialogRef.close(this.selectedMode);
    }
}
