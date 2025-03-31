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
    [x: string]: unknown;
    @Input() items: number[] = [];
    @Input() lobbyId: string = '';

    inventory = ['Espace 1: Vide', 'Espace 2: Vide'];
    constructor(private lobbyService: LobbyService) {}

    ngOnInit(): void {
        this.lobbyService.onInventoryFull().subscribe(({ item, currentInventory }) => {
            if (!item || item === ObjectsTypes.EMPTY || !currentInventory || currentInventory.length < 2) {
                return;
            }

            const itemName = item;
            const item1Name = currentInventory[0];
            const item2Name = currentInventory[1];

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
    /*
    pickUpItem(item: string): void {
        const emptySlotIndex = this.inventory.findIndex((slot) => slot.includes('Vide'));
        if (emptySlotIndex !== -1) {
            this.inventory[emptySlotIndex] = `${item} (Ramassé)`;
        }
    }

    resetInventory(): void {
        this.inventory = ['Espace 1: Vide', 'Espace 2: Vide'];
    }
        */

    getItemImage(item: number): string {
        switch (item) {
            case ObjectsTypes.BOOTS:
                return 'assets/objects/boots.png';
            case ObjectsTypes.SWORD:
                return 'assets/objects/sword.png';
            case ObjectsTypes.POTION:
                return 'assets/objects/potion.png';
            case ObjectsTypes.WAND:
                return 'assets/objects/wand.png';
            case ObjectsTypes.CRYSTAL:
                return 'assets/objects/crystal_ball.png';
            case ObjectsTypes.JUICE:
                return 'assets/objects/berry-juice.png';
            default:
                return 'assets/items/unknown.png';
        }
    }
}
