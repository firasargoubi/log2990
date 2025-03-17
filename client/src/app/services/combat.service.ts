// combat.service.ts
import { Injectable } from '@angular/core';
import { Player } from '@common/player';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    private currentPlayer!: Player;
    private opponent!: Player;

    setPlayers(currentPlayer: Player, opponent: Player) {
        this.currentPlayer = currentPlayer;
        this.opponent = opponent;
    }

    performAttack() {
        const attackValue = this.currentPlayer.attack + this.rollDice();
        const defenseValue = this.opponent.defense + this.rollDice();

        if (attackValue - defenseValue > 0) {
            this.opponent.health -= attackValue - defenseValue;
        }
    }

    performEscape() {
        const escapeChance = Math.random();
        if (escapeChance <= 0.3) {
            // Évasion réussie
            this.resetHealth();
        } else {
            // Évasion ratée
            this.switchTurn();
        }
    }

    private rollDice(): number {
        return Math.floor(Math.random() * 6) + 1; // D6
    }

    private resetHealth() {
        this.currentPlayer.health = this.currentPlayer.maxHealth;
        this.opponent.health = this.opponent.maxHealth;
    }

    private switchTurn() {
        [this.currentPlayer, this.opponent] = [this.opponent, this.currentPlayer];
    }
}
