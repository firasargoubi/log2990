import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/consts/item-constants';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { ObjectsTypes } from '@common/game.interface';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-item',
    imports: [CdkDrag, CommonModule, MatTooltipModule],
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
})
export class ItemComponent implements OnInit, OnDestroy {
    @Input() type: number;
    isPlaced: boolean = false;

    objectsTypes = ObjectsTypes;
    uniqueCounter = 1;
    spawnCounter = 0;
    itemCounter = 0;
    private subscriptions: Subscription[] = [];

    constructor(public objectCounterService: ObjectCounterService) {}

    get image(): string {
        return ITEM_INFOS[this.type]?.image ?? UNKNOWN_ITEM.image;
    }

    get name(): string {
        return ITEM_INFOS[this.type]?.name ?? UNKNOWN_ITEM.name;
    }

    get description(): string {
        return ITEM_INFOS[this.type]?.description ?? UNKNOWN_ITEM.description;
    }

    ngOnInit(): void {
        if (this.type === ObjectsTypes.SPAWN) {
            const subscription = this.objectCounterService.spawnCounter$.subscribe((value) => {
                this.spawnCounter = value;
                this.isPlaced = value > 0 ? false : true;
            });
            this.subscriptions.push(subscription);
        } else if (this.type === ObjectsTypes.FLAG) {
            this.subscriptions.push(
                this.objectCounterService.flagPlaced$.subscribe((placed) => {
                    this.isPlaced = placed;
                }),
            );
        } else if (this.type === ObjectsTypes.RANDOM) {
            this.subscriptions.push(
                this.objectCounterService.itemCounter$.subscribe((value) => {
                    this.itemCounter = value;
                    this.isPlaced = value > 0 ? false : true;
                }),
            );
        } else {
            this.subscriptions.push(
                this.objectCounterService.itemCounter$.subscribe(() => {
                    this.updateIsPlaced();
                }),
            );
            this.updateIsPlaced();
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    private updateIsPlaced(): void {
        if (this.type !== ObjectsTypes.SPAWN && this.type !== ObjectsTypes.FLAG) {
            const isThisItemPlaced = this.objectCounterService.isItemPlaced(this.type);
            const maxItemsPlaced = this.objectCounterService.getItemCounter() <= 0;
            this.isPlaced = isThisItemPlaced || maxItemsPlaced;
        }
    }
}
