import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { GameMode, GameSize, GameType } from '@app/Consts/app.constants';

@Component({
    selector: 'app-game-mode-dialog',
    imports: [CommonModule, MatButtonModule, MatRadioModule, FormsModule, MatDialogModule],
    templateUrl: './game-mode.component.html',
    styleUrls: ['./game-mode.component.scss'],
})
export class GameModeDialogComponent {
    gameType = GameType;
    gameSize = GameSize;
    selectedMode: GameMode = {
        type: GameType.Classic,
        size: GameSize.Medium,
    };

    constructor(private dialogRef: MatDialogRef<GameModeDialogComponent>) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        this.dialogRef.close(this.selectedMode);
    }
}
