import { Component, inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';

const TO_SECONDS = 1000;
const BASE_COUNTDOWN = 5;
const LOWERED_COUNTDOWN = 3;
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
    isPlayerTurn = false;
    playerTurn = '';
    countDown = 0;
    canAct = false;
    canEscape = true;
    isFleeSuccess = false;
    combatEnded = false;
    attackDice = 0;
    defenceDice = 0;
    attackDisplay = '';
    defenceDisplay = '';
    damage = 0;
    isAttacker = false;
    private lobbyService = inject(LobbyService);
    private subscriptions: Subscription[] = [];

    private countDownInterval: ReturnType<typeof setInterval> | null = null;
    private notificationService = inject(NotificationService);

    ngOnInit() {
        this.setupSubscriptions();
        if (this.currentPlayer.id !== this.gameState?.currentPlayer) {
            this.playerTurn = this.gameState?.currentPlayer || '';
            this.isPlayerTurn = false;
            this.canAct = false;
        } else {
            this.canAct = true;
        }

        this.countDown = BASE_COUNTDOWN;
        this.startCountdown();
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
        this.stopCombatCountdown();

        if (this.combatEnded) return;

        this.countDownInterval = setInterval(() => {
            if (this.countDown > 0) {
                this.countDown--;
            } else {
                if (this.canAct) {
                    this.onAttack();
                }
                this.stopCombatCountdown();
            }
        }, TO_SECONDS);
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
            this.notificationService.showInfo('Vous avez déjà tenté de fuir 2 fois, vous ne pouvez plus fuir.');
            this.countDown = LOWERED_COUNTDOWN;
            return;
        }

        this.stopCombatCountdown();
        this.lobbyService.flee(this.gameState.id, this.currentPlayer);
    }

    isCountdownActive(): boolean {
        return this.countDownInterval !== null;
    }

    private stopCombatCountdown() {
        if (this.countDownInterval !== null) {
            clearInterval(this.countDownInterval);
            this.countDownInterval = null;
        }
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
                this.countDown = this.canEscape ? BASE_COUNTDOWN : LOWERED_COUNTDOWN;
                this.startCountdown();
            }),

            this.lobbyService.onFleeFailure().subscribe((data) => {
                if (this.currentPlayer.id === data.fleeingPlayer.id) {
                    this.currentPlayer.amountEscape = data.fleeingPlayer.amountEscape;
                    this.canEscape = (this.currentPlayer.amountEscape ?? 0) < 2;

                    if (!this.canEscape) {
                        this.notificationService.showInfo('Vous avez déjà tenté de fuir 2 fois, vous ne pouvez plus fuir.');
                    }

                    this.canAct = false;
                } else {
                    this.canAct = true;
                }
                this.countDown = this.canEscape ? BASE_COUNTDOWN : LOWERED_COUNTDOWN;
                this.startCountdown();

                this.notificationService.showInfo(`${data.fleeingPlayer.name} n'a pas réussi à fuir le combat.`);
            }),
        );
    }
}
