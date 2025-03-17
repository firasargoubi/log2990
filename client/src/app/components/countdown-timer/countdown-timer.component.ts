import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-countdown-timer',
    templateUrl: './countdown-timer.component.html',
    styleUrls: ['./countdown-timer.component.scss'],
})
export class CountdownComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 30; // Par défaut 30 secondes
    @Input() isPlayerTurn: boolean = false;
    @Input() isInCombat: boolean = false;
    @Input() lobbyId: string = ''; // Input for lobbyId from parent

    remainingTime: number = 0;
    interval: number | null = null;
    combatSubscription: Subscription | null = null;

    constructor(private lobbyService: LobbyService) {}

    ngOnInit(): void {
        if (this.isInCombat) {
            this.remainingTime = this.countdown;
            this.startCombatCountdown();
        }

        if (this.isPlayerTurn && !this.isInCombat) {
            this.remainingTime = this.countdown;
            this.startNormalCountdown();
        }

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
        this.stopCountdown();
        if (this.combatSubscription) {
            this.combatSubscription.unsubscribe();
        }
    }

    // Démarrer le compte à rebours normal pour le tour
    startNormalCountdown(): void {
        if (this.remainingTime > 0 && this.interval === null) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    this.stopCountdown(); // Arrête le compte à rebours lorsque le temps est écoulé
                    this.lobbyService.requestEndTurn(this.lobbyId);
                }
            }, 1000); // 1 seconde
        }
    }

    // Démarrer le compte à rebours du combat
    startCombatCountdown(): void {
        if (this.remainingTime > 0 && this.interval === null) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    this.stopCountdown();
                }
            }, 1000); // 1 seconde
        }
    }

    stopCountdown(): void {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    getDisplayTime(): string {
        // Affichage du compte à rebours en fonction du type de compte
        if (this.isInCombat) {
            return this.remainingTime <= 0 ? 'Combat Ended' : `${this.remainingTime}s`;
        } else {
            return this.remainingTime <= 0 ? 'Time is up!' : `${this.remainingTime}s`;
        }
    }
}
