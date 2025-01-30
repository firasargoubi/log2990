import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TileComponent } from '@app/components/tile/tile.component';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tileTypes';
import { TileService } from '@app/services/tile.service';

@Component({
    selector: 'app-tile-options',
    imports: [TileComponent, CommonModule],
    templateUrl: './tile-options.component.html',
    styleUrl: './tile-options.component.scss',
})
export class TileOptionsComponent implements OnInit {
    options: Tile[] = [];

    tileService = inject(TileService);

    get tiles(): Tile[] {
        return this.options;
    }

    ngOnInit(): void {
        this.initializeOptions();
    }

    initializeOptions(): void {
        this.options = [];
        const MAX_TILE = 6;
        for (let i = 1; i <= MAX_TILE; i++) {
            if (i !== TileTypes.DoorOpen) this.options.push({ type: i, x: i, y: 0, id: `${i}` });
        }
    }

    selectTileOption(tile: Tile): void {
        this.tileService.copyTileTool(tile.type);
        this.setAllTilesUnselected();
        tile.selected = true;
    }

    setAllTilesUnselected(): void {
        this.options.forEach((tile) => (tile.selected = false));
    }
}
