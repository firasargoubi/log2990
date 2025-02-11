import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { GAME_IMAGES } from '@app/Consts/app.constants';

@Component({
    selector: 'app-item',
    imports: [CdkDrag, CommonModule, MatTooltipModule],
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
})
export class ItemComponent implements OnInit {
    @Input() type: number;
    @Output() itemAdded = new EventEmitter<ItemComponent>();
    isPlaced: boolean = false;
    tooltipText: string | null = null;
    spawnCounter: number = 0;
    objectCounterService: ObjectCounterService;

    descriptions: { [key: string]: string } = {
        [ObjectsTypes.BOOTS]: 'Les bottes magiques vous permettront de vous déplacer à une vitesse SUPERSONIQUE!',
        [ObjectsTypes.SWORD]: 'Cette épée effectue plus de dégats sur vos ennemis!',
        [ObjectsTypes.POTION]: 'Figez le temps et profitez-en pour vous déplacer une fois de plus que vos adversaires...',
        [ObjectsTypes.WAND]: "Cette mystérieuse baguette vous permet d'ensorceler un de vos adversaires et de le dérouter de son chemin!",
        [ObjectsTypes.CRYSTAL]: "Vos talents de clairvoyance vous permettent d'identifier tous les points faibles d'un de vos ennemis.",
        [ObjectsTypes.JUICE]: 'Ne paniquez pas, ce nectar soignera toutes vos blessures!',
        [ObjectsTypes.SPAWN]: "Cet objet indique l'endroit où une bataille épique est sur le point d'avoir lieu",
        [ObjectsTypes.RANDOM]: 'Ce petit gnome farceur a un cadeau pour vous. À vos risque et périls...',
    };

    constructor(objectCounterService: ObjectCounterService) {
        this.objectCounterService = objectCounterService;
        if (this.type === ObjectsTypes.SPAWN) {
            this.objectCounterService.spawnCounter$.pipe(takeUntilDestroyed()).subscribe((value) => {
                this.spawnCounter = value;
                if (value === 0) {
                    this.isPlaced = true;
                }
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

    ngOnInit(): void {
        this.itemAdded.emit(this);
    }
}
