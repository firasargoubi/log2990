import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';

@Component({
    selector: 'app-countdown-combat',
    templateUrl: './countdown-combat.component.html',
    styleUrls: ['./countdown-combat.component.scss'],
})
export class CountdownCombatComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 0; // Time remaining for countdown
    @Input() isInCombat: boolean = false;
    @Input() isPlayerTurn: boolean = false;
    @Input() isActivePlayer: boolean = false; // Flag to check if the player is active
    @Input() lobbyId: string = '';
    @Input() timeLeft: number = 0;
    @Input() combatEndTime: number = 0;
    attackCountdown: number = 0; // New timer for attack action
    private countdownInterval: unknown;
    constructor(private lobbyService: LobbyService) {} // Inject LobbyService

    ngOnInit() {
        this.startCombatCountdown();
    }

    ngOnDestroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    startCombatCountdown() {
        this.countdownInterval = setInterval(() => {
            const timeLeft = this.combatEndTime - Date.now();
            if (timeLeft <= 0) {
                clearInterval(this.countdownInterval); // Stop combat countdown
                // Handle end of combat (e.g., combat ended)
            } else {
                this.lobbyService.updateCountdown(timeLeft); // Update countdown in service
            }
        }, 1000); // Update every second
    }
}
