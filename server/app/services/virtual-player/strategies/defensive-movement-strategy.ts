import { Coordinates } from '@common/coordinates';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { MovementStrategy } from '@app/services/virtual-player/interfaces/movement-strategy';
import { DefaultMovementStrategy } from './default-movement-strategy';
import { ObjectsTypes } from '@common/game.interface';

export class DefensiveMovementStrategy implements MovementStrategy {
    constructor(private service: VirtualPlayerService) {}

    determineTarget(config: VirtualMovementConfig, availableMoves: Coordinates[], playerIndex: number): Coordinates {
        const { virtualPlayer } = config;
        const inventoryFull = virtualPlayer.items?.length >= 2;

        if (!inventoryFull) {
            const defensiveItems = [ObjectsTypes.POTION, ObjectsTypes.JUICE];
            const defensiveTarget = this.findReachableItemTarget(config, availableMoves, playerIndex, defensiveItems);
            if (defensiveTarget) {
                return defensiveTarget;
            }
        }

        if (!inventoryFull) {
            const otherItemTypes = this.getOtherItemTypes();
            const otherItemTarget = this.findReachableItemTarget(config, availableMoves, playerIndex, otherItemTypes);
            if (otherItemTarget) {
                return otherItemTarget;
            }
        }

        const awayFromOpponent = this.findMoveAwayFromOpponent(config, availableMoves, playerIndex);
        if (awayFromOpponent) {
            return awayFromOpponent;
        }

        return new DefaultMovementStrategy(this.service).determineTarget(config, availableMoves, playerIndex);
    }

    private findReachableItemTarget(
        config: VirtualMovementConfig,
        availableMoves: Coordinates[],
        playerIndex: number,
        itemTypes: ObjectsTypes[],
    ): Coordinates | null {
        const { gameState } = config;
        const currentPos = gameState.playerPositions[playerIndex];
        const nearestItemPos = this.service.findNearestItemTile(gameState, currentPos, itemTypes);

        if (nearestItemPos) {
            const isReachable = availableMoves.some((m) => m.x === nearestItemPos.x && m.y === nearestItemPos.y);
            if (isReachable) {
                return nearestItemPos;
            }
        }
        return null;
    }

    private findMoveAwayFromOpponent(config: VirtualMovementConfig, availableMoves: Coordinates[], playerIndex: number): Coordinates | null {
        const { gameState, virtualPlayer } = config;
        const currentPos = gameState.playerPositions[playerIndex];
        const nearestOpponent = this.service.getNearestOpponent(gameState, virtualPlayer, currentPos);
        if (!nearestOpponent) return null;

        let furthestMove = availableMoves[0];
        let maxDist = -1;
        for (const move of availableMoves) {
            const dist = this.service['distance'](move, nearestOpponent.pos);
            if (dist > maxDist) {
                maxDist = dist;
                furthestMove = move;
            }
        }
        const currentDist = this.service['distance'](currentPos, nearestOpponent.pos);
        if (maxDist >= currentDist || availableMoves.length === 1) {
            return furthestMove;
        }
        return null;
    }

    private getOtherItemTypes(): ObjectsTypes[] {
        return Object.values(ObjectsTypes).filter(
            (type) =>
                typeof type === 'number' &&
                ![ObjectsTypes.POTION, ObjectsTypes.JUICE, ObjectsTypes.EMPTY, ObjectsTypes.SPAWN, ObjectsTypes.RANDOM].includes(type),
        ) as ObjectsTypes[];
    }
}
