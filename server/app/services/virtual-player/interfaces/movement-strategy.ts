import { Coordinates } from '@common/coordinates';
import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';

export interface MovementStrategy {
    determineTarget(config: VirtualMovementConfig, availableMoves: Coordinates[], playerIndex: number): Coordinates;
}
