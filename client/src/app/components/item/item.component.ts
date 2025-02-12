import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GAME_IMAGES, OBJECT_NAMES, OBJECTS_DESCRIPTION } from '@app/Consts/app.constants';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { ObjectCounterService } from '@app/services/objects-counter.service';

@Component({
    selector: 'app-item',
    imports: [CdkDrag, CommonModule, MatTooltipModule],
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
})
export class ItemComponent implements OnInit {
    @Input() type: number;
    objectsTypes = ObjectsTypes;
    isPlaced: boolean = false;
    tooltipText: string | null = null;
    spawnCounter: number;
    randomCounter: number;
    objectCounterService: ObjectCounterService;

    descriptions: { [key: string]: string } = {
        [ObjectsTypes.BOOTS]: OBJECTS_DESCRIPTION.boots,
        [ObjectsTypes.SWORD]: OBJECTS_DESCRIPTION.sword,
        [ObjectsTypes.POTION]: OBJECTS_DESCRIPTION.potion,
        [ObjectsTypes.WAND]: OBJECTS_DESCRIPTION.wand,
        [ObjectsTypes.CRYSTAL]: OBJECTS_DESCRIPTION.crystal,
        [ObjectsTypes.JUICE]: OBJECTS_DESCRIPTION.berryJuice,
        [ObjectsTypes.SPAWN]: OBJECTS_DESCRIPTION.vortex,
        [ObjectsTypes.RANDOM]: OBJECTS_DESCRIPTION.gnome,
    };

    constructor(objectCounterService: ObjectCounterService) {
        this.objectCounterService = objectCounterService;
        if (this.type === ObjectsTypes.SPAWN) {
            this.objectCounterService.spawnCounter$.subscribe((count) => {
                this.spawnCounter = count;
            });
        }
        if (this.type === ObjectsTypes.RANDOM) {
            this.objectCounterService.counter$.subscribe((count) => {
                this.spawnCounter = count;
            });
        }
    }

    get image(): string {
        switch (this.type) {
            case ObjectsTypes.BOOTS:
                return GAME_IMAGES.boots;
            case ObjectsTypes.SWORD:
                return GAME_IMAGES.sword;
            case ObjectsTypes.POTION:
                return GAME_IMAGES.potion;
            case ObjectsTypes.WAND:
                return GAME_IMAGES.wand;
            case ObjectsTypes.CRYSTAL:
                return GAME_IMAGES.crystalBall;
            case ObjectsTypes.JUICE:
                return GAME_IMAGES.berryJuice;
            case ObjectsTypes.SPAWN:
                return GAME_IMAGES.vortex;
            case ObjectsTypes.RANDOM:
                return GAME_IMAGES.gnome;
            default:
                return GAME_IMAGES.undefined;
        }
    }

    get name(): string {
        switch (this.type) {
            case ObjectsTypes.BOOTS:
                return OBJECT_NAMES.boots;
            case ObjectsTypes.SWORD:
                return OBJECT_NAMES.sword;
            case ObjectsTypes.POTION:
                return OBJECT_NAMES.potion;
            case ObjectsTypes.WAND:
                return OBJECT_NAMES.wand;
            case ObjectsTypes.CRYSTAL:
                return OBJECT_NAMES.crystalBall;
            case ObjectsTypes.JUICE:
                return OBJECT_NAMES.berryJuice;
            case ObjectsTypes.SPAWN:
                return OBJECT_NAMES.vortex;
            case ObjectsTypes.RANDOM:
                return OBJECT_NAMES.gnome;
            default:
                return OBJECT_NAMES.undefined;
        }
    }

    ngOnInit(): void {
        if (this.type === ObjectsTypes.SPAWN) {
            this.objectCounterService.spawnCounter$.pipe().subscribe((value) => {
                this.spawnCounter = value;
                if (value <= 0) {
                    this.isPlaced = true;
                } else {
                    this.isPlaced = false;
                }
            });
        }
    }
}
