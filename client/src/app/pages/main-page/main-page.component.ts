import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { LobbyFormComponent } from '@app/components/lobby-form/lobby-form.component';
import { BehaviorSubject } from 'rxjs';
import { MAIN_PAGE_CONSTANTS } from '@app/Consts/app.constants';

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

    openLobbyForm(): void {
        const dialogRef: MatDialogRef<LobbyFormComponent> = this.dialog.open(LobbyFormComponent, {
            width: '700px',
            height: '400px',
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    this.message.next(MAIN_PAGE_CONSTANTS.successJoinMessage);
                }
            },
        });
    }
}
