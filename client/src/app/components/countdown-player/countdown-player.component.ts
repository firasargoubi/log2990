import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';

@Component({
    selector: 'app-countdown-player',
    templateUrl: './countdown-player.component.html',
    styleUrls: ['./countdown-player.component.scss'],
})
export class CountdownPlayerComponent implements OnInit, OnDestroy {
    @Input() countdown: number = 0; // Time remaining for countdown
    @Input() isInCombat: boolean = false;
    @Input() isPlayerTurn: boolean = false;
    @Input() isActivePlayer: boolean = false; // Flag to check if the player is active
    @Input() lobbyId: string = '';
    @Input() timeLeft: number = 0;
    attackCountdown: number = 0; // New timer for attack action
    private countdownInterval: number | undefined;
    constructor(private lobbyService: LobbyService) {} // Inject LobbyService

    ngOnInit() {
        this.startCountdown();
    }

    ngOnDestroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    startCountdown() {
        this.countdownInterval = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.lobbyService.updateCountdown(this.timeLeft); // Update countdown in service
            } else {
                clearInterval(this.countdownInterval); // Stop countdown
                // Handle what happens when the countdown ends (e.g., end turn)
            }
        }, 1000); // Update every second
    }
}
