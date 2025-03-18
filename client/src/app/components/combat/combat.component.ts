import { Component, inject, Input, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';

const TO_SECONDS = 1000;
@Component({
    selector: 'app-combat',
    templateUrl: './combat.component.html',
    styleUrls: ['./combat.component.scss'],
})
export class CombatComponent implements OnInit, OnChanges, OnDestroy {
    @Input() currentPlayer!: Player;
    @Input() lobbyId!: string;
    @Input() gameState: GameState | null = null;
    @Input() opponent!: Player;
    isPlayerTurn: boolean = false;
    playerTurn: string = '';
    countDown: number = 0;
    canAct: boolean = false;
    canEscape: boolean = true;
    isFleeSuccess: boolean = false;
    combatEnded: boolean = false;
    attackDice: number;
    defenceDice: number;
    attackDisplay: string = '';
    defenceDisplay: string = '';
    damage: number;
    isAttacker: boolean = false;
    combatState: 'waiting' | 'attacking' | 'defending' | 'ended' = 'waiting';
    private lobbyService = inject(LobbyService);
    private subscriptions: Subscription[] = [];

    private countDownInterval: ReturnType<typeof setInterval> | null = null;
    private notificationService = inject(NotificationService);

    ngOnInit() {
        if (this.gameState) {
            this.lobbyService.handleAttack(this.currentPlayer, this.opponent, this.lobbyId, this.gameState);
        }
        this.setupSubscriptions();
    }

    ngOnChanges() {
        if (!this.currentPlayer) {
            this.currentPlayer = this.gameState?.players.find((p) => p.id === this.playerTurn) ?? this.currentPlayer;
        }

        if (!this.opponent) {
            this.opponent = this.gameState?.players.find((p) => p.id !== this.currentPlayer.id) ?? this.opponent;
        }
    }

    ngOnDestroy() {
        this.stopCombatCountdown();
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    startCountdown() {
        this.stopCombatCountdown(); // Always clear existing timer first

        this.countDownInterval = setInterval(() => {
            if (this.countDown > 0) {
                this.countDown--;
                // Emit current time to server to keep clients in sync
                this.lobbyService.updateCombatTime(this.countDown);
            } else {
                // Auto-attack or end turn when time runs out
                if (this.canAct) {
                    this.onAttack();
                }
                this.stopCombatCountdown();
            }
        }, TO_SECONDS);
    }

    stopCombatCountdown() {
        if (this.countDownInterval !== null) {
            clearInterval(this.countDownInterval);
            this.countDownInterval = null;
        }
    }

    endTimer() {
        if (this.gameState) {
            this.onAttack();
        }
        if (this.countDownInterval !== null) {
            clearInterval(this.countDownInterval);
            this.countDownInterval = null;
        }
    }

    onAttack() {
        if (!this.gameState || !this.canAct) return;
        this.stopCombatCountdown();
        this.lobbyService.attack(this.lobbyId, this.currentPlayer, this.opponent);
    }

    onFlee() {
        if (!this.gameState || !this.canAct) return;

        this.currentPlayer.amountEscape = this.currentPlayer.amountEscape ?? 0;

        if (this.currentPlayer.amountEscape >= 2) {
            this.canEscape = false;
        }

        if (this.currentPlayer.amountEscape >= 2) {
            this.notificationService.showInfo('Vous avez déjà tenté de fuir 2 fois, vous ne pouvez plus fuir.');
            return;
        }

        // Arrêter le compte à rebours et tenter de fuir
        this.stopCombatCountdown();
        this.lobbyService.flee(this.gameState.id, this.currentPlayer, false);
    }

    private setupSubscriptions() {
        this.subscriptions.push(
            this.lobbyService.onAttackResult().subscribe((data) => {
                this.attackDice = data.attackRoll;
                this.defenceDice = data.defenseRoll;
                this.attackDisplay = `Résultat du dé d'attaque: ${data.attackRoll}`;
                this.defenceDisplay = `Résultat du dé de défense: ${data.defenseRoll}`;
                this.damage = data.damage;
                if (this.currentPlayer.id === data.attacker.id) {
                    this.currentPlayer = data.attacker;
                    this.opponent = data.defender;
                    this.canAct = false;
                } else {
                    this.currentPlayer = data.defender;
                    this.opponent = data.attacker;
                    this.canAct = true;
                }
                this.countDown = 5;
                this.startCountdown();
            }),
        );
        this.subscriptions.push(
            this.lobbyService.onStartCombat().subscribe((data) => {
                this.currentPlayer.amountEscape = 0;
                this.canEscape = true;
                if (this.currentPlayer.id !== data.firstPlayer.id) {
                    this.playerTurn = data.firstPlayer.id;
                    this.isPlayerTurn = false;
                }
                this.countDown = 5;
                this.canAct = data.firstPlayer.id === this.currentPlayer.id;
                this.startCountdown();
            }),
        );
        this.subscriptions.push(
            this.lobbyService.onGameEnded().subscribe(() => {
                this.notificationService.showInfo('La partie est terminée!');
            }),
        );

        this.subscriptions.push(
            this.lobbyService.onFleeFailure().subscribe((data) => {
                if (this.currentPlayer.id === data.fleeingPlayer.id) {
                    this.currentPlayer.amountEscape = data.fleeingPlayer.amountEscape;
                    this.canEscape = (this.currentPlayer.amountEscape ?? 0) < 2;
                }
                this.countDown = 5;
                this.canAct = data.fleeingPlayer.id !== this.currentPlayer.id;
                this.startCountdown();
                this.notificationService.showInfo(`${data.fleeingPlayer.name} n'a pas réussi à fuir le combat.`);
            }),
        );
    }
}
