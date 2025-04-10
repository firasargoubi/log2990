import { OBJECT_NAMES, OBJECTS_DESCRIPTION } from '@app/consts/app-constants';
import { ObjectsTypes } from '@common/game.interface';

export const DEFAULT_ITEMS = [
    {
        name: OBJECT_NAMES.boots,
        id: ObjectsTypes.BOOTS,
        description: OBJECTS_DESCRIPTION.boots,
    },
    {
        name: OBJECT_NAMES.sword,
        id: ObjectsTypes.SWORD,
        description: OBJECTS_DESCRIPTION.sword,
    },
    {
        name: OBJECT_NAMES.potion,
        id: ObjectsTypes.POTION,
        description: OBJECTS_DESCRIPTION.potion,
    },
    {
        name: OBJECT_NAMES.wand,
        id: ObjectsTypes.WAND,
        description: OBJECTS_DESCRIPTION.wand,
    },
    {
        name: OBJECT_NAMES.crystalBall,
        id: ObjectsTypes.CRYSTAL,
        description: OBJECTS_DESCRIPTION.crystal,
    },
    {
        name: OBJECT_NAMES.berryJuice,
        id: ObjectsTypes.JUICE,
        description: OBJECTS_DESCRIPTION.berryJuice,
    },
    {
        name: OBJECT_NAMES.vortex,
        id: ObjectsTypes.SPAWN,
        description: OBJECTS_DESCRIPTION.vortex,
    },
    {
        name: OBJECT_NAMES.gnome,
        id: ObjectsTypes.RANDOM,
        description: OBJECTS_DESCRIPTION.gnome,
    },
    {
        name: OBJECT_NAMES.flag,
        id: ObjectsTypes.FLAG,
        description: OBJECTS_DESCRIPTION.flag,
    },
];
