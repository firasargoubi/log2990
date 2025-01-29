import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemComponent } from '@app/components/item/item.component';

@Component({
    selector: 'app-objects',
    imports: [CommonModule, ItemComponent],
    templateUrl: './objects.component.html',
    styleUrl: './objects.component.scss',
})
export class ObjectsComponent {
    range: number[] = [];

    constructor() {
        this.range = this.generateRange(0, 7);
    }

    generateRange(start: number, end: number): number[] {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
}
