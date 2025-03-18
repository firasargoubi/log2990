import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { Subscription } from 'rxjs';
import { ActionService } from './action.service';
import { PlayerService } from './player.service';

@Injectable({
    providedIn: 'root',
})
export class GameListener implements OnDestroy {
    private currentPlayer: Player;
    private gameState: GameState | null = null;
    private lobbyId: string = '';
    private isInCombat: boolean = false;
    private remainingTime: number = 0;
    private interval: number | null = null;
    private subscriptions: Subscription[] = [];

    constructor(
        private lobbyService: LobbyService,
        private actionService: ActionService,
        private router: Router,
        private playerService: PlayerService,
        private notificationService: NotificationService,
    ) {}

    initializeGame(lobbyId: string) {
        this.lobbyId = lobbyId;
        this.setupGameListeners();
        this.getCurrentPlayer();
    }

    onActionRequest(tile: Tile) {
        if (!this.gameState || !this.currentPlayer) return;
        if (this.gameState.currentPlayer !== this.currentPlayer.id) return;
        if (this.gameState.animation) return;

        const action = this.actionService.getActionType(tile, this.gameState);
        if (!action) return;

        if (action === 'battle') {
            const opponent = this.actionService.findOpponent(tile) || null;
            if (opponent) {
                this.lobbyService.initializeBattle(this.currentPlayer, opponent, this.lobbyId);
            }
        }

        this.lobbyService.executeAction(action, tile, this.lobbyId).subscribe({
            next: (data) => {
                if (this.gameState?.board) {
                    this.gameState = {
                        ...this.gameState,
                        board: data.newGameBoard.map((row) => [...row]),
                    };
                }
            },
        });
    }

    onAttackClick(playerId: string, lobbyId: string): void {
        const opponent = this.gameState?.players.find((p) => p.id === playerId);
        if (!opponent) return;

        this.lobbyService.startCombat(lobbyId, this.currentPlayer, opponent, 50);
        this.isInCombat = true;
        this.remainingTime = 30;
    }

    onMoveRequest(coordinates: Coordinates[]) {
        if (!this.gameState || !this.currentPlayer) return;
        if (this.gameState.currentPlayer !== this.currentPlayer.id) return;

        this.lobbyService.requestMovement(this.lobbyId, coordinates);
    }

    onEndTurn() {
        if (!this.gameState || !this.currentPlayer) return;
        if (this.gameState.currentPlayer !== this.currentPlayer.id) return;

        this.lobbyService.requestEndTurn(this.lobbyId);
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    private setupGameListeners() {
        this.subscriptions.push(
            this.lobbyService.onGameStarted().subscribe((data) => {
                this.gameState = data.gameState;
                this.getCurrentPlayer();
            }),
            this.lobbyService.onTurnStarted().subscribe((data) => {
                this.gameState = data.gameState;
                this.playerService.syncCurrentPlayerWithGameState();
                this.playerService.notifyPlayerTurn(data.currentPlayer);
            }),
            // Ajouter les autres listeners ici...
        );
    }

    private getCurrentPlayer() {
        const currentPlayer = this.lobbyService.getCurrentPlayer();
        if (!currentPlayer) {
            this.router.navigate(['/home'], { replaceUrl: true });
            return;
        }
        this.currentPlayer = currentPlayer;
    }
}
