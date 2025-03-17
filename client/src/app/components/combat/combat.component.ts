// combat.component.ts
import { Component, inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';

@Component({
    selector: 'app-combat',
    templateUrl: './combat.component.html',
    styleUrls: ['./combat.component.scss'],
})
export class CombatComponent implements OnInit, OnChanges, OnDestroy {
    @Input() currentPlayer!: Player;
    @Input() opponent!: Player;
    @Input() lobbyId!: string;
    @Input() gameState: GameState | null = null;
    isPlayerTurn: boolean = false;
    playerTurn: string = '';
    countDown: number = 0;
    canAct: boolean = false;
    isCombatCountdownActive: boolean = false;
    combatTimeLeft: number = 5; // Temps de combat par tour
    playerTimeLeft: number = 60; // Temps du joueur
    pausedPlayerTimeLeft: number = 0; // Temps restant du joueur avant la pause

    private lobbyService = inject(LobbyService);
    private combatTimer: ReturnType<typeof setInterval> | null = null;
    private playerTimer: ReturnType<typeof setInterval> | null = null;

    ngOnInit() {
        if (this.gameState) {
            this.lobbyService.handleAttack(this.currentPlayer, this.opponent, this.lobbyId, this.gameState);
        }
        this.subscribeToPlayerTurn();
    }

    ngOnChanges() {
        if (!this.currentPlayer) {
            this.currentPlayer = this.gameState?.players.find((p) => p.id === this.playerTurn) ?? this.currentPlayer;
        }

        if (!this.opponent) {
            this.opponent = this.gameState?.players.find((p) => p.id !== this.currentPlayer.id) ?? this.opponent;
        }
    }

    startCombatCountdown(): void {
        this.isCombatCountdownActive = true;

        // Sauvegarder le temps restant du joueur et mettre en pause son compteur
        this.pausedPlayerTimeLeft = this.playerTimeLeft;
        this.stopPlayerCountdown();

        // Démarrer le compteur de combat
        this.combatTimer = setInterval(() => {
            this.combatTimeLeft--;
            if (this.combatTimeLeft <= 0) {
                this.stopCombatCountdown();
            }
        }, 1000);
    }

    stopCombatCountdown(): void {
        // Arrêter le compteur de combat
        if (this.combatTimer) {
            clearInterval(this.combatTimer);
        }
        this.isCombatCountdownActive = false;

        // Reprendre le compteur du joueur à partir du temps sauvegardé
        this.playerTimeLeft = this.pausedPlayerTimeLeft;
        this.startPlayerCountdown();
    }

    startPlayerCountdown(): void {
        this.playerTimer = setInterval(() => {
            if (this.canAct) {
                this.playerTimeLeft--;
                if (this.playerTimeLeft <= 0) {
                    this.stopPlayerCountdown();
                }
            }
        }, 1000);
    }

    stopPlayerCountdown(): void {
        if (this.playerTimer) {
            clearInterval(this.playerTimer);
            this.playerTimer = null; // Nettoyer la référence
        }
    }

    ngOnDestroy(): void {
        // Nettoyer les intervalles lors de la destruction du composant
        if (this.combatTimer) {
            clearInterval(this.combatTimer);
        }
        if (this.playerTimer) {
            clearInterval(this.playerTimer);
        }
    }

    private subscribeToPlayerTurn() {
        this.lobbyService.getPlayerTurn().subscribe((data) => {
            this.playerTurn = data.playerTurn;
            this.countDown = data.countDown;
            this.canAct = this.currentPlayer.id === this.playerTurn;
        });
    }
}
