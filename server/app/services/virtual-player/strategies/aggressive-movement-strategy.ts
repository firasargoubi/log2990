import { Coordinates } from '@common/coordinates';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { MovementStrategy } from '@app/services/virtual-player/interfaces/movement-strategy';
import { DefaultMovementStrategy } from './default-movement-strategy';
import { ObjectsTypes } from '@common/game.interface';

export class AggressiveMovementStrategy implements MovementStrategy {
    constructor(private service: VirtualPlayerService) {}

    determineTarget(config: VirtualMovementConfig, availableMoves: Coordinates[], playerIndex: number): Coordinates {
        const { gameState, virtualPlayer } = config;
        const currentPos = gameState.playerPositions[playerIndex];

        const nearestOpponent = this.service.getNearestOpponent(gameState, virtualPlayer, currentPos);
        const opponentDistance = nearestOpponent ? this.service['distance'](currentPos, nearestOpponent.pos) : Infinity;

        const relevantItems = [ObjectsTypes.SWORD, ObjectsTypes.BOOTS];
        const nearestItemPos = this.service.findNearestItemTile(gameState, currentPos, relevantItems);
        const itemDistance = nearestItemPos ? this.service['distance'](currentPos, nearestItemPos) : Infinity;

        let primaryTargetPos: Coordinates | null = null;

        if (itemDistance < opponentDistance) {
            primaryTargetPos = nearestItemPos;
        } else if (opponentDistance !== Infinity) {
            primaryTargetPos = nearestOpponent?.pos;
        } else if (itemDistance !== Infinity) {
            primaryTargetPos = nearestItemPos;
        }

        if (primaryTargetPos) {
            return this.service.getClosest(primaryTargetPos, availableMoves);
        }

        return new DefaultMovementStrategy(this.service).determineTarget(config, availableMoves, playerIndex);
    }
}
