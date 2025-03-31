import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { ObjectsTypes } from '@common/game.interface';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    imports: [CommonModule],
})
export class InventoryComponent implements OnInit {
    @Input() items: number[] = [];
    @Input() lobbyId: string = '';

    inventory = ['Espace 1: Vide', 'Espace 2: Vide'];
    constructor(private lobbyService: LobbyService) {}

    ngOnInit(): void {
        this.lobbyService.onInventoryFull().subscribe(({ item, currentInventory }) => {
            if (!item || item === ObjectsTypes.EMPTY || !currentInventory || currentInventory.length < 2) {
                return;
            }

            const itemName = this.getItemName(item);
            const item1Name = this.getItemName(currentInventory[0]);
            const item2Name = this.getItemName(currentInventory[1]);

            const choice = confirm(`Tu as déjà 2 objets :\n1) ${item1Name}\n2) ${item2Name}\n\nSouhaites-tu remplacer le 1er par ${itemName} ?`);

            if (choice) {
                this.lobbyService.resolveInventory(this.lobbyId, currentInventory[0], item);
            } else {
                this.lobbyService.cancelInventoryChoice(this.lobbyId);
            }
            this.items = [...currentInventory];
        });
        this.lobbyService.onMovementProcessed().subscribe(({ gameState }) => {
            this.items = gameState.players.find((p) => p.id === this.lobbyService.getSocketId())?.items ?? [];
        });
    }

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
