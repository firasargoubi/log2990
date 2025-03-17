import { Component, Input, OnDestroy, OnInit } from '@angular/core';

const delay = 1000; // 1 seconde

@Component({
    selector: 'app-countdown-timer',
    templateUrl: './countdown-timer.component.html',
    styleUrls: ['./countdown-timer.component.scss'],
})
export class CountdownComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 60; // Durée initiale du compte à rebours
    @Input() isPlayerTurn: boolean = false; // Détermine si c'est le tour du joueur courant
    @Input() isInCombat: boolean = false; // Détermine si le joueur est dans un combat
    @Input() isTransitioning: boolean = false; // Détermine si le jeu est en transition de tours

    remainingTime: number;
    message: string = '--'; // Message à afficher lorsque le joueur n'est pas impliqué
    private interval: number | null = null; // Typage avec number pour le setInterval

    ngOnInit(): void {
        this.remainingTime = this.countdown;
        this.startCountdown();
    }

    ngOnDestroy(): void {
        if (this.interval !== null) {
            clearInterval(this.interval); // Arrêter le compte à rebours quand le composant est détruit
        }
    }

    startCountdown(): void {
        // Si c'est le tour du joueur ou s'il est dans un combat, on met à jour le temps
        if (this.isPlayerTurn || this.isInCombat || this.isTransitioning) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    if (this.interval !== null) {
                        clearInterval(this.interval); // Arrêter l'intervalle quand le temps est écoulé
                    }
                }
            }, delay);
        }
    }

    getDisplayTime(): string {
        // Si le joueur n'est pas impliqué dans un combat, afficher un message spécial
        if (!this.isPlayerTurn) {
            if (this.isInCombat) {
                this.message = 'Combat en cours';
            } else if (this.isTransitioning) {
                this.message = 'Transition en cours';
            } else {
                this.message = '--';
            }
            return this.message;
        }
        // Sinon, on affiche le compte à rebours
        return this.remainingTime > 0 ? `${this.remainingTime}s` : 'Temps écoulé';
    }

    // Réinitialiser le compte à rebours lors de la transition de tour ou de la fin de combat
    resetCountdown() {
        this.remainingTime = this.countdown;
        if (this.interval !== null) {
            clearInterval(this.interval); // Arrêter l'intervalle en cours
        }
        this.startCountdown();
    }
}
