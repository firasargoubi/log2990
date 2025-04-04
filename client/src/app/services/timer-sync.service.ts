import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TimerSyncService {
    private playerTimerPaused: Subject<number | null> = new Subject<number | null>();
    private pausedTime: number | null = null;

    pausePlayerTimer(remainingTime: number): void {
        this.pausedTime = remainingTime;
        this.playerTimerPaused.next(remainingTime);
    }

    resumePlayerTimer(): void {
        this.pausedTime = null;
        this.playerTimerPaused.next(null);
    }

    getPausedTime(): number | null {
        return this.pausedTime;
    }
}
