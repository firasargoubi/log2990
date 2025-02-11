import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ItemComponent } from '@app/components/item/item.component';
import { DEFAULT_OBJECTS } from '@app/interfaces/default-objects';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { TileTypes } from '@app/interfaces/tileTypes';
import { ObjectCounterService } from '@app/services/objects-counter.service';

@Component({
    selector: 'app-tile',
    imports: [CommonModule, CdkDropList, CdkDrag],
    templateUrl: './tile.component.html',
    styleUrl: './tile.component.scss',
})
export class TileComponent implements OnInit {
    @Input() type: number;
    @Input() objectID: number= 0;
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
                return 'assets/grass.png';
            case TileTypes.Water:
                return 'assets/water.png';
            case TileTypes.Ice:
                return 'assets/ice2.png';
            case TileTypes.Wall:
                return 'assets/wall.png';
            case TileTypes.DoorClosed:
                return 'assets/door_c.png';
            case TileTypes.DoorOpen:
                return 'assets/door_o.png';
            default:
                return 'assets/grass.png';
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
            console.log(this.objectID);
            this.objectChanged.emit(this.objectID);
        }
    }

    getObjectById(id: number): ItemComponent | null {
        const objectData = DEFAULT_OBJECTS.find((obj) => obj.id === id);
        if (objectData) {
            this.objectID = id;
            const item = new ItemComponent();
            item.type = objectData.id;
            item.tooltipText = objectData.description;
            return item;
        }
        return null;
    }

    decrementCounter(item: ItemComponent) {
        if (item.type === ObjectsTypes.SPAWN || item.type === ObjectsTypes.RANDOM) {
            this.counterService.decrementCounter(item.type);
            if (!this.count) {
                item.isPlaced = true;
            }
        } else {
            this.counterService.decrementCounter(item.type);
            item.isPlaced = true;
        }
    }

    drop(event: CdkDragDrop<ItemComponent[]>) {
        const draggedItem = event.previousContainer.data[event.previousIndex];

        if (event.previousContainer === event.container) {
            return; // No changes if dragged to the same place
        }

        if (this.type === TileTypes.DoorClosed || this.type === TileTypes.DoorOpen || this.type === TileTypes.Wall) {
            return; // No changes if dragged to an illegal place
        }

        if (event.previousContainer.id !== 'cdk-drop-list-0') {
            console.log('ITEM BEING DRAGGED - 1', draggedItem);
            this.placedItem.push(draggedItem);
            event.previousContainer.data.splice(event.previousIndex, 1);
        } else if (
            this.placedItem.length === 0 &&
            !draggedItem.isPlaced &&
            (draggedItem.type === ObjectsTypes.SPAWN || draggedItem.type === ObjectsTypes.RANDOM)
        ) {
            console.log('ITEM BEING DRAGGED - 2', draggedItem);
            this.placedItem.push(draggedItem);
            this.decrementCounter(draggedItem);
        }
        this.objectID = draggedItem.type;
        console.log(this);
        this.objectMoved.emit(true);
    }
}
