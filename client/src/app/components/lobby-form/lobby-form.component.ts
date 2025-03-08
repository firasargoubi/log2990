// lobby-form.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { LobbyService } from '@app/services/lobby.service';

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

    constructor(
        private dialogRef: MatDialogRef<LobbyFormComponent>,
        private lobbyService: LobbyService,
    ) {}

    validateGameId(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.lobbyService.verifyRoom(this.gameid).subscribe((exists: boolean) => {
            this.gameExists = exists;
            if (this.gameExists) {
                this.isLoading = false;
                this.dialogRef.close(this.gameid);
            } else {
                this.errorMessage = "Cette partie n'existe pas. Veuillez vérifier l'identifiant.";
                this.isLoading = false;
            }
        });
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    resetError(): void {
        this.errorMessage = '';
    }
}
