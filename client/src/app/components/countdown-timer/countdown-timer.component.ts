import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-countdown-timer',
    templateUrl: './countdown-timer.component.html',
    styleUrls: ['./countdown-timer.component.scss'],
})
export class CountdownComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 60; // Default countdown for combat
    @Input() isPlayerTurn: boolean = false; // If it's the player's turn
    @Input() isInCombat: boolean = false; // If the player is in combat
    remainingTime: number = 0; // Remaining time for both normal and combat timers
    private interval: number | null = null; // Store the interval ID for clearing it
    private combatSubscription: Subscription | null = null;

    constructor(private lobbyService: LobbyService) {}

    ngOnInit(): void {
        // Start the combat countdown when in combat
        if (this.isInCombat) {
            this.remainingTime = this.countdown;
            this.startCombatCountdown(); // Combat timer starts
        }

        // Start the normal countdown if it's the player's turn
        if (this.isPlayerTurn && !this.isInCombat) {
            this.remainingTime = this.countdown; // Reset time for normal countdown
            this.startNormalCountdown(); // Normal timer starts
        }

        // Listen to combat time updates
        this.combatSubscription = this.lobbyService.onCombatUpdate().subscribe((data) => {
            if (data && data.timeLeft !== undefined) {
                this.remainingTime = data.timeLeft;
                if (this.remainingTime <= 0) {
                    this.stopCountdown();
                }
            }
        });
    }

    ngOnDestroy(): void {
        this.stopCountdown(); // Ensure the countdown stops when the component is destroyed
        if (this.combatSubscription) {
            this.combatSubscription.unsubscribe();
        }
    }

    startNormalCountdown(): void {
        if (this.remainingTime > 0 && this.interval === null) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    this.stopCountdown(); // Stop the countdown once the time is up
                }
            }, 1000); // 1 second interval
        }
    }

    startCombatCountdown(): void {
        if (this.remainingTime > 0 && this.interval === null) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    this.stopCountdown(); // Stop combat timer once the time is up
                }
            }, 1000); // 1 second interval
        }
    }

    stopCountdown(): void {
        if (this.interval !== null) {
            clearInterval(this.interval); // Clear the interval when stopping the countdown
            this.interval = null; // Reset the interval ID to null
        }
    }

    getDisplayTime(): string {
        // Show the countdown time based on the timer state
        if (this.isInCombat) {
            if (this.remainingTime <= 0) {
                return 'Combat Ended';
            }
            return `${this.remainingTime}s`; // Combat time remaining
        } else {
            if (this.remainingTime <= 0) {
                return 'Time is up!';
            }
            return `${this.remainingTime}s`; // Normal countdown time
        }
    }
}
