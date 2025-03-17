import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    imports: [CommonModule],
})
export class InventoryComponent {
    inventory = ['Espace 1: Vide', 'Espace 2: Vide']; // Espaces de stockage vides pour le moment
}
