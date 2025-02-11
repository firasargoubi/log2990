import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { ObjectAmount } from '@app/interfaces/objectAmount';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

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

    descriptions: { [key: string]: string } = {
        0: 'Les bottes magiques vous permettront de vous déplacer à une vitesse SUPERSONIQUE!',
        1: 'Cette épée effectue plus de dégats sur vos ennemis!',
        2: 'Figez le temps et profitez-en pour vous déplacer une fois de plus que vos adversaires...',
        3: "Cette mystérieuse baguette vous permet d'ensorceler un de vos adversaires et de le dérouter de son chemin!",
        4: "Vos talents de clairvoyance vous permettent d'identifier tous les points faibles d'un de vos ennemis.",
        5: 'Ne paniquez pas, ce nectar soignera toutes vos blessures!',
        6: "Cet objet indique l'endroit où une bataille épique est sur le point d'avoir lieu",
        7: 'Ce petit gnome farceur a un cadeau pour vous. À vos risque et périls...',
    };

    get name(): string {
        switch (this.type) {
            case 0:
                return 'Bottes magiques';
            case 1:
                return 'Épée tranchante';
            case 2:
                return 'Potion du temps';
            case 3:
                return 'Baguette magique';
            case 4:
                return 'Boule de crystal';
            case 5:
                return 'Médecine';
            case 6:
                return 'Point de départ';
            case 7:
                return 'Gnome mystère';
            default:
                return 'assets/gnome.png';
        }
    }

    get image(): string {
        switch (this.type) {
            case 0:
                return 'assets/boots.png';
            case 1:
                return 'assets/sword.png';
            case 2:
                return 'assets/potion.png';
            case 3:
                return 'assets/wand.png';
            case 4:
                return 'assets/crystal_ball.png';
            case 5:
                return 'assets/berry-juice.png';
            case 6:
                return 'assets/vortex.png';
            case 7:
                return 'assets/gnome.png';
            default:
                return 'assets/gnome.png';
        }
    }

    ngOnInit(): void {
        this.itemAdded.emit(this);
        switch (this.mapSize) {
            case 'small':
                this.objectCounterService.initializeCounter(ObjectAmount.TWO);
                break;
            case 'medium':
                this.objectCounterService.initializeCounter(ObjectAmount.FOUR);
                break;
            case 'large':
                this.objectCounterService.initializeCounter(ObjectAmount.SIX);
                break;
            default:
                this.objectCounterService.initializeCounter(ObjectAmount.TWO);
                break;
        }
    }
}
