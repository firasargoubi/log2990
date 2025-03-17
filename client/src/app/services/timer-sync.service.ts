// timer-sync.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TimerSyncService {
    private playerTimerPaused = new BehaviorSubject<number | null>(null);
    playerTimerPaused$ = this.playerTimerPaused.asObservable();

    pausePlayerTimer(remainingTime: number): void {
        this.playerTimerPaused.next(remainingTime);
    }

    resumePlayerTimer(): void {
        this.playerTimerPaused.next(null);
    }
}
