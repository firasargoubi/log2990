import { Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';

@Component({
    selector: 'app-combat',
    templateUrl: './combat.component.html',
    styleUrls: ['./combat.component.scss'],
})
export class CombatComponent implements OnInit, OnChanges {
    @Input() currentPlayer!: Player;
    @Input() opponent!: Player;
    @Input() lobbyId!: string;
    @Input() gameState: GameState | null = null;
    isPlayerTurn: boolean = false;
    playerTurn: string = '';
    countDown: number = 0;
    canAct: boolean = false;
    private lobbyService = inject(LobbyService);
    private countDownInterval: ReturnType<typeof setInterval> | null = null;

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
        this.startCountdown();
    }

    startCountdown() {
        this.countDownInterval = setInterval(() => {
            if (this.countDown > 0) {
                this.countDown--;
            } else {
                this.endTimer();
            }
        }, 1000);
    }

    endTimer() {
        if (this.gameState) {
            this.lobbyService.changeTurnEnd(this.currentPlayer, this.opponent, this.playerTurn, this.gameState);
        }
        if (this.countDownInterval !== null) {
            clearInterval(this.countDownInterval);
        }
        this.subscribeToPlayerSwitch();
    }

    private subscribeToPlayerTurn() {
        this.lobbyService.getPlayerTurn().subscribe((data) => {
            this.playerTurn = data.playerTurn;
            this.countDown = data.countDown;
            this.canAct = this.currentPlayer.id === this.playerTurn;

        });
    }

    private subscribeToPlayerSwitch() {
        this.lobbyService.getPlayerSwitch().subscribe((data) => {
            this.playerTurn = data.newPlayerTurn;
            this.countDown = data.countDown;
            this.canAct = this.currentPlayer.id === this.playerTurn;
        });
    }
}
