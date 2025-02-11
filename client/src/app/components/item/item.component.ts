import { Component, Input } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GAME_IMAGES } from '@app/Consts/app.constants';

@Component({
    selector: 'app-item',
    imports: [DragDropModule],
    templateUrl: './item.component.html',
    styleUrl: './item.component.scss',
})
export class ItemComponent {
    @Input() type = '';

    get name(): string {
        switch (this.type) {
            case '0':
                return 'Bottes magiques';
            case '1':
                return 'Épée tranchante';
            case '2':
                return 'Potion du temps';
            case '3':
                return 'Baguette magique';
            case '4':
                return 'Boule de crystal';
            case '5':
                return 'Médecine';
            case '6':
                return 'Point de départ';
            case '7':
                return 'Gnome mystère';
            default:
                return 'Undefined';
        }
    }

    get image(): string {
        switch (this.type) {
            case '0':
                return GAME_IMAGES.boots;
            case '1':
                return GAME_IMAGES.sword;
            case '2':
                return GAME_IMAGES.potion;
            case '3':
                return GAME_IMAGES.wand;
            case '4':
                return GAME_IMAGES.crystalBall;
            case '5':
                return GAME_IMAGES.berryJuice;
            case '6':
                return GAME_IMAGES.vortex;
            case '7':
                return GAME_IMAGES.gnome;
            default:
                return GAME_IMAGES.undefined;
        }
    }
}
