import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';

@Component({
    selector: 'app-countdown-combat',
    templateUrl: './countdown-combat.component.html',
    styleUrls: ['./countdown-combat.component.scss'],
})
export class CountdownCombatComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 0; // Temps restant pour le compte à rebours
    @Input() isInCombat: boolean = false; // Si le combat est actif
    @Input() isPlayerTurn: boolean = false; // Si c'est le tour du joueur
    @Input() isActivePlayer: boolean = false; // Si le joueur est actif
    @Input() lobbyId: string = ''; // ID de la salle
    @Input() timeLeft: number = 0; // Temps restant pour le combat
    @Input() combatEndTime: number = 0; // Temps de fin du combat

    private interval: number | null = null; // Typage avec number pour le setInterval

    constructor(private lobbyService: LobbyService) {}

    ngOnInit() {
        this.startCombatCountdown();
    }

    ngOnDestroy(): void {
        if (this.interval !== null) {
            clearInterval(this.interval); // Arrêter le compte à rebours quand le composant est détruit
        }
    }

    startCombatCountdown(): void {
        // Si c'est le tour du joueur ou s'il est dans un combat, on met à jour le temps
        if (this.isPlayerTurn || this.isInCombat) {
            this.interval = window.setInterval(() => {
                if (this.timeLeft > 0) {
                    this.timeLeft--; // Réduire le temps restant
                } else {
                    if (this.interval !== null) {
                        clearInterval(this.interval); // Arrêter l'intervalle quand le temps est écoulé
                        this.lobbyService.updateCountdown(this.timeLeft); // Mise à jour du compte à rebours dans le service
                    }
                }
            }, 1000); // Mise à jour chaque seconde
        }
    }
}
