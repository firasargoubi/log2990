import { Coordinates } from '@common/coordinates';
import { VirtualPlayerService } from '@app/services/virtual-player.service';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { MovementStrategy } from '@app/services/virtual-player/interfaces/movement-strategy';

export class DefaultMovementStrategy implements MovementStrategy {
    constructor(private service: VirtualPlayerService) {}

    determineTarget(config: VirtualMovementConfig, availableMoves: Coordinates[], playerIndex: number): Coordinates {
        const { gameState } = config;
        const spawn = gameState.spawnPoints[playerIndex];
        return this.service['getClosest'](spawn, availableMoves);
    }
}
