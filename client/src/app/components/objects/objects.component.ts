import { Component, Input } from '@angular/core';
@Component({
    selector: 'app-objects',
    imports: [],
    templateUrl: './objects.component.html',
    styleUrl: './objects.component.scss',
})
export class ObjectsComponent {
    @Input() type: number;
    get name(): string {
        switch (this.type) {
            case 0:
                return 'Bottes magiques';
            case 1:
                return 'Épée magique';
            default:
                return 'erreur';
        }
    }
    get image(): string {
        switch (this.type) {
            case 0:
                return 'assets/boots.png';
            case 1:
                return 'assets/sword.png';
            case 2:
                return 'assets/water.png';
            case 3:
                return 'assets/ice2.png';
            default:
                return '';
        }
    }
}
