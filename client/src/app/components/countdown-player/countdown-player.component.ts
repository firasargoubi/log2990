import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';

const delay = 1000; // 1 seconde

@Component({
    selector: 'app-countdown-player',
    templateUrl: './countdown-player.component.html',
    styleUrls: ['./countdown-player.component.scss'],
    imports: [CommonModule],
})
export class CountdownPlayerComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 60; // Durée initiale du compte à rebours
    @Input() isPlayerTurn: boolean = false; // Détermine si c'est le tour du joueur courant
    @Input() isInCombat: boolean = false; // Détermine si le joueur est dans un combat
    @Input() isTransitioning: boolean = false; // Détermine si le jeu est en transition de tours
    @Input() lobbyId: string = ''; // ID de la salle
    constructor(private lobbyService: LobbyService) {}

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
        this.interval = window.setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
            } else {
                if (this.interval !== null) {
                    clearInterval(this.interval); // Arrêter l'intervalle quand le temps est écoulé
                    this.lobbyService.requestEndTurn(this.lobbyId); // Appeler la méthode onTurnEnded du service
                }
            }
        }, delay);
    }

    getDisplayTime(): string {
        // Si le joueur n'est pas impliqué dans un combat, afficher un message spécial

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
