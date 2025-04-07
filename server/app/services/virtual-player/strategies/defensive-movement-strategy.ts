import { Coordinates } from '@common/coordinates';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { MovementStrategy } from '@app/services/virtual-player/interfaces/movement-strategy';
import { DefaultMovementStrategy } from './default-movement-strategy';

export class DefensiveMovementStrategy implements MovementStrategy {
    constructor(private service: VirtualPlayerService) {}

    determineTarget(config: VirtualMovementConfig, availableMoves: Coordinates[], playerIndex: number): Coordinates {
        const { gameState, virtualPlayer } = config;
        const currentPos = gameState.playerPositions[playerIndex];
        const nearestOpponent = this.service.getNearestOpponent(gameState, virtualPlayer, currentPos);

        if (nearestOpponent) {
            let furthestMove = availableMoves[0];
            let maxDistance = -1;

            for (const move of availableMoves) {
                const dist = this.service['distance'](move, nearestOpponent.pos);
                if (dist > maxDistance) {
                    maxDistance = dist;
                    furthestMove = move;
                }
            }
            return furthestMove;
        }

        return new DefaultMovementStrategy(this.service).determineTarget(config, availableMoves, playerIndex);
    }
}
