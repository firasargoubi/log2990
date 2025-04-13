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
    @Input() gameMode!: GameType;
    items: ItemModel[] = [];
    private range: number[] = [];
    private subscriptions: Subscription[] = [];

    constructor(
        private counterService: ObjectCounterService,
        private router: Router,
    ) {
        this.counterService.spawnCounter$.pipe(takeUntilDestroyed()).subscribe((value) => {
            if (value === 0) {
                const spawnItem = this.items.find((item) => item.type === ObjectsTypes.Spawn);
                if (spawnItem) {
                    spawnItem.isPlaced = true;
                }
            }
        });
    }

    ngOnInit(): void {
        this.range = this.generateRange();
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
            this.incrementCounter(draggedItem);
            event.previousContainer.data.splice(event.previousIndex, 1);
        }
    }

    private resetComponent(): void {
        this.items = [];
        for (const type of this.range) {
            const newItem = new ItemModel(type);
            this.items.push(newItem);
        }
    }

    private generateRange(): number[] {
        let rangeEnd = 8;
        if (this.gameMode === GameType.Capture) {
            rangeEnd++;
        }

        return Array.from({ length: rangeEnd }, (_, i) => 1 + i);
    }

    private incrementCounter(item: ItemModel): void {
        this.counterService.incrementCounter(item.type);
    }
}
