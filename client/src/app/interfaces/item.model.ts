import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/Consts/item-constants';

export class ItemModel {
    type: number;
    isPlaced: boolean = false;
    tooltipText: string | null = null;

    constructor(type: number) {
        this.type = type;
    }

    get image(): string {
        return ITEM_INFOS[this.type]?.image ?? UNKNOWN_ITEM.image;
    }

    get name(): string {
        return ITEM_INFOS[this.type]?.name ?? UNKNOWN_ITEM.name;
    }

    get description(): string {
        return ITEM_INFOS[this.type]?.description ?? UNKNOWN_ITEM.description;
    }
}
