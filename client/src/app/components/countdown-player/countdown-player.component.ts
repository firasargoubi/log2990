import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

@Component({
    selector: 'app-countdown-player',
    templateUrl: './countdown-player.component.html',
    styleUrls: ['./countdown-player.component.scss'],
    imports: [CommonModule],
})
export class CountdownPlayerComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 0; // Time remaining for countdown
    @Input() isInCombat: boolean = false;
    @Input() isPlayerTurn: boolean = false;
    @Input() isActivePlayer: boolean = false; // Flag to check if the player is active
    @Input() lobbyId: string = '';
    @Input() timeLeft: number = 0;
    attackCountdown: number = 0; // New timer for attack action
    message: string = ''; // Message to display
    remainingTime: number = 30;
    private interval: number | null = null; // Typage avec number pour le setInterval
    // constructor(private lobbyService: LobbyService) {} // Inject LobbyService

    ngOnInit(): void {
        this.remainingTime = this.countdown;
        this.startCountdown();
    }

    ngOnDestroy(): void {
        if (this.interval !== null) {
            clearInterval(this.interval); // Arrêter le compte à rebours quand le composant est détruit
        }
    }
    startCountdown() {
        // Si c'est le tour du joueur ou s'il est dans un combat, on met à jour le temps
        if (this.isPlayerTurn || this.isInCombat) {
            this.interval = window.setInterval(() => {
                if (this.remainingTime > 0) {
                    this.remainingTime--;
                } else {
                    if (this.interval !== null) {
                        clearInterval(this.interval); // Arrêter l'intervalle quand le temps est écoulé
                    }
                }
            }, 1000);
        }
    }

    getDisplayTime(): string {
        // Si le joueur n'est pas impliqué dans un combat, afficher un message spécial
        if (!this.isPlayerTurn) {
            if (this.isInCombat) {
                this.message = 'Combat en cours';
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
