// countdown-player.component.ts
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { TimerSyncService } from '@app/services/timer-sync.service';

const delay = 1000; // 1 seconde

@Component({
    selector: 'app-countdown-player',
    templateUrl: './countdown-player.component.html',
    styleUrls: ['./countdown-player.component.scss'],
})
export class CountdownPlayerComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 60; // Durée initiale du compte à rebours
    @Input() isPlayerTurn: boolean = false; // Détermine si c'est le tour du joueur courant
    @Input() isInCombat: boolean = false; // Détermine si le joueur est dans un combat
    @Input() isTransitioning: boolean = false; // Détermine si le jeu est en transition de tours
    @Input() lobbyId: string = ''; // ID de la salle
    @Input() isAnimated: boolean = false;

    remainingTime: number;
    message: string = '--'; // Message à afficher lorsque le joueur n'est pas impliqué
    interval: number | null = null; // Typage avec number pour le setInterval

    constructor(
        private lobbyService: LobbyService,
        private timerSyncService: TimerSyncService,
    ) {}

    ngOnInit(): void {
        this.remainingTime = this.countdown;
        this.startCountdown();

        // S'abonner aux changements de pause/reprise du timer
        this.timerSyncService.playerTimerPaused$.subscribe((remainingTime) => {
            if (remainingTime !== null) {
                this.pauseCountdown();
                this.remainingTime = remainingTime; // Mettre à jour le temps restant
            } else {
                this.resumeCountdown();
            }
        });
    }

    ngOnDestroy(): void {
        if (this.interval !== null) {
            clearInterval(this.interval); // Arrêter le compte à rebours quand le composant est détruit
            this.interval = null; // Nettoyer la référence de l'intervalle
        }
    }

    startCountdown(): void {
        this.interval = window.setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
            } else {
                if (this.interval !== null) {
                    clearInterval(this.interval); // Arrêter l'intervalle quand le temps est écoulé
                    this.interval = null;
                    while (this.isAnimated);
                    this.lobbyService.requestEndTurn(this.lobbyId); // Appeler la méthode onTurnEnded du service
                }
            }
        }, delay);
    }

    pauseCountdown(): void {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    resumeCountdown(): void {
        if (this.interval === null) {
            this.startCountdown();
        }
    }

    getDisplayTime(): string {
        return this.remainingTime > 0 ? `${this.remainingTime}s` : 'Temps écoulé';
    }

    resetCountdown(): void {
        this.remainingTime = this.countdown;
        if (this.interval !== null) {
            clearInterval(this.interval); // Arrêter l'intervalle en cours
            this.interval = null;
        }
        this.startCountdown();
    }
}
