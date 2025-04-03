import { GameState } from '@common/game-state';
import { ITEM_EFFECTS, ObjectsTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Service } from 'typedi';
import { PathfindingService } from './pathfinding.service';

@Service()
export class ItemService {
    constructor(private pathFindingService: PathfindingService) {}
    applyEffect(player: Player, item: ObjectsTypes): void {
        const effect = ITEM_EFFECTS[item];
        if (!effect) return;

        if (effect.attack !== undefined) player.attack = Math.max(0, player.attack + effect.attack);
        if (effect.defense !== undefined) player.defense = Math.max(0, player.defense + effect.defense);
        if (effect.speed !== undefined) player.speed = Math.max(0, player.speed + effect.speed);
        if (effect.life !== undefined) player.life = Math.min(player.maxLife, player.life + effect.life);
    }

    dropItems(loserIndex: number, gameState: GameState): void {
        const playerCoordinates = gameState.playerPositions[loserIndex];
        const player = gameState.players[loserIndex];
        for (const item of player.items) {
            const tileCoordinate = this.pathFindingService.findClosestAvailableSpot(gameState, playerCoordinates);
            gameState.board[tileCoordinate.x][tileCoordinate.y] += item * 10;
            player.items = player.items.filter((i) => i !== item);
        }
    }

    applyPotionEffect(attacker: Player, defender: Player): void {
        if (defender.life - attacker.life >= 3 && attacker.items?.includes(ObjectsTypes.POTION)) {
            defender.life -= 1;
        }
    }

    applyJuiceEffect(defender: Player): void {
        if (defender.life === 1 && defender.items?.includes(ObjectsTypes.JUICE)) {
            defender.life = Math.min(defender.life + 3, defender.maxLife);
        }
    }
}
