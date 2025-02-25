import { Injectable } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';
@Injectable({
    providedIn: 'root',
})
export class TileService {
    currentTool: number = -1;
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
        if (this.toolSaved === 0) return;
        this.currentTool = this.toolSaved;
        this.toolSaved = 0;
    }

    saveTool() {
        this.toolSaved = this.currentTool;
    }

    resetTool() {
        this.currentTool = -1;
    }

    deleteTool() {
        this.currentTool = 0;
    }
}
