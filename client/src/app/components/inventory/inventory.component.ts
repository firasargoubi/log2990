import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemReplacePopupComponent } from '@app/components/item-replace-popup/item-replace-popup.component';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/consts/item-constants';
import { LobbyService } from '@app/services/lobby.service';
import { ObjectsTypes } from '@common/game.interface';
import { Player } from '@common/player';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    standalone: true,
    imports: [CommonModule, ItemReplacePopupComponent, MatTooltipModule],
})
export class InventoryComponent implements OnInit {
    @Input() player: Player;
    @Input() lobbyId: string = '';

    showPopup = false;
    pendingItem = 0;

    constructor(private lobbyService: LobbyService) {}
    get items(): number[] {
        return this.player?.items ?? [];
    }

    ngOnInit(): void {
        this.lobbyService.onInventoryFull().subscribe(({ item, currentInventory }) => {
            if (!item || item === ObjectsTypes.EMPTY || !currentInventory || currentInventory.length < 2) return;

            this.pendingItem = item;
            this.showPopup = true;
        });
    }

    getAllInventoryItems(): number[] {
        const allItems = this.pendingItem && this.pendingItem !== ObjectsTypes.EMPTY ? [...this.items, this.pendingItem] : this.items;
        return allItems;
    }
    handleConfirmReplace(keptItems: number[]) {
        this.lobbyService.resolveInventory(this.lobbyId, keptItems);
        this.showPopup = false;
    }

    handleCancelReplace() {
        this.lobbyService.cancelInventoryChoice(this.lobbyId);
        this.showPopup = false;
    }

    getItemImage(item: number): string {
        return ITEM_INFOS[item]?.image ?? UNKNOWN_ITEM.image;
    }

    getItemDescription(item: number): string {
        return ITEM_INFOS[item]?.description ?? UNKNOWN_ITEM.description;
    }

    getItemName(item: number): string {
        return ITEM_INFOS[item]?.name ?? UNKNOWN_ITEM.name;
    }
}
