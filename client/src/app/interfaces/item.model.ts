// client/src/app/models/item.model.ts
import { GAME_IMAGES, OBJECT_NAMES, OBJECTS_DESCRIPTION, ObjectsTypes } from '@app/Consts/app.constants';

export class ItemModel {
    type: number;
    isPlaced: boolean = false;
    tooltipText: string | null = null;

    constructor(type: number) {
        this.type = type;
    }

    get image(): string {
        switch (this.type) {
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
            case ObjectsTypes.SPAWN:
                return GAME_IMAGES.vortex;
            case ObjectsTypes.RANDOM:
                return GAME_IMAGES.gnome;
            default:
                return GAME_IMAGES.undefined;
        }
    }

    get name(): string {
        switch (this.type) {
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
            case ObjectsTypes.SPAWN:
                return OBJECT_NAMES.vortex;
            case ObjectsTypes.RANDOM:
                return OBJECT_NAMES.gnome;
            default:
                return OBJECT_NAMES.undefined;
        }
    }

    get description(): string {
        switch (this.type) {
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
            case ObjectsTypes.SPAWN:
                return OBJECTS_DESCRIPTION.vortex;
            case ObjectsTypes.RANDOM:
                return OBJECTS_DESCRIPTION.gnome;
            default:
                return OBJECTS_DESCRIPTION.undefined;
        }
    }
}
