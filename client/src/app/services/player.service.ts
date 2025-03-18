import { Injectable, OnDestroy } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerService implements OnDestroy {
    private currentPlayer: Player | null = null;
    private gameState: GameState | null = null;
    private subscriptions: Subscription[] = [];

    constructor(
        private lobbyService: LobbyService,
        private notificationService: NotificationService,
    ) {}

    syncCurrentPlayerWithGameState() {
        if (!this.gameState || !this.currentPlayer) return;

        const playerInGameState = this.gameState.players.find((p) => p.id === this.currentPlayer?.id);

        if (playerInGameState) {
            if (JSON.stringify(playerInGameState) !== JSON.stringify(this.currentPlayer)) {
                this.currentPlayer = playerInGameState;
                this.lobbyService.setCurrentPlayer(this.currentPlayer);
            }
        }
    }

    notifyPlayerTurn(playerId: string) {
        if (this.currentPlayer && playerId === this.currentPlayer.id) {
            this.notificationService.showSuccess("C'est votre tour!");
        } else {
            const player = this.gameState?.players.find((p) => p.id === playerId);
            if (player) {
                this.notificationService.showInfo(`C'est le tour de ${player.name}`);
            }
        }
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
