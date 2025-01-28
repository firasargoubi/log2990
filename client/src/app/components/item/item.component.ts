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
                return '';
            case '3':
                return '';
            case '4':
                return '';
            case '5':
                return '';
            case '6':
                return '';
            case '7':
                return 'Drapeau';
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
                return 'assets/water.png';
            case '3':
                return 'assets/ice2.png';
            default:
                return 'Undefined';
        }
    }
}
