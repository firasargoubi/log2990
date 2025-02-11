import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ItemComponent } from '@app/components/item/item.component';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';

@Component({
    selector: 'app-objects',
    imports: [CommonModule, ItemComponent, DragDropModule],
    templateUrl: './objects.component.html',
    styleUrl: './objects.component.scss',
})
export class ObjectsComponent implements OnInit, OnDestroy {
    @Input() mapSize: 'small' | 'medium' | 'large';
    range: number[] = [];
    items: ItemComponent[] = [];
    counter$ = this.counterService.counter$;
    private subscriptions: Subscription[] = [];

    constructor(private counterService: ObjectCounterService) {
        const MAX_OBJECTS = 7;
        this.range = this.generateRange(0, MAX_OBJECTS);
    }

    ngOnInit(): void {
        this.resetComponent();
        this.subscriptions.push(
            this.counterService.counter$.subscribe((count) => {
                console.log('Counter updated:', count);
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    resetComponent(): void {
        this.items = [];
        this.counterService.initializeCounter(this.getInitialCounterValue());
    }

    generateRange(start: number, end: number): number[] {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    onItemAdded(item: ItemComponent) {
        this.items.push(item);
        console.log(item);
    }

    incrementCounter(item: ItemComponent) {
        this.counterService.incrementCounter(item.type);
    }

    drop(event: CdkDragDrop<ItemComponent[]>) {
        const draggedItem = event.previousContainer.data[event.previousIndex];
        if (event.previousContainer !== event.container) {
            draggedItem.isPlaced = false;
            event.previousContainer.data.pop();
            this.incrementCounter(draggedItem);
        }
    }

    private getInitialCounterValue(): number {
        switch (this.mapSize) {
            case 'small':
                return 2;
            case 'medium':
                return 4;
            case 'large':
                return 6;
            default:
                return 2;
        }
    }
}
