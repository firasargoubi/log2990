import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ItemComponent } from '@app/components/item/item.component';
import { TileTypes } from '@app/interfaces/tileTypes';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { DEFAULT_OBJECTS } from '@app/interfaces/default-objects';

@Component({
    selector: 'app-tile',
    imports: [CommonModule, CdkDropList, ItemComponent, CdkDrag],
    templateUrl: './tile.component.html',
    styleUrl: './tile.component.scss',
})
export class TileComponent implements OnInit {
    @Input() type: number;
    @Input() objectID: number;
    @Output() objectChanged = new EventEmitter<number>();
    @Output() objectMoved = new EventEmitter<boolean>();
    placedItem: ItemComponent[] = [];

    constructor(private counterService: ObjectCounterService) {}

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
            }
        }
    }

    refreshObject(): void {
        if (!this.placedItem.length) {
            this.objectChanged.emit(0);
        } else {
            this.objectChanged.emit(this.placedItem[0].type);
        }
    }

    getObjectById(id: number): ItemComponent | null {
        const objectData = DEFAULT_OBJECTS.find((obj) => obj.id === id);
        if (objectData) {
            const item = new ItemComponent();
            item.type = objectData.id;
            item.tooltipText = objectData.description;
            return item;
        }
        return null;
    }

    decrementCounter(item: ItemComponent) {
        if (item.type === 6) {
            item.spawnCounter--;
            if (item.spawnCounter === 0) {
                item.isPlaced = true;
            }
        } else if (item.type === 7) {
            item.randomCounter--;
            if (item.randomCounter === 0) {
                item.isPlaced = true;
            }
        } else {
            this.counterService.decrementCounter();
            item.isPlaced = true;
        }
    }

    drop(event: CdkDragDrop<ItemComponent[]>) {
        const draggedItem = event.previousContainer.data[event.previousIndex];
        console.log("ITEM BEING DRAGGED",draggedItem);
        if (event.previousContainer === event.container) {
            return;
        }
        if (this.type === TileTypes.DoorClosed || this.type === TileTypes.DoorOpen || this.type === TileTypes.Wall) {
            return;
        }
        if (this.placedItem.length === 0 && event.previousContainer.id !== 'cdk-drop-list-0') {
            this.placedItem.push(draggedItem);
            event.previousContainer.data.splice(0);
            this.objectMoved.emit(true);
        } else if (this.placedItem.length === 0 && !draggedItem.isPlaced && (draggedItem.type === 6 || draggedItem.type === 7)) {
            this.placedItem.push(draggedItem);
            this.decrementCounter(draggedItem);
            this.objectMoved.emit(true);
        }

        return;
    }
}
