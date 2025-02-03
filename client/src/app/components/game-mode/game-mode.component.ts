import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';

interface GameMode {
    type: 'classic' | 'capture';
    size: 'petite' | 'moyenne' | 'grande';
}

@Component({
    selector: 'app-game-mode-dialog',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatRadioModule, FormsModule, MatDialogModule,],
    template: `
        <h2 mat-dialog-title>Création / édition d'un jeu</h2>
        <mat-dialog-content>
            <div class="mode-section">
                <h3>Choisir le mode</h3>
                <mat-radio-group [(ngModel)]="selectedMode.type">
                    <mat-radio-button value="classic">Classic</mat-radio-button>
                    <mat-radio-button value="capture">Capture the Flag</mat-radio-button>
                </mat-radio-group>
            </div>
            
            <div class="size-section">
                <h3>Choisir la taille</h3>
                <mat-radio-group [(ngModel)]="selectedMode.size">
                    <mat-radio-button value="petite">Petite</mat-radio-button>
                    <mat-radio-button value="moyenne">Moyenne</mat-radio-button>
                    <mat-radio-button value="grande">Grande</mat-radio-button>
                </mat-radio-group>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions>
            <button mat-button (click)="onCancel()">Annuler</button>
            <button mat-raised-button color="primary" (click)="onConfirm()">Confirmer</button>
        </mat-dialog-actions>
    `,
    styles: [`
        .mode-section, .size-section {
            margin: 20px 0;
        }
        mat-radio-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        mat-dialog-actions {
            justify-content: flex-end;
            gap: 8px;
        }
    `]
})
export class GameModeDialogComponent {
    selectedMode: GameMode = {
        type: 'classic',
        size: 'moyenne'
    };

    constructor(private dialogRef: MatDialogRef<GameModeDialogComponent>) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        this.dialogRef.close(this.selectedMode);
    }
}