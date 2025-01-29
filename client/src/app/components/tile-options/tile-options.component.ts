import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TileComponent } from '@app/components/tile/tile.component';
import { Tile } from '@app/interfaces/tile';
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

        for (let i = 1; i < 6; i++) {
            this.options.push({ type: i, x: i, y: 0, id: `${i}` });
        }
    }

    selectTileOption(type: number): void {
        this.tileService.copyTileTool(type); // Notify parent about the selected tool
    }
}
