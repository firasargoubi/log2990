import { Injectable } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    /** The currently selected tool type */
    currentTool: number = -1;

    /** Saved tool type when temporarily changing tools */
    private _toolSaved: number = 0;

    /** Get the saved tool value */
    get toolSaved(): number {
        return this._toolSaved;
    }

    /**
     * Set the current tool to the specified type
     * @param type The tool type to select
     */
    copyTileTool(type: number): void {
        this.currentTool = type;
    }

    /**
     * Modify a tile based on the current tool
     * @param tile The tile to modify
     */
    modifyTile(tile: Tile): void {
        // Don't modify tiles with objects (except for door toggling)
        if (tile.object !== 0 && this.currentTool !== TileTypes.DoorClosed && this.currentTool !== TileTypes.DoorOpen) {
            return;
        }

        // Toggle door state
        if (this.currentTool === TileTypes.DoorClosed || this.currentTool === TileTypes.DoorOpen) {
            if (tile.object !== 0) return;
            tile.type = tile.type === TileTypes.DoorClosed ? TileTypes.DoorOpen : TileTypes.DoorClosed;
        }
        // Apply current tool if it's valid
        else if (this.currentTool !== -1) {
            tile.type = this.currentTool;
        }
    }

    /**
     * Restore the saved tool
     */
    getToolSaved(): void {
        if (this._toolSaved === 0) return;
        this.currentTool = this._toolSaved;
        this._toolSaved = 0;
    }

    /**
     * Save the current tool for later restoration
     */
    saveTool(): void {
        this._toolSaved = this.currentTool;
    }

    /**
     * Reset the tool to default (no tool selected)
     */
    resetTool(): void {
        this.currentTool = -1;
        this._toolSaved = 0;
    }

    /**
     * Set tool to erase mode
     */
    deleteTool(): void {
        this.currentTool = 0;
    }
}
