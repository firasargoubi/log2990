import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ObjectsTypes } from '@common/game.interface';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    imports: [CommonModule],
})
export class InventoryComponent {
    @Input() items: number[] = [];
    inventory = ['Espace 1: Vide', 'Espace 2: Vide'];

    pickUpItem(item: string): void {
        const emptySlotIndex = this.inventory.findIndex((slot) => slot.includes('Vide'));

        if (emptySlotIndex !== -1) {
            this.inventory[emptySlotIndex] = `${item} (Ramassé)`;
        }
    }

    resetInventory(): void {
        this.inventory = ['Espace 1: Vide', 'Espace 2: Vide'];
    }
    getItemName(item: number): string {
        switch (item) {
            case ObjectsTypes.BOOTS:
                return 'Bottes';
            case ObjectsTypes.SWORD:
                return 'Épée';
            case ObjectsTypes.POTION:
                return 'Potion';
            case ObjectsTypes.WAND:
                return 'Baguette';
            case ObjectsTypes.CRYSTAL:
                return 'Cristal';
            case ObjectsTypes.JUICE:
                return 'Jus';
            case ObjectsTypes.RANDOM:
                return 'Objet aléatoire';
            default:
                return 'Objet inconnu';
        }
    }
}
