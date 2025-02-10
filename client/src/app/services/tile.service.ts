import { Injectable } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tileTypes';
@Injectable({
    providedIn: 'root',
})
export class TileService {
    currentTool: number = -1;

    copyTileTool(type: number) {
        this.currentTool = type;
    }

    modifyTile(tile: Tile) {
        if (this.currentTool === TileTypes.DoorClosed || this.currentTool === TileTypes.DoorOpen) {
            tile.type = tile.type === TileTypes.DoorClosed ? TileTypes.DoorOpen : TileTypes.DoorClosed;
        } else if (this.currentTool) {
            tile.type = this.currentTool;
        }
    }
}
