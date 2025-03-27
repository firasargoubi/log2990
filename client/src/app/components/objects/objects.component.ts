import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { ItemComponent } from '@app/components/item/item.component';
import { ItemModel } from '@app/interfaces/item.model';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { GameType, ObjectsTypes } from '@common/game.interface';
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
    @Input() gameMode: GameType;
    range: number[] = [];
    items: ItemModel[] = [];
    private subscriptions: Subscription[] = [];

    constructor(
        private counterService: ObjectCounterService,
        private router: Router,
    ) {
        this.range = this.generateRange(1);
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
        console.log(this.items);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    drop(event: CdkDragDrop<ItemModel[]>): void {
        const draggedItem = event.previousContainer.data[event.previousIndex];
        console.log(draggedItem);
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

    private generateRange(start: number): number[] {
        let rangeEnd = 8;

        if (this.gameMode === GameType.capture) {
            rangeEnd = 9;
        }

        return Array.from({ length: rangeEnd - start + 1 }, (_, i) => start + i);
    }

    private incrementCounter(item: ItemModel): void {
        this.counterService.incrementCounter(item.type);
    }
}
