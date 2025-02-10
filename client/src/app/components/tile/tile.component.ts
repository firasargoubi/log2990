import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ItemComponent } from '@app/components/item/item.component';
import { TileTypes } from '@app/interfaces/tileTypes';
import { ObjectCounterService } from '@app/services/objects-counter.service';

@Component({
    selector: 'app-tile',
    imports: [CommonModule, CdkDropList, ItemComponent, CdkDrag],
    templateUrl: './tile.component.html',
    styleUrl: './tile.component.scss',
})

// TODO : Ajouter une logique separee pour les cases du plateau et de la barre d'outil
export class TileComponent {
    @Input() type: number;
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

    decrementCounter(item: ItemComponent) {
        if (item.type === '6') {
            item.spawnCounter--;
            if (item.spawnCounter === 0) {
                item.isPlaced = true;
            }
        } else if (item.type === '7') {
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

        if (event.previousContainer === event.container) {
            return;
        }
        if (this.type === TileTypes.DoorClosed || this.type === TileTypes.DoorOpen || this.type === TileTypes.Wall) {
            return;
        }
        if (event.previousContainer.id !== 'cdk-drop-list-0') {
            this.placedItem.push(draggedItem);
            event.previousContainer.data.splice(0);
        } else if (this.placedItem.length === 0 && !draggedItem.isPlaced && this.counterService.getCounter() > 0) {
            this.placedItem.push(draggedItem);
            this.decrementCounter(draggedItem);
        }

        return;
    }
}
