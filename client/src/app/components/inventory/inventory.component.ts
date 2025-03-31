import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ItemReplacePopupComponent } from '@app/components/item-replace-popup/item-replace-popup.component';
import { LobbyService } from '@app/services/lobby.service';
import { ObjectsTypes } from '@common/game.interface';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    standalone: true,
    imports: [CommonModule, ItemReplacePopupComponent],
})
export class InventoryComponent implements OnInit {
    @Input() items: number[] = [];
    @Input() lobbyId: string = '';

    showPopup = false;
    pendingItem = 0;

    constructor(private lobbyService: LobbyService) {}

    ngOnInit(): void {
        this.lobbyService.onInventoryFull().subscribe(({ item, currentInventory }) => {
            if (!item || item === ObjectsTypes.EMPTY || !currentInventory || currentInventory.length < 2) return;

            this.pendingItem = item;
            this.items = [...currentInventory];
            this.showPopup = true;
        });

        this.lobbyService.onMovementProcessed().subscribe(({ gameState }) => {
            this.items = gameState.players.find((p) => p.id === this.lobbyService.getSocketId())?.items ?? [];
        });
    }

    handleConfirmReplace() {
        this.lobbyService.resolveInventory(this.lobbyId, this.items[0], this.pendingItem);
        this.showPopup = false;
    }

    handleCancelReplace() {
        this.lobbyService.cancelInventoryChoice(this.lobbyId);
        this.showPopup = false;
    }

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
