import { itemConstants } from '@app/constants/item-const';
import { GameState } from '@common/game-state';
import { ITEM_EFFECTS, ObjectsTypes, TILE_DELIMITER } from '@common/game.interface';
import { Player } from '@common/player';
import { Service } from 'typedi';
import { PathfindingService } from './pathfinding.service';

@Service()
export class ItemService {
    constructor(private pathFindingService: PathfindingService) {}
    applyAttributeEffects(player: Player, item: ObjectsTypes): void {
        const effect = this.getEffect(item);
        if (!effect) return;

        if (effect.attack !== undefined) player.attack = Math.max(0, player.attack + effect.attack);
        if (effect.defense !== undefined) player.defense = Math.max(0, player.defense + effect.defense);
        if (effect.speed !== undefined) player.speed = Math.max(0, player.speed + effect.speed);
        if (effect.life !== undefined) player.life = Math.min(player.maxLife, player.life + effect.life);
    }
    removeAttributeEffects(player: Player, item: ObjectsTypes): void {
        const effect = this.getEffect(item);
        if (!effect) return;

        if (effect.attack !== undefined) player.attack = Math.max(0, player.attack - effect.attack);
        if (effect.defense !== undefined) player.defense = Math.max(0, player.defense - effect.defense);
        if (effect.speed !== undefined) player.speed = Math.max(0, player.speed - effect.speed);
        if (effect.life !== undefined) player.life = Math.max(0, player.life - effect.life);
    }

    dropItems(loserIndex: number, gameState: GameState): void {
        const playerCoordinates = gameState.playerPositions[loserIndex];
        const player = gameState.players[loserIndex];
        const itemsToDrop = player.items ? [...player.items] : [];

        for (const item of itemsToDrop) {
            const tileCoordinate = this.pathFindingService.findClosestAvailableSpot(gameState, playerCoordinates);
            if (tileCoordinate && tileCoordinate.x !== -1 && tileCoordinate.y !== -1) {
                gameState.board[tileCoordinate.x][tileCoordinate.y] += item * itemConstants.itemDropMultiplier;
            }
        }
    }

    applyPotionEffect(attacker: Player, defender: Player): void {
        if (defender.life - attacker.life >= itemConstants.maxLifeDifferenceForPotion && attacker.items?.includes(ObjectsTypes.POTION)) {
            defender.life = Math.max(defender.life - itemConstants.potionDamage, itemConstants.minAttributeValue);
        }
    }

    applyJuiceEffect(defender: Player): void {
        if (defender.life === 1 && defender.items?.includes(ObjectsTypes.JUICE)) {
            defender.life = Math.min(defender.life + itemConstants.juiceHealAmount, defender.maxLife);
        }
    }

    randomizeItem(gameState: GameState): void {
        const randomObjects: { x: number; y: number }[] = [];
        let objectsTypes = [ObjectsTypes.BOOTS, ObjectsTypes.SWORD, ObjectsTypes.POTION, ObjectsTypes.WAND, ObjectsTypes.JUICE, ObjectsTypes.CRYSTAL];

        gameState.board.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const objectValue = Math.floor(tile / TILE_DELIMITER);
                if (objectsTypes.includes(objectValue)) {
                    objectsTypes = objectsTypes.filter((obj) => obj !== objectValue);
                }
                if (objectValue === ObjectsTypes.RANDOM) {
                    randomObjects.push({ x: rowIndex, y: colIndex });
                }
            });
        });

        randomObjects.forEach((tile) => {
            try {
                const randomIndex = Math.floor(Math.random() * objectsTypes.length);
                const tileType = gameState.board[tile.x][tile.y] % TILE_DELIMITER;
                gameState.board[tile.x][tile.y] = objectsTypes[randomIndex] * TILE_DELIMITER + tileType;
                objectsTypes.splice(randomIndex, 1);
            } catch (error) {
                throw new Error(`Failed to randomize tile at (${tile.x}, ${tile.y}): ${error}`);
            }
        });
    }

    private getEffect(item: ObjectsTypes) {
        return ITEM_EFFECTS[item] ?? null;
    }
}
