import { Injectable } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    currentTool: number = -1;

    private _toolSaved: number = 0;

    get toolSaved(): number {
        return this._toolSaved;
    }

    copyTileTool(type: number): void {
        this.currentTool = type;
    }

    modifyTile(tile: Tile): void {
        if (tile.object !== 0 && this.currentTool !== TileTypes.DoorClosed && this.currentTool !== TileTypes.DoorOpen) {
            return;
        }

        if (this.currentTool === TileTypes.DoorClosed || this.currentTool === TileTypes.DoorOpen) {
            if (tile.object !== 0) return;
            tile.type = tile.type === TileTypes.DoorClosed ? TileTypes.DoorOpen : TileTypes.DoorClosed;
        } else if (this.currentTool !== -1) {
            tile.type = this.currentTool;
        }
    }

    getToolSaved(): void {
        if (this._toolSaved === 0) return;
        this.currentTool = this._toolSaved;
        this._toolSaved = 0;
    }

    saveTool(): void {
        this._toolSaved = this.currentTool;
    }

    resetTool(): void {
        this.currentTool = -1;
        this._toolSaved = 0;
    }

    deleteTool(): void {
        this.currentTool = 0;
    }
}
