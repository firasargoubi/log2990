import { ObjectsTypes } from '@common/game.interface';
import { GAME_IMAGES, OBJECT_NAMES, OBJECTS_DESCRIPTION } from './app-constants';

export interface ItemInfo {
    image: string;
    description: string;
    name: string;
}

export const ITEM_INFOS: Record<number, ItemInfo> = {
    [ObjectsTypes.Boots]: {
        image: GAME_IMAGES.boots,
        description: OBJECTS_DESCRIPTION.boots,
        name: OBJECT_NAMES.boots,
    },
    [ObjectsTypes.Sword]: {
        image: GAME_IMAGES.sword,
        description: OBJECTS_DESCRIPTION.sword,
        name: OBJECT_NAMES.sword,
    },
    [ObjectsTypes.Potion]: {
        image: GAME_IMAGES.potion,
        description: OBJECTS_DESCRIPTION.potion,
        name: OBJECT_NAMES.potion,
    },
    [ObjectsTypes.Wand]: {
        image: GAME_IMAGES.wand,
        description: OBJECTS_DESCRIPTION.wand,
        name: OBJECT_NAMES.wand,
    },
    [ObjectsTypes.Crystal]: {
        image: GAME_IMAGES.crystalBall,
        description: OBJECTS_DESCRIPTION.crystal,
        name: OBJECT_NAMES.crystalBall,
    },
    [ObjectsTypes.Juice]: {
        image: GAME_IMAGES.berryJuice,
        description: OBJECTS_DESCRIPTION.berryJuice,
        name: OBJECT_NAMES.berryJuice,
    },
    [ObjectsTypes.Random]: {
        image: GAME_IMAGES.gnome,
        description: OBJECTS_DESCRIPTION.gnome,
        name: OBJECT_NAMES.gnome,
    },
    [ObjectsTypes.Flag]: {
        image: GAME_IMAGES.flag,
        description: OBJECTS_DESCRIPTION.flag,
        name: OBJECT_NAMES.flag,
    },
    [ObjectsTypes.Spawn]: {
        image: GAME_IMAGES.vortex,
        description: OBJECTS_DESCRIPTION.vortex,
        name: OBJECT_NAMES.vortex,
    },
};

export const UNKNOWN_ITEM: ItemInfo = {
    image: 'assets/items/unknown.png',
    description: OBJECTS_DESCRIPTION.undefined,
    name: 'Objet inconnu',
};
