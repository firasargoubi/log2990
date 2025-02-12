import { Injectable } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tileTypes';
@Injectable({
    providedIn: 'root',
})
export class TileService {
    currentTool: number = 0;
    toolSaved: number = 0;

    copyTileTool(type: number) {
        this.currentTool = type;
    }

    modifyTile(tile: Tile) {
        if (this.currentTool === TileTypes.DoorClosed || this.currentTool === TileTypes.DoorOpen) {
            if (tile.object !== 0) return;
            tile.type = tile.type === TileTypes.DoorClosed ? TileTypes.DoorOpen : TileTypes.DoorClosed;
        } else if (this.currentTool !== -1) {
            if (tile.object !== 0 && this.currentTool === TileTypes.Wall) return;
            tile.type = this.currentTool;
        }
    }

    getToolSaved() {
        if (this.toolSaved) {
            this.currentTool = this.toolSaved;
            this.toolSaved = 0;
        }
    }
}
