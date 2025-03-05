import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { LobbyFormComponent } from '@app/components/lobby-form/lobby-form.component';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    imports: [RouterLink, MatDialogModule, CommonModule],
})
export class MainPageComponent {
    readonly title: string = 'Tile Bound';
    dialog = inject(MatDialog);
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');

    onJoinClick(): void {
        this.openLobbyForm();
    }

    openLobbyForm(): void {
        const dialogRef: MatDialogRef<LobbyFormComponent> = this.dialog.open(LobbyFormComponent, {
            width: '400px',
            height: '400px',
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    console.log('ID saisi:', result);
                }
            },
        });
    }
}
