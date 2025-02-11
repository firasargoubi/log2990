import { Component, Input } from '@angular/core';
import { TileTypes } from '@app/interfaces/tileTypes';
import { DragDropModule } from '@angular/cdk/drag-drop';
@Component({
    selector: 'app-tile',
    imports: [DragDropModule],
    template: '<div class = "tile" ><img [src] = "image" ></div>',
    styleUrl: './tile.component.scss',
})

// TODO : Ajouter une logique separee pour les cases du plateau et de la barre d'outil
export class TileComponent {
    @Input() type: number;

    get image(): string {
        switch (this.type) {
            case TileTypes.Grass:
                return 'assets/tiles/grass.png';
            case TileTypes.Water:
                return 'assets/tiles/water.png';
            case TileTypes.Ice:
                return 'assets/tiles/ice2.png';
            case TileTypes.Wall:
                return 'assets/tiles/wall.png';
            case TileTypes.DoorClosed:
                return 'assets/tiles/door_c.png';
            case TileTypes.DoorOpen:
                return 'assets/tiles/door_o.png';
            default:
                return 'assets/tiles/grass.png';
        }
    }
}
