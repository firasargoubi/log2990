import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-tile',
    imports: [],
    template: '<div class = "tile"><img [src] = "image" ></div>',
    styleUrl: './tile.component.scss',
})

// TODO : Ajouter une logique separee pour les cases du plateau et de la barre d'outil
export class TileComponent {
    @Input() type: number;

    get image(): string {
        switch (this.type) {
            case 0:
                return 'assets/grass.png';
            case 1:
                return 'assets/mud.png';
            default:
                return 'assets/grass.png';
        }
    }
}
