import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TimerSyncService } from '@app/services/timer-sync.service';

const delay = 1000; // 1 second

@Component({
    selector: 'app-countdown-player',
    templateUrl: './countdown-player.component.html',
    styleUrls: ['./countdown-player.component.scss'],
})
export class CountdownPlayerComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 60; // Initial countdown duration
    @Input() isPlayerTurn: boolean = false; // Indicates if it’s the current player’s turn
    @Input() isInCombat: boolean = false; // Indicates if the player is in combat
    @Input() isTransitioning: boolean = false; // Indicates if the game is transitioning turns
    @Input() lobbyId: string = ''; // Lobby ID

    remainingTime: number;
    message: string = '--'; // Message to display when the player is not involved
    interval: number | null = null; // Typing for setInterval

    constructor(private timerSyncService: TimerSyncService) {}

    ngOnInit(): void {
        this.remainingTime = this.countdown;
        this.startCountdown();

        // Check if the timer has been paused and resume it
        const pausedTime = this.timerSyncService.getPausedTime();
        if (pausedTime !== null) {
            this.pauseCountdown();
            this.remainingTime = pausedTime; // Set the remaining time to the paused value
        }
    }

    ngOnDestroy(): void {
        if (this.interval !== null) {
            clearInterval(this.interval); // Clear the interval when the component is destroyed
            this.interval = null; // Clean the interval reference
        }
    }

    startCountdown(): void {
        // Start the countdown if the timer is not paused
        if (this.remainingTime > 0) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    if (this.interval !== null) {
                        clearInterval(this.interval); // Stop the interval when the time is up
                        this.interval = null;
                    }
                }
            }, delay);
        }
    }

    pauseCountdown(): void {
        // Pause the countdown and store the remaining time
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.timerSyncService.pausePlayerTimer(this.remainingTime); // Pause the player timer in the service
    }

    resumeCountdown(): void {
        // Resume the countdown if the timer was paused
        if (this.interval === null) {
            this.startCountdown();
        }
        this.timerSyncService.resumePlayerTimer(); // Let the service know the timer has resumed
    }

    getDisplayTime(): string {
        return this.remainingTime > 0 ? `${this.remainingTime}s` : 'Temps écoulé';
    }

    resetCountdown(): void {
        // Reset the countdown
        this.remainingTime = this.countdown;
        if (this.interval !== null) {
            clearInterval(this.interval); // Stop the ongoing interval
            this.interval = null;
        }
        this.startCountdown();
    }
}
