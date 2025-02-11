import { Component, Input } from '@angular/core';
import { TileTypes } from '@app/interfaces/tileTypes';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GAME_IMAGES } from '@app/Consts/app.constants';
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
                return GAME_IMAGES.grass;
            case TileTypes.Water:
                return GAME_IMAGES.water;
            case TileTypes.Ice:
                return GAME_IMAGES.ice;
            case TileTypes.Wall:
                return GAME_IMAGES.wall;
            case TileTypes.DoorClosed:
                return GAME_IMAGES.doorClosed;
            case TileTypes.DoorOpen:
                return GAME_IMAGES.doorOpen;
            default:
                return GAME_IMAGES.default;
        }
    }
}
