import { Injectable } from '@angular/core';
import { TileTypes } from '@app/interfaces/tile-types';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';

@Injectable({
    providedIn: 'root',
})
export class ActionService {
    gameState: GameState | null = null;

    getCurrentPlayerCoordinates(player: Player): { x: number; y: number } | undefined {
        const playerIndex = this.gameState?.players.findIndex((p) => p.id === player.id) || -1;
        if (playerIndex === -1) {
            return;
        }
        return this.gameState?.playerPositions[playerIndex];
    }

    isPlayerOnTile(tile: Tile): boolean {
        const isPlayerOnTile = this.gameState?.players.some((player) => {
            const coordinates = this.getCurrentPlayerCoordinates(player);
            return coordinates?.x === tile.x && coordinates?.y === tile.y;
        });
        return isPlayerOnTile || false;
    }

    findOpponent(tile: Tile): Player | undefined {
        return this.gameState?.players.find((player) => {
            const coordinates = this.getCurrentPlayerCoordinates(player);
            return coordinates?.x === tile.x && coordinates?.y === tile.y;
        });
    }
    isTileNextToPlayer(tile: Tile): boolean {
        if (!this.gameState) {
            return false;
        }
        const currentPlayer = this.gameState.players.find((player) => player.id === this.gameState?.currentPlayer);
        if (!currentPlayer) {
            return false;
        }
        const currentPlayerCoordinates = this.getCurrentPlayerCoordinates(currentPlayer);
        if (!currentPlayerCoordinates) {
            return false;
        }
        const isTileNextToPlayer = Math.abs(currentPlayerCoordinates.x - tile.x) <= 1 && Math.abs(currentPlayerCoordinates.y - tile.y) <= 1;
        return isTileNextToPlayer;
    }

    getActionType(tile: Tile, gameState: GameState): string | undefined {
        this.gameState = gameState;
        if (this.isTileNextToPlayer(tile)) {
            if (tile.type === TileTypes.DoorClosed) {
                return 'openDoor';
            }
            if (tile.type === TileTypes.DoorOpen) {
                return 'closeDoor';
            } else {
                if (this.isPlayerOnTile(tile)) {
                    return 'battle';
                } else {
                    return;
                }
            }
        }
        return;
    }
}
