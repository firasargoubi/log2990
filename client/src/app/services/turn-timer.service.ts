import { Injectable } from '@angular/core';
import { LobbyService } from './lobby.service';

@Injectable({
    providedIn: 'root',
})
export class TurnTimerService {
    private intervalId: number | null = null;

    constructor(private lobbyService: LobbyService) {}

    startCountdown(remainingTime: number, currentPlayerId: string, onTick: (time: number) => void, onEnd?: () => void): void {
        if (remainingTime <= 0) return;

        this.clearCountdown(); // Pour éviter de superposer plusieurs timers

        this.intervalId = window.setInterval(() => {
            if (remainingTime > 0) {
                remainingTime--;
                onTick(remainingTime);
                this.updateTimerForAllPlayers(currentPlayerId, remainingTime);
            } else {
                this.clearCountdown();
                if (onEnd) onEnd();
            }
        }, 1000);
    }

    updateTimerForAllPlayers(currentPlayerId: string, time: number): void {
        if (currentPlayerId) {
            this.lobbyService.updateCombatTime(time);
        }
    }

    clearCountdown(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
