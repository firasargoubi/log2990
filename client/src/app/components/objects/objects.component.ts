import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { ItemComponent } from '@app/components/item/item.component';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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

    constructor(
        private counterService: ObjectCounterService,
        private router: Router,
    ) {
        const MAX_OBJECTS = 7;
        this.range = this.generateRange(0, MAX_OBJECTS);
        this.counterService.spawnCounter$.pipe(takeUntilDestroyed()).subscribe((value) => {
            if (value === 0) {
                this.items[ObjectsTypes.SPAWN].isPlaced = true;
            }
        });
    }

    ngOnInit(): void {
        this.resetComponent();
        this.subscriptions.push(
            this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
                this.resetComponent();
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    resetComponent(): void {
        // Ajouter des éléments à `items` ici
        this.items = [];
        for (let i = 0; i < this.range.length; i++) {
            const newItem = new ItemComponent(this.counterService);
            newItem.type = this.range[i];
            this.items.push(newItem);
        }
    }

    generateRange(start: number, end: number): number[] {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    onItemAdded(item: ItemComponent) {
        this.items.push(item);
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
}
