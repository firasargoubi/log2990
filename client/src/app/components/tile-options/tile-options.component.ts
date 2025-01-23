import { Component, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TileComponent } from '@app/components/tile/tile.component';
import { Tile } from '@app/interfaces/tile';
import { EventEmitter } from '@angular/core';

@Component({
    selector: 'app-tile-options',
    imports: [TileComponent, CommonModule],
    templateUrl: './tile-options.component.html',
    styleUrl: './tile-options.component.scss',
})
export class TileOptionsComponent {
    options: Tile[] = [];
    @Output() toolSelected = new EventEmitter<number>(); // Emit selected tool to parent

    get tiles(): Tile[] {
        return this.options;
    }

    ngOnInit(): void {
        this.initializeOptions();
    }

    initializeOptions(): void {
        this.options = [];
        let u: number = 0;
        for (let i = 0; i < 4; i++) {
            this.options.push({ type: u, x: i, y: 0, id: `${i}` });
            u++;
        }
    }

    selectTileOption(type: number): void {
        this.toolSelected.emit(type); // Notify parent about the selected tool
    }
}
