import { Coordinates } from '@common/coordinates';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { MovementStrategy } from '@app/services/virtual-player/interfaces/movement-strategy';
import { DefaultMovementStrategy } from './default-movement-strategy';
import { ObjectsTypes } from '@common/game.interface';

export class AggressiveMovementStrategy implements MovementStrategy {
    constructor(private service: VirtualPlayerService) {}

    determineTarget(config: VirtualMovementConfig, availableMoves: Coordinates[], playerIndex: number): Coordinates {
        const { virtualPlayer } = config;
        const inventoryFull = virtualPlayer.items?.length >= 2;

        const opponentTarget = this.findReachableOpponentTarget(config, availableMoves, playerIndex);
        if (opponentTarget) {
            return opponentTarget;
        }

        if (!inventoryFull) {
            const desiredItems = [ObjectsTypes.SWORD, ObjectsTypes.BOOTS, ObjectsTypes.CRYSTAL];
            const desiredItemTarget = this.findReachableItemTarget(config, availableMoves, playerIndex, desiredItems);
            if (desiredItemTarget) {
                return desiredItemTarget;
            }
        }

        if (!inventoryFull) {
            const otherItemTypes = this.getOtherItemTypes();
            const otherItemTarget = this.findReachableItemTarget(config, availableMoves, playerIndex, otherItemTypes);
            if (otherItemTarget) {
                return otherItemTarget;
            }
        }

        const moveTowardsTarget = this.determinePrimaryTargetAndMove(config, availableMoves, playerIndex, inventoryFull);
        if (moveTowardsTarget) {
            return moveTowardsTarget;
        }

        return new DefaultMovementStrategy(this.service).determineTarget(config, availableMoves, playerIndex);
    }

    private findReachableOpponentTarget(config: VirtualMovementConfig, availableMoves: Coordinates[], playerIndex: number): Coordinates | null {
        const { gameState, virtualPlayer } = config;
        const currentPos = gameState.playerPositions[playerIndex];
        const nearestOpponent = this.service.getNearestOpponent(gameState, virtualPlayer, currentPos);

        if (!nearestOpponent) {
            return null;
        }

        const isOpponentReachable = availableMoves.some((move) => move.x === nearestOpponent.pos.x && move.y === nearestOpponent.pos.y);
        if (isOpponentReachable) {
            return nearestOpponent.pos;
        }

        const adjacentToOpponent = this.service.getAdjacentPositions(nearestOpponent.pos, gameState.board);
        const reachableAdjacent = availableMoves.filter((move) => adjacentToOpponent.some((adj) => adj.x === move.x && adj.y === move.y));
        if (reachableAdjacent.length > 0) {
            return this.service.getClosest(nearestOpponent.pos, reachableAdjacent);
        }

        return null;
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
            const isItemReachable = availableMoves.some((move) => move.x === nearestItemPos.x && move.y === nearestItemPos.y);
            if (isItemReachable) {
                return nearestItemPos;
            }
        }
        return null;
    }

    private determinePrimaryTargetAndMove(
        config: VirtualMovementConfig,
        availableMoves: Coordinates[],
        playerIndex: number,
        inventoryFull: boolean,
    ): Coordinates | null {
        const { gameState, virtualPlayer } = config;
        const currentPos = gameState.playerPositions[playerIndex];

        const nearestOpponent = this.service.getNearestOpponent(gameState, virtualPlayer, currentPos);
        const desiredItems = [ObjectsTypes.SWORD, ObjectsTypes.BOOTS, ObjectsTypes.CRYSTAL];
        const nearestDesiredItemPos = inventoryFull ? null : this.service.findNearestItemTile(gameState, currentPos, desiredItems);
        const otherItemTypes = inventoryFull ? [] : this.getOtherItemTypes();
        const nearestOtherItemPos = inventoryFull ? null : this.service.findNearestItemTile(gameState, currentPos, otherItemTypes);

        const opponentDistance = nearestOpponent ? this.service['distance'](currentPos, nearestOpponent.pos) : Infinity;
        const desiredItemDistance = nearestDesiredItemPos ? this.service['distance'](currentPos, nearestDesiredItemPos) : Infinity;
        const otherItemDistance = nearestOtherItemPos ? this.service['distance'](currentPos, nearestOtherItemPos) : Infinity;

        let primaryTargetPos: Coordinates | null = null;
        if (opponentDistance !== Infinity && opponentDistance <= desiredItemDistance && opponentDistance <= otherItemDistance) {
            primaryTargetPos = nearestOpponent?.pos;
        } else if (desiredItemDistance !== Infinity && desiredItemDistance <= otherItemDistance) {
            primaryTargetPos = nearestDesiredItemPos;
        } else if (otherItemDistance !== Infinity) {
            primaryTargetPos = nearestOtherItemPos;
        } else if (opponentDistance !== Infinity) {
            primaryTargetPos = nearestOpponent?.pos;
        }

        if (primaryTargetPos) {
            return this.service.getClosest(primaryTargetPos, availableMoves);
        }

        return null;
    }

    private getOtherItemTypes(): ObjectsTypes[] {
        return Object.values(ObjectsTypes).filter(
            (type) =>
                typeof type === 'number' &&
                ![ObjectsTypes.SWORD, ObjectsTypes.BOOTS, ObjectsTypes.CRYSTAL, ObjectsTypes.EMPTY, ObjectsTypes.SPAWN, ObjectsTypes.RANDOM].includes(
                    type,
                ),
        ) as ObjectsTypes[];
    }
}
