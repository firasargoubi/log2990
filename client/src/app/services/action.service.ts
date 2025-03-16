import { Injectable } from '@angular/core';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { TileTypes } from '@common/game.interface';

@Injectable({
    providedIn: 'root',
})
export class ActionService {
    gameState: GameState;

    getCurrentPlayerCoordinates(player: string): { x: number; y: number } | undefined {
        const playerIndex = this.gameState.players.findIndex((p) => p.id === player);
        console.log(playerIndex);
        console.log(this.gameState.playerPositions);
        console.log(this.gameState.players);
        if (playerIndex === -1) {
            return;
        }
        return this.gameState.playerPositions[playerIndex];
    }

    isPlayerOnTile(tile: Tile): boolean {
        const isPlayerOnTile = this.gameState?.players.some((player) => {
            const coordinates = this.getCurrentPlayerCoordinates(player.id);
            return coordinates?.x === tile.x && coordinates?.y === tile.y;
        });
        return isPlayerOnTile || false;
    }

    findOpponent(tile: Tile): Player | undefined {
        return this.gameState?.players.find((player) => {
            const coordinates = this.getCurrentPlayerCoordinates(player.id);
            return coordinates?.x === tile.x && coordinates?.y === tile.y;
        });
    }
    isTileNextToPlayer(tile: Tile): boolean {
        if (!this.gameState) {
            return false;
        }
        const currentPlayerCoordinates = this.getCurrentPlayerCoordinates(this.gameState.currentPlayer);
        console.log(currentPlayerCoordinates);
        console.log(tile);
        if (!currentPlayerCoordinates) {
            return false;
        }
        const isTileNextToPlayer = Math.abs(currentPlayerCoordinates.x - tile.x) <= 1 && Math.abs(currentPlayerCoordinates.y - tile.y) <= 1;
        return isTileNextToPlayer;
    }

    getActionType(tile: Tile, gameState: GameState): string | undefined {
        this.gameState = gameState;
        if (this.isTileNextToPlayer(tile)) {
            if (this.isPlayerOnTile(tile)) {
                return 'battle';
            }
            if (tile.type === TileTypes.DoorClosed) {
                return 'openDoor';
            }
            if (tile.type === TileTypes.DoorOpen) {
                return 'closeDoor';
            }
        }
        return;
    }
}
