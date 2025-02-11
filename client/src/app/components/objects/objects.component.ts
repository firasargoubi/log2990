import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ItemComponent } from '@app/components/item/item.component';
import { ObjectCounterService } from '@app/services/objects-counter.service';

@Component({
    selector: 'app-objects',
    imports: [CommonModule, ItemComponent, DragDropModule],
    templateUrl: './objects.component.html',
    styleUrl: './objects.component.scss',
})
export class ObjectsComponent {
    @Input() mapSize: 'small' | 'medium' | 'large';
    range: number[] = [];
    tooltipText: string | null = null;
    items: ItemComponent[] = [];
    counter$ = this.counterService.counter$;

    constructor(private counterService: ObjectCounterService) {
        const MAX_OBJECTS = 7;
        this.range = this.generateRange(0, MAX_OBJECTS);
    }

    generateRange(start: number, end: number): number[] {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    onItemAdded(item: ItemComponent) {
        this.items.push(item);
    }

    incrementCounter(item: ItemComponent) {
        if (item.type === '6') {
            item.spawnCounter++;
        } else if (item.type === '7') {
            item.randomCounter++;
        } else {
            this.counterService.incrementCounter();
        }
    }

    drop(event: CdkDragDrop<ItemComponent[]>) {
        const draggedItem = event.previousContainer.data[event.previousIndex];
        if (event.previousContainer !== event.container) {
            draggedItem.isPlaced = false;
            event.previousContainer.data.pop();
            this.incrementCounter(draggedItem);
        }
    }
}
