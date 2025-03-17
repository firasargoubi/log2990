import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { ItemComponent } from '@app/components/item/item.component';
import { MAX_OBJECTS, ObjectsTypes } from '@app/Consts/app.constants';
import { ItemModel } from '@app/interfaces/item.model';
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
    @Input() mapSize: string;
    range: number[] = [];
    items: ItemModel[] = [];
    private subscriptions: Subscription[] = [];

    constructor(
        private counterService: ObjectCounterService,
        private router: Router,
    ) {
        this.range = this.generateRange(0, MAX_OBJECTS);
        this.counterService.spawnCounter$.pipe(takeUntilDestroyed()).subscribe((value) => {
            if (value === 0) {
                const spawnItem = this.items.find((item) => item.type === ObjectsTypes.SPAWN);
                if (spawnItem) {
                    spawnItem.isPlaced = true;
                }
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

    drop(event: CdkDragDrop<ItemModel[]>): void {
        const draggedItem = event.previousContainer.data[event.previousIndex];
        if (event.previousContainer !== event.container) {
            draggedItem.isPlaced = false;
            event.previousContainer.data.splice(event.previousIndex, 1);
            this.incrementCounter(draggedItem);
        }
    }

    private resetComponent(): void {
        this.items = [];
        for (const type of this.range) {
            const newItem = new ItemModel(type);
            this.items.push(newItem);
        }
    }

    private generateRange(start: number, end: number): number[] {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    private incrementCounter(item: ItemModel): void {
        this.counterService.incrementCounter(item.type);
    }
}
