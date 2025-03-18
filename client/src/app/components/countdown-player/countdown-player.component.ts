import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { Subscription } from 'rxjs/internal/Subscription';

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
    @Input() isTransitioning: boolean = false; // Détermine si le jeu est en transition de tours
    @Input() lobbyId: string = ''; // ID de la salle
    @Input() isInCombat: boolean = false; // Add this line to allow binding isInCombat from the parent component

    remainingTime: number;
    message: string = '--'; // Message à afficher lorsque le joueur n'est pas impliqué
    private interval: number | null = null; // Typage avec number pour le setInterval
    private combatStatusSubscription: Subscription | null = null; // Pour gérer l'abonnement

    constructor(private lobbyService: LobbyService) {}

    ngOnInit(): void {
        this.remainingTime = this.countdown;
        this.combatStatusSubscription = this.lobbyService.isInCombat$.subscribe((status) => {
            this.isInCombat = status;
            console.log('combat?????', this.isInCombat);
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
            this.interval = null; // Arrêter le compte à rebours quand le composant est détruit
        }
        if (this.combatStatusSubscription) {
            this.combatStatusSubscription.unsubscribe(); // Se désabonner quand le composant est détruit
        }
    }

    startCountdown(countdown: number): void {
        // Si c'est le tour du joueur ou s'il est dans un combat, on met à jour le temps

        if (this.interval !== null) {
            clearInterval(this.interval); // Si un intervalle est déjà en cours, on l'arrête
        }
        this.interval = countdown;
        this.interval = window.setInterval(() => {
            if (this.remainingTime > 0) {
                this.remainingTime--;
            } else {
                if (this.interval !== null) {
                    clearInterval(this.interval);
                    this.interval = null; // Arrêter le compte à rebours quand le composant est détruit
                    // Arrêter l'intervalle quand le temps est écoulé
                    this.lobbyService.requestEndTurn(this.lobbyId); // Appeler la méthode onTurnEnded du service
                }
            }
        }, delay);
    }
    // Réinitialiser le compte à rebours lors de la transition de tour ou de la fin de combat

    pauseCountdown(): void {
        // Pause the countdown and store the remaining time
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null; // Arrêter le compte à rebours quand le composant est détruit
        }
        this.lobbyService.updateCombatTime(this.remainingTime);
        console.log('pause', this.remainingTime);
    }

    resumeCountdown(): void {
        // Resume the countdown if the timer was paused
        this.lobbyService.onCombatUpdate().subscribe((data) => {
            this.remainingTime = data.timeLeft;
        });
        console.log('resume:', this.remainingTime);
        if (this.interval === null) {
            this.startCountdown(this.remainingTime);
        }
    }

    getDisplayTime(): string {
        return this.remainingTime > 0 ? `${this.remainingTime}s` : 'Temps écoulé';
    }
}
