// lobby-form.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-lobby-form',
    templateUrl: './lobby-form.component.html',
    styleUrls: ['./lobby-form.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class LobbyFormComponent {
    gameid: string = '';
    errorMessage: string = '';
    isLoading: boolean = false;
    gameExists: boolean = false;

    constructor(private dialogRef: MatDialogRef<LobbyFormComponent>) {}

    validateGameId(): void {
        this.isLoading = true;
        this.errorMessage = '';

        if (this.gameid === '123456') {
            this.gameExists = true;
        }
        setTimeout(() => {
            if (this.gameExists) {
                // La partie existe, on peut fermer le dialog et rediriger
                this.isLoading = false;
                this.dialogRef.close(this.gameid);
            } else {
                // La partie n'existe pas, on affiche un message d'erreur
                this.errorMessage = "Cette partie n'existe pas. Veuillez vérifier l'identifiant.";
                this.isLoading = false;
            }
        }, 2000);
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    // Pour effacer le message d'erreur quand l'utilisateur commence à taper
    resetError(): void {
        this.errorMessage = '';
    }
}
