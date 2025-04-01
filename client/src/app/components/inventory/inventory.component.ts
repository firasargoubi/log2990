import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemReplacePopupComponent } from '@app/components/item-replace-popup/item-replace-popup.component';
import { GAME_IMAGES, OBJECTS_DESCRIPTION, OBJECT_NAMES } from '@app/Consts/app.constants';
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
        switch (item) {
            case ObjectsTypes.BOOTS:
                return GAME_IMAGES.boots;
            case ObjectsTypes.SWORD:
                return GAME_IMAGES.sword;
            case ObjectsTypes.POTION:
                return GAME_IMAGES.potion;
            case ObjectsTypes.WAND:
                return GAME_IMAGES.wand;
            case ObjectsTypes.CRYSTAL:
                return GAME_IMAGES.crystalBall;
            case ObjectsTypes.JUICE:
                return GAME_IMAGES.berryJuice;
            case ObjectsTypes.RANDOM:
                return GAME_IMAGES.gnome;
            case ObjectsTypes.FLAG:
                return GAME_IMAGES.flag;
            default:
                return 'assets/items/unknown.png';
        }
    }

    getItemDescription(item: number): string {
        switch (item) {
            case ObjectsTypes.BOOTS:
                return OBJECTS_DESCRIPTION.boots;
            case ObjectsTypes.SWORD:
                return OBJECTS_DESCRIPTION.sword;
            case ObjectsTypes.POTION:
                return OBJECTS_DESCRIPTION.potion;
            case ObjectsTypes.WAND:
                return OBJECTS_DESCRIPTION.wand;
            case ObjectsTypes.CRYSTAL:
                return OBJECTS_DESCRIPTION.crystal;
            case ObjectsTypes.JUICE:
                return OBJECTS_DESCRIPTION.berryJuice;
            case ObjectsTypes.RANDOM:
                return OBJECTS_DESCRIPTION.gnome;
            case ObjectsTypes.FLAG:
                return OBJECTS_DESCRIPTION.flag;
            default:
                return OBJECTS_DESCRIPTION.undefined;
        }
    }
    getItemName(item: number): string {
        switch (item) {
            case ObjectsTypes.BOOTS:
                return OBJECT_NAMES.boots;
            case ObjectsTypes.SWORD:
                return OBJECT_NAMES.sword;
            case ObjectsTypes.POTION:
                return OBJECT_NAMES.potion;
            case ObjectsTypes.WAND:
                return OBJECT_NAMES.wand;
            case ObjectsTypes.CRYSTAL:
                return OBJECT_NAMES.crystalBall;
            case ObjectsTypes.JUICE:
                return OBJECT_NAMES.berryJuice;
            case ObjectsTypes.RANDOM:
                return OBJECT_NAMES.gnome;
            case ObjectsTypes.FLAG:
                return OBJECT_NAMES.flag;
            default:
                return 'Objet inconnu';
        }
    }
}
