import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, ViewChildren, QueryList } from '@angular/core';
import { ItemComponent } from '@app/components/item/item.component';

@Component({
    selector: 'app-objects',
    imports: [CommonModule, ItemComponent, DragDropModule],
    templateUrl: './objects.component.html',
    styleUrl: './objects.component.scss',
})
export class ObjectsComponent {
    range: number[] = [];
    tooltipText: string | null = null;
    items: ItemComponent[] = [];

    descriptions: { [key: number]: string } = {
        0: 'Les bottes magiques vous permettront de vous déplacer à une vitesse SUPERSONIQUE!',
        1: 'Cette épée effectue plus de dégats sur vos ennemis!',
        2: 'Figez le temps et profitez-en pour vous déplacer une fois de plus que vos adversaires...',
        3: "Cette mystérieuse baguette vous permet d'ensorceler un de vos adversaires et de le dérouter de son chemin!",
        4: "Vos talents de clairvoyance vous permettent d'identifier tous les points faibles d'un de vos ennemis.",
        5: 'Ne paniquez pas, ce nectar soignera toutes vos blessures!',
        6: "Cet objet indique l'endroit où une bataille épique est sur le point d'avoir lieu",
        7: 'Ce petit gnome farceur a un cadeau pour vous. À vos risque et périls...',
    };
    constructor() {
        const MAX_OBJECTS = 7;
        this.range = this.generateRange(0, MAX_OBJECTS);
    }

    generateRange(start: number, end: number): number[] {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    setTooltip(type: number) {
        this.tooltipText = this.descriptions[type] || 'Description inconnue';
    }

    clearTooltip() {
        this.tooltipText = null;
    }

    drop(event: CdkDragDrop<ItemComponent[]>) {
        moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    }
}
