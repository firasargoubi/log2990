import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ItemComponent } from '@app/components/item/item.component';
import { GAME_IMAGES, ObjectsTypes } from '@app/Consts/app.constants';
import { DEFAULT_ITEMS } from '@app/interfaces/default-items';
import { TileTypes } from '@app/interfaces/tile-types';
import { ObjectCounterService } from '@app/services/objects-counter.service';
@Component({
    selector: 'app-tile',
    imports: [CommonModule, CdkDropList, CdkDrag],
    templateUrl: './tile.component.html',
    styleUrl: './tile.component.scss',
})
export class TileComponent implements OnInit {
    @Input() type: number;
    @Input() objectID: number = 0;
    @Output() objectChanged = new EventEmitter<number>();
    @Output() objectMoved = new EventEmitter<boolean>();
    count: number;
    placedItem: ItemComponent[] = [];

    constructor(private counterService: ObjectCounterService) {
        if (!this.objectID) {
            this.counterService.spawnCounter$.subscribe((value: number) => {
                this.count = value;
            });
        }
    }
    get baseImage(): string {
        switch (this.type) {
            case TileTypes.Grass:
                return GAME_IMAGES.grass;
            case TileTypes.Water:
                return GAME_IMAGES.water;
            case TileTypes.Ice:
                return GAME_IMAGES.ice;
            case TileTypes.Wall:
                return GAME_IMAGES.wall;
            case TileTypes.DoorClosed:
                return GAME_IMAGES.doorClosed;
            case TileTypes.DoorOpen:
                return GAME_IMAGES.doorOpen;
            default:
                return GAME_IMAGES.default;
        }
    }

    ngOnInit(): void {
        if (this.objectID !== 0) {
            const object = this.getObjectById(this.objectID);
            if (object) {
                this.placedItem.push(object);
                this.decrementCounter(object);
            }
        }
    }
    refreshObject(): void {
        if (!this.placedItem.length || !this.objectID) {
            this.objectChanged.emit(0);
        } else {
            this.objectChanged.emit(this.objectID);
        }
    }

    getObjectById(id: number): ItemComponent | null {
        const objectData = DEFAULT_ITEMS.find((obj) => obj.id === id);
        if (objectData) {
            this.objectID = id;
            const item = new ItemComponent(this.counterService);
            item.type = objectData.id;
            // Item component doesn't have tooltipText property
            return item;
        }
        return null;
    }

    deleteTile() {
        if (this.placedItem.length) {
            this.counterService.incrementCounter(this.placedItem[0].type);
            this.placedItem = [];
            this.objectID = 0;
            this.objectChanged.emit(0);
        }
    }

    decrementCounter(item: ItemComponent) {
        this.counterService.decrementCounter(item.type);
    }

    drop(event: CdkDragDrop<ItemComponent[]>) {
        const draggedItem = event.previousContainer.data[event.previousIndex];

        if (this.type === TileTypes.DoorClosed || this.type === TileTypes.DoorOpen || this.type === TileTypes.Wall) {
            return; // No changes if dragged to an illegal place
        }
        // If swapped with an empty tile, empty the old one and place the new one
        if (event.previousContainer.id !== 'objects-container' && !this.placedItem.length) {
            this.placedItem.push(draggedItem);
            event.previousContainer.data.splice(event.previousIndex, 1);
        } else if (!this.placedItem.length && this.count && draggedItem.type === ObjectsTypes.SPAWN) {
            this.placedItem.push(draggedItem);
            this.decrementCounter(draggedItem);
        }

        this.objectID = draggedItem.type;
        this.objectMoved.emit(true);
    }
}
