import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TileComponent } from '@app/components/tile/tile.component';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/Consts/app.constants';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TileService } from '@app/services/tile.service';

@Component({
    selector: 'app-tile-options',
    imports: [TileComponent, CommonModule, MatTooltipModule],
    templateUrl: './tile-options.component.html',
    styleUrl: './tile-options.component.scss',
})
export class TileOptionsComponent implements OnInit {
    options: Tile[] = [];
    descriptions: { [key: string]: string } = {
        [TileTypes.Water]: "L'eau minimise les mouvements",
        [TileTypes.Ice]: 'Attention la glace est très glissante',
        [TileTypes.DoorClosed]: 'Une porte peut être ouverte!.',
        [TileTypes.Wall]: 'Un mur empêce tous les mouvements.',
    };

    private tileService = inject(TileService);

    get tiles(): Tile[] {
        return this.options;
    }

    ngOnInit(): void {
        this.initializeOptions();
    }

    private initializeOptions(): void {
        this.options = [];
        const MAX_TILE = 6;
        for (let i = TileTypes.Water; i <= MAX_TILE; i++) {
            if (i !== TileTypes.DoorOpen)
                this.options.push({
                    type: i,
                    object: 0,
                    x: i,
                    y: 0,
                    id: `${i}`,
                });
        }
    }

    selectTileOption(tile: Tile): void {
        if (tile.selected) {
            this.tileService.copyTileTool(-1);
            this.setAllTilesUnselected();
        } else {
            this.tileService.copyTileTool(tile.type);
            this.setAllTilesUnselected();
            tile.selected = true;
        }
    }

    private setAllTilesUnselected(): void {
        this.options.forEach((tile) => (tile.selected = false));
    }
}
