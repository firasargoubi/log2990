// lobby-form.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LobbyService } from '@app/services/lobby.service';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';

@Component({
    selector: 'app-lobby-form',
    templateUrl: './lobby-form.component.html',
    styleUrls: ['./lobby-form.component.scss'],
    imports: [CommonModule, FormsModule],
})
export class LobbyFormComponent {
    lobbyId: string = '';
    errorMessage: string = '';
    isLoading: boolean = false;
    gameExists: boolean = false;

    constructor(
        private dialogRef: MatDialogRef<LobbyFormComponent>,
        private lobbyService: LobbyService,
        private dialog: MatDialog,
    ) {}

    validateGameId(): void {
        this.isLoading = true;
        this.errorMessage = '';

        this.lobbyService.verifyRoom(this.lobbyId).subscribe((response: { exists: boolean; isLocked?: boolean }) => {
            if (response.exists) {
                this.isLoading = false;
                this.dialogRef.close(this.lobbyId);
                this.openBoxFormDialog();
            } else {
                this.isLoading = false;
                if (response.isLocked) {
                    this.errorMessage = 'Cette partie est verrouillée. Vous ne pouvez pas la rejoindre.';
                } else {
                    this.errorMessage = "Cette partie n'existe pas. Veuillez vérifier l'identifiant.";
                }
            }
        });
    }

    openBoxFormDialog(): void {
        this.lobbyService.getLobby(this.lobbyId).subscribe({
            next: (response) => {
                const dialogRef = this.dialog.open(BoxFormDialogComponent, {
                    width: '400px',
                    data: {
                        lobbyId: this.lobbyId,
                        boxId: response.gameId,
                    },
                });

                dialogRef.afterClosed().subscribe((result) => {
                    if (result) {
                        this.dialogRef.close(this.lobbyId);
                    }
                });
            },
        });
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    resetError(): void {
        this.errorMessage = '';
    }
}
