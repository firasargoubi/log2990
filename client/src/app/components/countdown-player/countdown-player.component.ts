import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TIMEOUT_START_COMBAT, TURN_START_TIME } from '@app/Consts/app.constants';
import { LobbyService } from '@app/services/lobby.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-countdown-player',
    templateUrl: './countdown-player.component.html',
    styleUrls: ['./countdown-player.component.scss'],
    imports: [CommonModule],
})
export class CountdownPlayerComponent implements OnInit, OnDestroy {
    @Input() countdown: number = TURN_START_TIME;
    @Input() isPlayerTurn: boolean = false;
    @Input() isTransitioning: boolean = false;
    @Input() lobbyId: string = '';
    @Input() isInCombat: boolean = false;
    @Input() isAnimated: boolean = false;

    private remainingTime: number;
    private interval: number | null = null;
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

    getDisplayTime(): string {
        return this.remainingTime > 0 ? `${this.remainingTime}s` : 'Temps écoulé';
    }

    private startCountdown(countdown: number): void {
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
        }, TIMEOUT_START_COMBAT);
    }

    private pauseCountdown(): void {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}
