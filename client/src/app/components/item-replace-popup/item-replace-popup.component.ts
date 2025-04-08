import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/Consts/item-constants';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-item-replace-popup',
    templateUrl: './item-replace-popup.component.html',
    styleUrls: ['./item-replace-popup.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class ItemReplacePopupComponent {
    @Input() items: number[] = [];
    @Input() maxSelection = 2;

    @Output() confirmReplace = new EventEmitter<number[]>();
    @Output() cancelReplace = new EventEmitter<void>();

    selectedItems: Set<number> = new Set();

    toggleSelection(item: number): void {
        if (this.selectedItems.has(item)) {
            this.selectedItems.delete(item);
        } else if (this.selectedItems.size < this.maxSelection) {
            this.selectedItems.add(item);
        }
    }

    confirm(): void {
        this.confirmReplace.emit(Array.from(this.selectedItems));
    }

    cancel(): void {
        this.cancelReplace.emit();
    }

    getItemImage(item: number): string {
        return ITEM_INFOS[item]?.image ?? UNKNOWN_ITEM.image;
    }

    getItemName(item: number): string {
        return ITEM_INFOS[item]?.name ?? UNKNOWN_ITEM.name;
    }

    getItemDescription(item: number): string {
        return ITEM_INFOS[item]?.description ?? UNKNOWN_ITEM.description;
    }
}
