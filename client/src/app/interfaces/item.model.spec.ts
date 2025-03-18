/* eslint-disable @typescript-eslint/no-magic-numbers */
import { GAME_IMAGES, OBJECT_NAMES, OBJECTS_DESCRIPTION, ObjectsTypes } from '@app/Consts/app.constants';
import { ItemModel } from './item.model';

describe('ItemModel', () => {
    it('should create an instance with the correct type', () => {
        const itemModel = new ItemModel(ObjectsTypes.BOOTS);
        expect(itemModel.type).toBe(ObjectsTypes.BOOTS);
    });

    it('should initialize isPlaced to false by default', () => {
        const itemModel = new ItemModel(ObjectsTypes.BOOTS);
        expect(itemModel.isPlaced).toBeFalse();
    });

    it('should initialize tooltipText to null by default', () => {
        const itemModel = new ItemModel(ObjectsTypes.BOOTS);
        expect(itemModel.tooltipText).toBeNull();
    });

    describe('image getter', () => {
        it('should return correct image for ObjectsTypes.BOOTS', () => {
            const itemModel = new ItemModel(ObjectsTypes.BOOTS);
            expect(itemModel.image).toBe(GAME_IMAGES.boots);
        });

        it('should return correct image for ObjectsTypes.SWORD', () => {
            const itemModel = new ItemModel(ObjectsTypes.SWORD);
            expect(itemModel.image).toBe(GAME_IMAGES.sword);
        });

        it('should return correct image for ObjectsTypes.POTION', () => {
            const itemModel = new ItemModel(ObjectsTypes.POTION);
            expect(itemModel.image).toBe(GAME_IMAGES.potion);
        });

        it('should return correct image for ObjectsTypes.WAND', () => {
            const itemModel = new ItemModel(ObjectsTypes.WAND);
            expect(itemModel.image).toBe(GAME_IMAGES.wand);
        });

        it('should return correct image for ObjectsTypes.CRYSTAL', () => {
            const itemModel = new ItemModel(ObjectsTypes.CRYSTAL);
            expect(itemModel.image).toBe(GAME_IMAGES.crystalBall);
        });

        it('should return correct image for ObjectsTypes.JUICE', () => {
            const itemModel = new ItemModel(ObjectsTypes.JUICE);
            expect(itemModel.image).toBe(GAME_IMAGES.berryJuice);
        });

        it('should return correct image for ObjectsTypes.SPAWN', () => {
            const itemModel = new ItemModel(ObjectsTypes.SPAWN);
            expect(itemModel.image).toBe(GAME_IMAGES.vortex);
        });

        it('should return correct image for ObjectsTypes.RANDOM', () => {
            const itemModel = new ItemModel(ObjectsTypes.RANDOM);
            expect(itemModel.image).toBe(GAME_IMAGES.gnome);
        });

        it('should return the undefined image for unknown types', () => {
            const itemModel = new ItemModel(999);
            expect(itemModel.image).toBe(GAME_IMAGES.undefined);
        });
    });

    describe('name getter', () => {
        it('should return correct name for ObjectsTypes.BOOTS', () => {
            const itemModel = new ItemModel(ObjectsTypes.BOOTS);
            expect(itemModel.name).toBe(OBJECT_NAMES.boots);
        });

        it('should return correct name for ObjectsTypes.SWORD', () => {
            const itemModel = new ItemModel(ObjectsTypes.SWORD);
            expect(itemModel.name).toBe(OBJECT_NAMES.sword);
        });

        it('should return correct name for ObjectsTypes.POTION', () => {
            const itemModel = new ItemModel(ObjectsTypes.POTION);
            expect(itemModel.name).toBe(OBJECT_NAMES.potion);
        });

        it('should return correct name for ObjectsTypes.WAND', () => {
            const itemModel = new ItemModel(ObjectsTypes.WAND);
            expect(itemModel.name).toBe(OBJECT_NAMES.wand);
        });

        it('should return correct name for ObjectsTypes.CRYSTAL', () => {
            const itemModel = new ItemModel(ObjectsTypes.CRYSTAL);
            expect(itemModel.name).toBe(OBJECT_NAMES.crystalBall);
        });

        it('should return correct name for ObjectsTypes.JUICE', () => {
            const itemModel = new ItemModel(ObjectsTypes.JUICE);
            expect(itemModel.name).toBe(OBJECT_NAMES.berryJuice);
        });

        it('should return correct name for ObjectsTypes.SPAWN', () => {
            const itemModel = new ItemModel(ObjectsTypes.SPAWN);
            expect(itemModel.name).toBe(OBJECT_NAMES.vortex);
        });

        it('should return correct name for ObjectsTypes.RANDOM', () => {
            const itemModel = new ItemModel(ObjectsTypes.RANDOM);
            expect(itemModel.name).toBe(OBJECT_NAMES.gnome);
        });

        it('should return the undefined name for unknown types', () => {
            const itemModel = new ItemModel(999);
            expect(itemModel.name).toBe(OBJECT_NAMES.undefined);
        });
    });

    describe('description getter', () => {
        it('should return correct description for ObjectsTypes.BOOTS', () => {
            const itemModel = new ItemModel(ObjectsTypes.BOOTS);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.boots);
        });

        it('should return correct description for ObjectsTypes.SWORD', () => {
            const itemModel = new ItemModel(ObjectsTypes.SWORD);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.sword);
        });

        it('should return correct description for ObjectsTypes.POTION', () => {
            const itemModel = new ItemModel(ObjectsTypes.POTION);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.potion);
        });

        it('should return correct description for ObjectsTypes.WAND', () => {
            const itemModel = new ItemModel(ObjectsTypes.WAND);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.wand);
        });

        it('should return correct description for ObjectsTypes.CRYSTAL', () => {
            const itemModel = new ItemModel(ObjectsTypes.CRYSTAL);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.crystal);
        });

        it('should return correct description for ObjectsTypes.JUICE', () => {
            const itemModel = new ItemModel(ObjectsTypes.JUICE);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.berryJuice);
        });

        it('should return correct description for ObjectsTypes.SPAWN', () => {
            const itemModel = new ItemModel(ObjectsTypes.SPAWN);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.vortex);
        });

        it('should return correct description for ObjectsTypes.RANDOM', () => {
            const itemModel = new ItemModel(ObjectsTypes.RANDOM);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.gnome);
        });

        it('should return the undefined description for unknown types', () => {
            const itemModel = new ItemModel(999);
            expect(itemModel.description).toBe(OBJECTS_DESCRIPTION.undefined);
        });
    });
});
