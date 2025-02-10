import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirm-delete',
    imports: [MatButtonModule, MatDialogModule],
    templateUrl: './confirm-delete.component.html',
    styleUrl: './confirm-delete.component.scss',
})
export class ConfirmDeleteComponent {
    constructor(private dialogRef: MatDialogRef<ConfirmDeleteComponent>) {}
    onConfirm(): void {
        this.dialogRef.close(true);
    }
    onCancel(): void {
        this.dialogRef.close(false);
    }
}
