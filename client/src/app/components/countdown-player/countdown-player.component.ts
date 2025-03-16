import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';

@Component({
    selector: 'app-countdown-player',
    templateUrl: './countdown-player.component.html',
    styleUrls: ['./countdown-player.component.scss'],
    imports: [CommonModule],
})
export class CountdownPlayerComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 30; // Temps initial du compte à rebours
    @Input() isInCombat: boolean = false; // Si le joueur est dans un combat
    @Input() isPlayerTurn: boolean = false; // Si c'est le tour du joueur
    @Input() isActivePlayer: boolean = false; // Si le joueur est actif
    @Input() lobbyId: string = ''; // ID de la salle
    @Input() timeLeft: number = 0; // Temps restant pour l'action
    attackCountdown: number = 0; // Nouveau timer pour l'attaque
    message: string = ''; // Message à afficher si le compte à rebours est en pause
    remainingTime: number = 0; // Temps restant actuel
    private interval: number | null = null; // Intervalle pour le compte à rebours
    constructor(private lobbyService: LobbyService) {} // Inject the LobbyService

    ngOnInit(): void {
        this.remainingTime = this.countdown; // Initialiser remainingTime
        this.resetCountdown(); // Réinitialiser le compte à rebours

        this.startCountdown(); // Lancer le compte à rebours
    }

    ngOnDestroy(): void {
        // Arrêter l'intervalle quand le composant est détruit
        if (this.interval !== null) {
            clearInterval(this.interval);
        }
    }

    startCountdown() {
        // Si c'est le tour du joueur, démarrer le compte à rebours
        this.interval = window.setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--; // Décrémenter le temps restant
                console.log(`Remaining Time: ${this.remainingTime}`);
            } else {
                if (this.interval !== null) {
                    clearInterval(this.interval); // Arrêter l'intervalle quand le temps est écoulé
                    console.log('Countdown finished');
                }

                this.lobbyService.onTurnEnded();
            }
        }, 1000); // Mise à jour chaque seconde
    }

    getDisplayTime(): string {
        // Si le joueur n'est pas impliqué dans un combat, afficher un message spécial

        // Sinon, afficher le temps restant
        return this.remainingTime > 0 ? `${this.remainingTime}` : '0';
    }

    // Réinitialiser le compte à rebours lors de la transition de tour ou de la fin de combat
    resetCountdown() {
        this.remainingTime = this.countdown;
        if (this.interval !== null) {
            clearInterval(this.interval); // Arrêter l'intervalle en cours
        }
        this.startCountdown(); // Redémarrer le compte à rebours
    }
}
