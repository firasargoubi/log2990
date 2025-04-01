import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemReplacePopupComponent } from '@app/components/item-replace-popup/item-replace-popup.component';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/Consts/item-constants';
import { LobbyService } from '@app/services/lobby.service';
import { ObjectsTypes } from '@common/game.interface';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    standalone: true,
    imports: [CommonModule, ItemReplacePopupComponent, MatTooltipModule],
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
        return ITEM_INFOS[item]?.image ?? UNKNOWN_ITEM.image;
    }

    getItemDescription(item: number): string {
        return ITEM_INFOS[item]?.description ?? UNKNOWN_ITEM.description;
    }

    getItemName(item: number): string {
        return ITEM_INFOS[item]?.name ?? UNKNOWN_ITEM.name;
    }
}
