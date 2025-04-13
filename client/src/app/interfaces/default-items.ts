import { OBJECT_NAMES, OBJECTS_DESCRIPTION } from '@app/consts/app-constants';
import { ObjectsTypes } from '@common/game.interface';

export const DEFAULT_ITEMS = [
    {
        name: OBJECT_NAMES.boots,
        id: ObjectsTypes.Boots,
        description: OBJECTS_DESCRIPTION.boots,
    },
    {
        name: OBJECT_NAMES.sword,
        id: ObjectsTypes.Sword,
        description: OBJECTS_DESCRIPTION.sword,
    },
    {
        name: OBJECT_NAMES.potion,
        id: ObjectsTypes.Potion,
        description: OBJECTS_DESCRIPTION.potion,
    },
    {
        name: OBJECT_NAMES.wand,
        id: ObjectsTypes.Wand,
        description: OBJECTS_DESCRIPTION.wand,
    },
    {
        name: OBJECT_NAMES.crystalBall,
        id: ObjectsTypes.Crystal,
        description: OBJECTS_DESCRIPTION.crystal,
    },
    {
        name: OBJECT_NAMES.berryJuice,
        id: ObjectsTypes.Juice,
        description: OBJECTS_DESCRIPTION.berryJuice,
    },
    {
        name: OBJECT_NAMES.vortex,
        id: ObjectsTypes.Spawn,
        description: OBJECTS_DESCRIPTION.vortex,
    },
    {
        name: OBJECT_NAMES.gnome,
        id: ObjectsTypes.Random,
        description: OBJECTS_DESCRIPTION.gnome,
    },
    {
        name: OBJECT_NAMES.flag,
        id: ObjectsTypes.Flag,
        description: OBJECTS_DESCRIPTION.flag,
    },
];
