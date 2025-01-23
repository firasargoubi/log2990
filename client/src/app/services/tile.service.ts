import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    currentTool: number = -1;

    copyTileTool(type: number) {
        this.currentTool = type;
    }
}
