import { Component, Input } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';

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
                return 'assets/objects/boots.png';
            case '1':
                return 'assets/objects/sword.png';
            case '2':
                return 'assets/objects/potion.png';
            case '3':
                return 'assets/objects/wand.png';
            case '4':
                return 'assets/objects/crystal_ball.png';
            case '5':
                return 'assets/objects/berry-juice.png';
            case '6':
                return 'assets/objects/vortex.png';
            case '7':
                return 'assets/objects/gnome.png';
            default:
                return 'Undefined';
        }
    }
}
