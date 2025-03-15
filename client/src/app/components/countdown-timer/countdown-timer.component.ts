// countdown-timer.component.ts

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-countdown-timer',
    templateUrl: './countdown-timer.component.html',
    styleUrls: ['./countdown-timer.component.scss'],
})
export class CountdownComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 30; // Default countdown for combat
    @Input() isPlayerTurn: boolean = false;
    @Input() isInCombat: boolean = false;
    @Input() isTransitioning: boolean = false;
    remainingTime: number = 0;
    combatActive: boolean = false;
    private interval: number | null = null;
    private combatSubscription: Subscription | null = null;

    constructor(private lobbyService: LobbyService) {}

    ngOnInit(): void {
        // Subscribe to the combat update event from the LobbyService
        this.combatSubscription = this.lobbyService.onCombatUpdate().subscribe((data) => {
            if (data && data.timeLeft !== undefined) {
                this.remainingTime = data.timeLeft;
                if (this.remainingTime <= 0) {
                    this.stopCountdown();
                }
            }
        });

        if (this.isInCombat) {
            this.remainingTime = this.countdown;
            this.startCountdown();
        }
    }

    ngOnDestroy(): void {
        this.stopCountdown();
        if (this.combatSubscription) {
            this.combatSubscription.unsubscribe();
        }
    }

    startCountdown(): void {
        if (this.remainingTime > 0 && this.interval === null) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    this.stopCountdown(); // Stop countdown when the time is up
                }
            }, 1000); // 1 second interval
        }
    }

    stopCountdown(): void {
        if (this.interval !== null) {
            clearInterval(this.interval); // Ensure that interval is not null before clearing
            this.interval = null; // Reset interval to null after clearing
        }
    }

    getDisplayTime(): string {
        if (!this.isInCombat) {
            return 'Not in combat';
        }

        if (this.remainingTime <= 0) {
            return 'Combat Ended';
        }

        return `${this.remainingTime}s`;
    }
}
