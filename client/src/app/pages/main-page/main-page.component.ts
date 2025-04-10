import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { LobbyFormComponent } from '@app/components/lobby-form/lobby-form.component';
import { MAIN_PAGE_CONSTANTS } from '@app/consts/app-constants';
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

    openLobbyForm(): void {
        const dialogRef: MatDialogRef<LobbyFormComponent> = this.dialog.open(LobbyFormComponent, {});

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    this.message.next(MAIN_PAGE_CONSTANTS.successJoinMessage);
                }
            },
        });
    }
}
