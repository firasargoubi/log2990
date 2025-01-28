import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-item',
    imports: [],
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
                return 'Portail';
            case '7':
                return 'Gnome';
            default:
                return 'Undefined';
        }
    }

    get image(): string {
        switch (this.type) {
            case '0':
                return 'assets/boots.png';
            case '1':
                return 'assets/sword.png';
            case '2':
                return 'assets/potion.png';
            case '3':
                return 'assets/wand.png';
            case '4':
                return 'assets/crystal_ball.png';
            case '5':
                return 'assets/berry-juice.png';
            case '6':
                return 'assets/vortex.png';
            case '7':
                return 'assets/gnome.png';
            default:
                return 'Undefined';
        }
    }
}
