import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
import { LobbyService } from '@app/services/lobby.service';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';

export interface GameListenerContext {
    lobbyId: string;
    currentPlayer: Player;
    gameState: GameState | null;
    lobby: GameLobby;
    updateState: (newState: GameState) => void;
    updateLobby: (newLobby: GameLobby) => void;
    setCurrentPlayer: (player: Player) => void;
    onPlayerRemoved: () => void;
    onPlayerTurn: (playerId: string) => void;
    onCombatStateChange: (isInCombat: boolean) => void;
    showInfo: (message: string) => void;
    showError: (message: string) => void;
    showSuccess: (message: string) => void;
}

@Injectable({ providedIn: 'root' })
export class GameListenerService {
    isInCombat: boolean = false;

    constructor(
        private lobbyService: LobbyService,
        private router: Router,
    ) {}

    setupListeners(context: GameListenerContext): Subscription[] {
        return [
            this.lobbyService.onGameStarted().subscribe((data) => {
                context.updateState(data.gameState);
                const currentPlayer = this.lobbyService.getCurrentPlayer();
                if (currentPlayer) context.setCurrentPlayer(currentPlayer);
            }),

            this.lobbyService.onTurnStarted().subscribe((data) => {
                context.updateState(data.gameState);
                const currentPlayer = this.lobbyService.getCurrentPlayer();
                if (currentPlayer) context.setCurrentPlayer(currentPlayer);
                context.onPlayerTurn(data.currentPlayer);
            }),

            this.lobbyService.onTurnEnded().subscribe((data) => {
                context.updateState(data.gameState);
            }),

            this.lobbyService.onMovementProcessed().subscribe((data) => {
                context.updateState(data.gameState);
            }),

            this.lobbyService.onError().subscribe((error) => {
                context.showError(error);
            }),

            this.lobbyService.onLobbyUpdated().subscribe((data) => {
                if (data.lobby.id === context.lobbyId) {
                    context.updateLobby(data.lobby);
                    const stillPresent = data.lobby.players.find((p) => p.id === context.currentPlayer.id);
                    if (!stillPresent) {
                        this.lobbyService.disconnectFromRoom(context.lobbyId);
                        context.onPlayerRemoved();
                        this.router.navigate([PageUrl.Home], { replaceUrl: true });
                    } else {
                        this.lobbyService.updatePlayers(context.lobbyId, data.lobby.players);
                    }
                }
            }),

            this.lobbyService.onBoardChanged().subscribe((data) => {
                context.updateState(data.gameState);
            }),

            this.lobbyService.onFleeSuccess().subscribe((data) => {
                this.isInCombat = false;
                context.onCombatStateChange(false);
                this.lobbyService.updateCombatStatus(this.isInCombat);
                context.currentPlayer.life = context.currentPlayer.maxLife;
                if (context.currentPlayer.name === data.fleeingPlayer.name) {
                    context.showInfo('Vous avez fui le combat.');
                } else {
                    context.showInfo(`${data.fleeingPlayer.name} a fui le combat.`);
                }
            }),

            this.lobbyService.onAttackEnd().subscribe((data) => {
                context.onCombatStateChange(data.isInCombat);
                this.lobbyService.updateCombatStatus(data.isInCombat);
                context.currentPlayer.life = context.currentPlayer.maxLife;
                context.showInfo(`${context.currentPlayer.name} a fini son combat.`);
            }),
        ];
    }
}
