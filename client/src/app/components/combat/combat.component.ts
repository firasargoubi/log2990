import { Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';

// const TO_SECONDS = 1000;
const FLEE_RATE = 0;
@Component({
    selector: 'app-combat',
    templateUrl: './combat.component.html',
    styleUrls: ['./combat.component.scss'],
})
export class CombatComponent implements OnInit, OnChanges {
    @Input() currentPlayer!: Player;
    @Input() lobbyId!: string;
    @Input() gameState: GameState | null = null;
    @Input() opponent!: Player;
    isPlayerTurn: boolean = false;
    playerTurn: string = '';
    countDown: number = 0;
    canAct: boolean = false;
    isFleeSuccess: boolean = false;
    private lobbyService = inject(LobbyService);
    private countDownInterval: ReturnType<typeof setInterval> | null = null;
    private notificationService = inject(NotificationService);

    ngOnInit() {
        if (this.gameState) {
            this.lobbyService.handleAttack(this.currentPlayer, this.opponent, this.lobbyId, this.gameState);
        }
        this.subscribeToPlayerTurn();
        this.subscribeToPlayerSwitch();
        this.subscribeToNewSpawnPoints();
        this.subscribeToFleeFailure();
    }

    ngOnChanges() {
        this.subscribeToPlayerSwitch();
        if (!this.currentPlayer) {
            this.currentPlayer = this.gameState?.players.find((p) => p.id === this.playerTurn) ?? this.currentPlayer;
        }

        if (!this.opponent) {
            this.opponent = this.gameState?.players.find((p) => p.id !== this.currentPlayer.id) ?? this.opponent;
        }
        // this.startCountdown();
    }

    startCountdown() {
        // this.countDownInterval = setInterval(() => {
        //     if (this.countDown > 0) {
        //         this.countDown--;
        //     } else {
        //         this.endTimer();
        //     }
        // }, TO_SECONDS);
    }

    endTimer() {
        if (this.gameState) {
            this.lobbyService.changeTurnEnd(this.currentPlayer, this.opponent, this.playerTurn, this.gameState);
        }
        if (this.countDownInterval !== null) {
            clearInterval(this.countDownInterval);
        }
        this.onAttack();
    }

    onAttack() {
        console.log('ON EST DANS ONATTACK() CLIENT');
        if (!this.gameState) return;
        const attackRoll = this.rollDice(this.currentPlayer, 'attack') + this.currentPlayer.attack;
        const defenseRoll = this.rollDice(this.opponent, 'defense') + this.opponent.defense;
        if (this.isOnIce(this.currentPlayer)) {
            this.currentPlayer.attack -= 2;
            this.currentPlayer.defense -= 2;
        }
        if (this.isOnIce(this.opponent)) {
            this.opponent.attack -= 2;
            this.opponent.defense -= 2;
        }
        const damage = attackRoll - defenseRoll;
        if (damage > 0) {
            this.opponent.life -= damage;
            if (this.opponent.life <= 0) {
                this.handleDefeat(this.opponent);
            }
        }
        this.lobbyService.attackAction(this.lobbyId, this.opponent, damage, this.opponent.life);
        this.lobbyService.changeTurnEnd(this.currentPlayer, this.opponent, this.playerTurn, this.gameState);
        this.subscribeChangeAttributes();
        this.subscribeToPlayerSwitch();
    }

    onFlee() {
        if (!this.gameState) return;

        if (this.currentPlayer.amountEscape === undefined) {
            this.currentPlayer.amountEscape = 0;
        }

        if (this.currentPlayer.amountEscape >= 2) {
            this.notificationService.showInfo('Vous avez déjà tenté de fuir 2 fois, vous ne pouvez plus fuir.');
            return;
        }

        const fleeingChance = Math.random();

        if (fleeingChance <= FLEE_RATE) {
            this.isFleeSuccess = true;
            this.lobbyService.fleeCombat(this.gameState.id, this.currentPlayer, this.isFleeSuccess);
        } else {
            this.isFleeSuccess = false;
            this.lobbyService.fleeCombat(this.gameState.id, this.currentPlayer, this.isFleeSuccess);
            this.lobbyService.changeTurnEnd(this.currentPlayer, this.opponent, this.playerTurn, this.gameState);
        }
    }

    private rollDice(player: Player, type: 'attack' | 'defense'): number {
        const diceType = player.bonus?.[type] === 'D4' ? 4 : 6;
        return Math.floor(Math.random() * diceType) + 1;
    }

    private isOnIce(player: Player): boolean {
        let tileType;
        const currentPlayerIndex = this.gameState?.players.findIndex((p) => p.id === player.id);
        if (currentPlayerIndex !== undefined && currentPlayerIndex !== -1) {
            const currentPlayerPositon = this.gameState?.playerPositions[currentPlayerIndex];
            if (this.gameState && currentPlayerPositon) {
                tileType = this.gameState.board[currentPlayerPositon.x][currentPlayerPositon.y] % 10;
            }
        }
        if (tileType === 3) {
            return true;
        }
        return false;
    }

    private handleDefeat(player: Player) {
        if (this.gameState) {
            this.lobbyService.handleDefeat(player, this.lobbyId);
        }
        this.subscribeToNewSpawnPoints();
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

    private subscribeToNewSpawnPoints() {
        this.lobbyService.newSpawnPoints().subscribe((data) => {
            const playerIndex = this.gameState?.players.findIndex((p) => p.id === data.player.id) ?? -1;
            if (playerIndex === -1) return;
            if (this.gameState && this.gameState.playerPositions) {
                this.gameState.playerPositions[playerIndex] = data.newSpawn;
            }
        });
    }

    private subscribeChangeAttributes() {
        this.lobbyService.updateHealth().subscribe((data) => {
            const opponent = this.gameState?.players.find((p) => p.id === data.player.id);
            if (opponent) {
                opponent.life = data.remainingHealth;
            }
        });

    }

    private subscribeToFleeFailure() {
        this.lobbyService.onFleeFailure().subscribe((data) => {
            if (this.currentPlayer.id === data.fleeingPlayer.id) {
                this.currentPlayer.amountEscape = data.fleeingPlayer.amountEscape;
            }

            this.notificationService.showInfo(`${data.fleeingPlayer.name} n'a pas réussi à fuir le combat.`);
        });
    }
}
