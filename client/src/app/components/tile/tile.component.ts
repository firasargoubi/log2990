import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DEFAULT_OBJECTS } from '@app/interfaces/default-objects';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { TileTypes } from '@app/interfaces/tileTypes';
import { ObjectCounterService } from '@app/services/objects-counter.service';

class ItemData {
    type: number;
    tooltipText: string | null = null;
    isPlaced: boolean = false;

    constructor(type: number, tooltipText: string | null = null) {
        this.type = type;
        this.tooltipText = tooltipText;
    }
}

@Component({
    selector: 'app-tile',
    imports: [CommonModule, CdkDropList, CdkDrag],
    templateUrl: './tile.component.html',
    styleUrls: ['./tile.component.scss'],
})
export class TileComponent implements OnInit {
    @Input() type: number;
    @Input() objectID: number = 0;
    @Output() objectChanged = new EventEmitter<number>();
    @Output() objectMoved = new EventEmitter<boolean>();
    @Output() removeObject = new EventEmitter<void>();
    count: number;
    objectImage: string = '';
    isInitialObject: boolean = false;
    isDragging: boolean = false;
    private _itemData: ItemData | null = null;

    constructor(private counterService: ObjectCounterService) {
        if (!this.objectID) {
            this.counterService.spawnCounter$.subscribe((value: number) => {
                this.count = value;
            });
        }
    }

    get itemData(): ItemData | null {
        if (!this._itemData && this.objectID !== 0) {
            this._itemData = this.createItemData(this.objectID);
        }
        return this._itemData;
    }

    get tileData(): ItemData[] {
        if (this.isDragging || !this.itemData) {
            return [];
        }
        return [this.itemData];
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
            this.initializeObject();
        }
    }

    drop(event: CdkDragDrop<ItemData[]>) {
        if (
            event.previousContainer === event.container ||
            this.type === TileTypes.DoorClosed ||
            this.type === TileTypes.DoorOpen ||
            this.type === TileTypes.Wall ||
            this._itemData !== null
        ) {
            return;
        }
    
        const draggedItem = event.previousContainer.data[event.previousIndex];
        if (!draggedItem) return;
    
        // Supprimer l'objet de la tuile source
        if (event.previousContainer.id.startsWith('tile-')) {
            this.removeObject.emit();
        }
    
        // Mettre à jour la nouvelle tuile avec l’objet déplacé
        this.setObjectImage(draggedItem.type);
        this.objectID = draggedItem.type;
        this._itemData = draggedItem;
        this.counterService.decrementCounter(draggedItem.type);
        if (!this.count) draggedItem.isPlaced = true;
        this.objectMoved.emit(true);
        this.isDragging = false;
    }

    dragStarted(): void {
        this.isDragging = true;
    }

    dragEnded(event: any): void {
        this.isDragging = false;
    }

    clearTile(): void {
        this.objectID = 0;
        this.objectImage = '';
        this._itemData = null;
    }

    refreshObject() {
        this.objectChanged.emit(this.objectID);
    }

    private initializeObject(): void {
        const objectData = DEFAULT_OBJECTS.find((obj) => obj.id === this.objectID);
        if (objectData) {
            this.isInitialObject = true;
            this.setObjectImage(objectData.id);
            this._itemData = this.createItemData(objectData.id);
            this.objectMoved.emit(true);
        }
    }

    private createItemData(id: number): ItemData {
        const description = DEFAULT_OBJECTS.find((obj) => obj.id === id)?.description || '';
        return new ItemData(id, description);
    }

    private setObjectImage(type: number): void {
        switch (type) {
            case ObjectsTypes.BOOTS:
                this.objectImage = 'assets/boots.png';
                break;
            case ObjectsTypes.SWORD:
                this.objectImage = 'assets/sword.png';
                break;
            case ObjectsTypes.POTION:
                this.objectImage = 'assets/potion.png';
                break;
            case ObjectsTypes.WAND:
                this.objectImage = 'assets/wand.png';
                break;
            case ObjectsTypes.CRYSTAL:
                this.objectImage = 'assets/crystal_ball.png';
                break;
            case ObjectsTypes.JUICE:
                this.objectImage = 'assets/berry-juice.png';
                break;
            case ObjectsTypes.SPAWN:
                this.objectImage = 'assets/vortex.png';
                break;
            case ObjectsTypes.RANDOM:
                this.objectImage = 'assets/gnome.png';
                break;
            default:
                this.objectImage = 'assets/transparent.png';
        }
    }
}
