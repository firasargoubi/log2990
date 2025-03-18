import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { Subscription } from 'rxjs/internal/Subscription';

const delay = 1000;

@Component({
    selector: 'app-countdown-player',
    templateUrl: './countdown-player.component.html',
    styleUrls: ['./countdown-player.component.scss'],
    imports: [CommonModule],
})
export class CountdownPlayerComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 60;
    @Input() isPlayerTurn: boolean = false;
    @Input() isTransitioning: boolean = false;
    @Input() lobbyId: string = '';
    @Input() isInCombat: boolean = false;
    @Input() isAnimated: boolean = false;

    remainingTime: number;
    message: string = '--';
    interval: number | null = null;
    private combatStatusSubscription: Subscription | null = null;

    constructor(private lobbyService: LobbyService) {}

    ngOnInit(): void {
        this.remainingTime = this.countdown;
        this.combatStatusSubscription = this.lobbyService.isInCombat$.subscribe((status) => {
            this.isInCombat = status;
            if (this.isInCombat) {
                this.pauseCountdown();
            } else {
                this.startCountdown(this.remainingTime);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.combatStatusSubscription) {
            this.combatStatusSubscription.unsubscribe();
        }
    }

    startCountdown(countdown: number): void {
        if (this.interval !== null) {
            clearInterval(this.interval);
        }
        this.interval = countdown;
        this.interval = window.setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
            } else {
                if (this.interval !== null) {
                    clearInterval(this.interval);
                    this.interval = null;
                    while (this.isAnimated);
                    this.lobbyService.requestEndTurn(this.lobbyId);
                }
            }
        }, delay);
    }

    pauseCountdown(): void {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.lobbyService.updateCombatTime(this.remainingTime);
    }

    resumeCountdown(): void {
        this.lobbyService.onCombatUpdate().subscribe((data) => {
            this.remainingTime = data.timeLeft;
        });
        if (this.interval === null) {
            this.startCountdown(this.remainingTime);
        }
    }

    getDisplayTime(): string {
        return this.remainingTime > 0 ? `${this.remainingTime}s` : 'Temps écoulé';
    }
}
