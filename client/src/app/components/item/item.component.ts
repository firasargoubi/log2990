import { CdkDrag } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ObjectAmount } from '@app/interfaces/objectAmount';

@Component({
    selector: 'app-item',
    imports: [CdkDrag, CommonModule, MatTooltipModule],
    templateUrl: './item.component.html',
    styleUrl: './item.component.scss',
})
export class ItemComponent implements OnInit {
    @Input() type = '';
    @Input() mapSize: 'small' | 'medium' | 'large';
    @Output() itemAdded = new EventEmitter<ItemComponent>();
    @Input() counter = 4;
    @Input() inTile: boolean = false;
    isPlaced: boolean = false;
    tooltipText: string | null = null;
    spawnCounter: number;
    randomCounter: number;

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
            case '0':
                return 'Bottes magiques';
            case '1':
                return 'Épée tranchante';
            case '2':
                return 'Potion du temps';
            case '3':
                return 'Baguette magique';
            case '4':
                return 'Boule de crystal';
            case '5':
                return 'Médecine';
            case '6':
                return 'Point de départ';
            case '7':
                return 'Gnome mystère';
            default:
                return 'Undefined';
        }
    }

    get image(): string {
        switch (this.type) {
            case '0':
                return 'assets/boots.png';
            case '1':
                return 'assets/sword.png';
            case '2':
                return 'assets/potion.png';
            case '3':
                return 'assets/wand.png';
            case '4':
                return 'assets/crystal_ball.png';
            case '5':
                return 'assets/berry-juice.png';
            case '6':
                return 'assets/vortex.png';
            case '7':
                return 'assets/gnome.png';
            default:
                return 'Undefined';
        }
    }
    ngOnInit(): void {
        this.itemAdded.emit(this);
        switch (this.mapSize) {
            case 'small':
                this.spawnCounter = ObjectAmount.TWO;
                this.randomCounter = ObjectAmount.TWO;
                break;
            case 'medium':
                this.spawnCounter = ObjectAmount.FOUR;
                this.randomCounter = ObjectAmount.FOUR;
                break;
            case 'large':
                this.spawnCounter = ObjectAmount.SIX;
                this.randomCounter = ObjectAmount.SIX;
                break;
            default:
                this.spawnCounter = ObjectAmount.TWO;
                this.randomCounter = ObjectAmount.TWO;
                break;
        }
    }
}
