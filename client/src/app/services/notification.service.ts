import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { APP_CONSTANTS } from '@app/consts/app-constants';

@Injectable({
    providedIn: 'root',
})
export class NotificationService {
    constructor(private snackBar: MatSnackBar) {}

    showSuccess(message: string): void {
        this.showNotification(message, 'success-notification');
    }

    showError(message: string): void {
        this.showNotification(message, 'error-notification');
    }

    showInfo(message: string): void {
        this.showNotification(message, 'info-notification');
    }

    private showNotification(message: string, panelClass: string): void {
        this.snackBar.open(message, APP_CONSTANTS.actionLabel, {
            duration: APP_CONSTANTS.notificationDelay,
            panelClass: [panelClass],
        });
    }
}
