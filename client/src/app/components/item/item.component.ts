import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-item',
    imports: [CdkDrag, CommonModule, MatTooltipModule],
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss'],
})
export class ItemComponent implements OnInit {
    @Input() type: number;
    @Input() mapSize: 'small' | 'medium' | 'large';
    @Output() itemAdded = new EventEmitter<ItemComponent>();
    isPlaced: boolean = false;
    tooltipText: string | null = null;
    objectCounterService = inject(ObjectCounterService);
    spawnCounter: number = 0;

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

    constructor() {
        if (this.type === ObjectsTypes.SPAWN) {
            this.objectCounterService.spawnCounter$.pipe(takeUntilDestroyed()).subscribe((value) => {
                this.spawnCounter = value;
            });
        }
    }
    get image(): string {
        switch (this.type) {
            case ObjectsTypes.BOOTS:
                return 'assets/boots.png';
            case ObjectsTypes.SWORD:
                return 'assets/sword.png';
            case ObjectsTypes.POTION:
                return 'assets/potion.png';
            case ObjectsTypes.WAND:
                return 'assets/wand.png';
            case ObjectsTypes.CRYSTAL:
                return 'assets/crystal_ball.png';
            case ObjectsTypes.JUICE:
                return 'assets/berry-juice.png';
            case ObjectsTypes.SPAWN:
                return 'assets/vortex.png';
            case ObjectsTypes.RANDOM:
                return 'assets/gnome.png';
            default:
                return 'assets/transparent.png';
        }
    }

    get name(): string {
        switch (this.type) {
            case ObjectsTypes.BOOTS:
                return 'Bottes magiques';
            case ObjectsTypes.SWORD:
                return 'Épée tranchante';
            case ObjectsTypes.POTION:
                return 'Potion du temps';
            case ObjectsTypes.WAND:
                return 'Baguette magique';
            case ObjectsTypes.CRYSTAL:
                return 'Boule de crystal';
            case ObjectsTypes.JUICE:
                return 'Médecine';
            case ObjectsTypes.SPAWN:
                return 'Point de départ';
            case ObjectsTypes.RANDOM:
                return 'Gnome mystère';
            default:
                return 'Inconnu';
        }
    }

    ngOnInit(): void {
        this.itemAdded.emit(this);
    }
}
