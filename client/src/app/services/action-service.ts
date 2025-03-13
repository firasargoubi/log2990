import { Inject, Injectable } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { MouseService } from './mouse.service';

@Injectable({
    providedIn: 'root',
})
export class ActionService {
    @Inject(MouseService) mouseService: MouseService;
    gameState: GameState | null = null;

    getCurrentPlayerCoordinates(player: Player): { x: number; y: number } | undefined {
        console.log('Get current player coordinates');
        console.log('Player:', player);
        console.log('Player coordinate:', this.gameState?.playerPositions.get(player.id));
        return this.gameState?.playerPositions.get(player.id);
    }

    isPlayerOnTile(tile: Tile): boolean {
        console.log('Is player on tile:', tile);
        const isPlayerOnTile = this.gameState?.players.some((player) => {
            const coordinates = this.getCurrentPlayerCoordinates(player);
            console.log('Player coordinates:', coordinates);
            return coordinates?.x === tile.x && coordinates?.y === tile.y;
        });
        console.log('Is player on tile:', isPlayerOnTile);
        return isPlayerOnTile || false;
    }

    isTileNextToPlayer(tile: Tile): boolean {
        console.log('Is tile next to player:', tile);
        console.log('Game state:', this.gameState);
        if (!this.gameState) {
            return false;
        }
        const currentPlayer = this.gameState.players.find((player) => player.id === this.gameState?.currentPlayer);
        console.log('Current player:', currentPlayer);
        if (!currentPlayer) {
            return false;
        }
        const currentPlayerCoordinates = this.getCurrentPlayerCoordinates(currentPlayer);
        console.log('Current player coordinates:', currentPlayerCoordinates);
        if (!currentPlayerCoordinates) {
            return false;
        }
        const isTileNextToPlayer = Math.abs(currentPlayerCoordinates.x - tile.x) <= 1 && Math.abs(currentPlayerCoordinates.y - tile.y) <= 1;
        console.log('Is tile next to player:', isTileNextToPlayer);
        return isTileNextToPlayer;
    }

    getActionType(tile: Tile, gameState: GameState): string | undefined {
        this.gameState = gameState;
        if (this.isTileNextToPlayer(tile)) {
            if (tile.type === TileTypes.DoorClosed) {
                console.log('Gonna open door');
                return 'openDoor';
            }
            if (tile.type === TileTypes.DoorOpen) {
                console.log('Gonna close door');

                return 'closeDoor';
            } else {
                if (this.isPlayerOnTile(tile)) {
                    console.log('Gonna start battle');

                    return 'battle';
                } else {
                    console.log('Gonna do nothing');

                    return;
                }
            }
        }
        return;
    }
}
