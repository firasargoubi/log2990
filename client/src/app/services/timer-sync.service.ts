import { Injectable } from '@angular/core';
import { Subject } from 'rxjs'; // You can still use Subject for internal state changes

@Injectable({
    providedIn: 'root',
})
export class TimerSyncService {
    private playerTimerPaused: Subject<number | null> = new Subject<number | null>(); // Use Subject but no Observable
    private pausedTime: number | null = null; // To store the time when paused

    // Pauses the player timer and sets the remaining time
    pausePlayerTimer(remainingTime: number): void {
        this.pausedTime = remainingTime; // Save the paused time
        this.playerTimerPaused.next(remainingTime); // Notify that timer is paused with the time
    }

    // Resumes the player timer
    resumePlayerTimer(): void {
        this.pausedTime = null; // Reset the paused time
        this.playerTimerPaused.next(null); // Notify that timer is resumed
    }

    // Get the paused time (if any)
    getPausedTime(): number | null {
        return this.pausedTime; // Return the saved paused time
    }
}
