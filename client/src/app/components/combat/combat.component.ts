import { Component, inject, Input, OnChanges, OnInit } from '@angular/core';
import { CombatService } from '@app/services/combat.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';

// const TO_SECONDS = 1000;
const FLEE_RATE = 30;
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
    combatEnded: boolean = false;
    attackDice: number;
    defenceDice: number;
    attackDisplay: string = '';
    defenceDisplay: string = '';
    damage: number;
    private lobbyService = inject(LobbyService);
    private countDownInterval: ReturnType<typeof setInterval> | null = null;
    private notificationService = inject(NotificationService);
    private combatService = inject(CombatService);

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
        if (!this.gameState) return;
        this.attackDice = this.combatService.rollDice(this.currentPlayer, 'attack');
        this.defenceDice = this.combatService.rollDice(this.opponent, 'defense');
        const attackRoll = this.attackDice + this.currentPlayer.attack;
        const defenseRoll = this.defenceDice + this.opponent.defense;
        this.attackDisplay = `Résultat du dé d'attaque: ${this.attackDice}`;
        this.defenceDisplay = `Résultat du dé de défense: ${this.defenceDice}`;
        if (this.combatService.isOnIce(this.currentPlayer, this.gameState)) {
            this.currentPlayer.attack -= 2;
            this.currentPlayer.defense -= 2;
        }
        if (this.combatService.isOnIce(this.opponent, this.gameState)) {
            this.opponent.attack -= 2;
            this.opponent.defense -= 2;
        }
        this.damage = attackRoll - defenseRoll;
        if (this.damage > 0) {
            this.opponent.life -= this.damage;
            if (this.opponent.life <= 0) {
                this.handleDefeat(this.opponent);
            }
        }
        this.lobbyService.attackAction(this.lobbyId, this.opponent, this.damage, this.opponent.life);
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
                this.lobbyService.terminateAttack(this.lobbyId);
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
