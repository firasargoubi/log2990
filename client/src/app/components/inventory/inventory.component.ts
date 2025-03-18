import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    imports: [CommonModule],
})
export class InventoryComponent {
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
}
