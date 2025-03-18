import { Injectable } from '@angular/core';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { TileTypes } from '@common/game.interface';

const DICE_FOUR = 4;
const DICE_SIX = 6;
const DECIMAL_FIND_TYPE = 10;
@Injectable({
    providedIn: 'root',
})
export class CombatService {
    rollDice(player: Player, type: 'attack' | 'defense'): number {
        const diceType = player.bonus?.[type] === 'D4' ? DICE_FOUR : DICE_SIX;
        return Math.floor(Math.random() * diceType) + 1;
    }

    isOnIce(player: Player, gameState: GameState): boolean {
        let tileType;
        const currentPlayerIndex = gameState?.players.findIndex((p) => p.id === player.id);
        if (currentPlayerIndex !== undefined && currentPlayerIndex !== -1) {
            const currentPlayerPositon = gameState?.playerPositions[currentPlayerIndex];
            if (gameState && currentPlayerPositon) {
                tileType = gameState.board[currentPlayerPositon.x][currentPlayerPositon.y] % DECIMAL_FIND_TYPE;
            }
        }
        if (tileType === TileTypes.Ice) {
            return true;
        }
        return false;
    }
}
