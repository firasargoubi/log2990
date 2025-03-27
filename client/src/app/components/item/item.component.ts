import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GAME_IMAGES, OBJECT_NAMES, OBJECTS_DESCRIPTION, ObjectsTypes } from '@app/Consts/app.constants';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-item',
    imports: [CdkDrag, CommonModule, MatTooltipModule],
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
})
export class ItemComponent implements OnInit, OnDestroy {
    @Input() type: number;
    @Input() isPlaced: boolean = false;

    objectsTypes = ObjectsTypes;
    private subscriptions: Subscription[] = [];

    constructor(public objectCounterService: ObjectCounterService) {}

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

    get description(): string {
        switch (this.type) {
            case ObjectsTypes.BOOTS:
                return OBJECTS_DESCRIPTION.boots;
            case ObjectsTypes.SWORD:
                return OBJECTS_DESCRIPTION.sword;
            case ObjectsTypes.POTION:
                return OBJECTS_DESCRIPTION.potion;
            case ObjectsTypes.WAND:
                return OBJECTS_DESCRIPTION.wand;
            case ObjectsTypes.CRYSTAL:
                return OBJECTS_DESCRIPTION.crystal;
            case ObjectsTypes.JUICE:
                return OBJECTS_DESCRIPTION.berryJuice;
            case ObjectsTypes.SPAWN:
                return OBJECTS_DESCRIPTION.vortex;
            case ObjectsTypes.RANDOM:
                return OBJECTS_DESCRIPTION.gnome;
            default:
                return OBJECTS_DESCRIPTION.undefined;
        }
    }

    ngOnInit(): void {
        if (this.type === ObjectsTypes.SPAWN) {
            const subscription = this.objectCounterService.spawnCounter$.subscribe((value) => {
                if (value <= 0) {
                    this.isPlaced = true;
                } else {
                    this.isPlaced = false;
                }
            });
            this.subscriptions.push(subscription);
        } else {
            const subscription = this.objectCounterService.itemCounter$.subscribe((value) => {
                if (value <= 0) {
                    this.isPlaced = true;
                } else {
                    this.isPlaced = false;
                }
            });
            this.subscriptions.push(subscription);
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
