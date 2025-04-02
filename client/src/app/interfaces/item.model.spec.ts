/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/Consts/item-constants';
import { ObjectsTypes } from '@common/game.interface';
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
        Object.entries(ITEM_INFOS).forEach(([type, info]) => {
            it(`should return correct image for type ${type}`, () => {
                const itemModel = new ItemModel(Number(type));
                expect(itemModel.image).toBe(info.image);
            });
        });

        it('should return unknown image if type is not in ITEM_INFOS', () => {
            const itemModel = new ItemModel(999);
            expect(itemModel.image).toBe(UNKNOWN_ITEM.image);
        });
    });

    describe('name getter', () => {
        Object.entries(ITEM_INFOS).forEach(([type, info]) => {
            it(`should return correct name for type ${type}`, () => {
                const itemModel = new ItemModel(Number(type));
                expect(itemModel.name).toBe(info.name);
            });
        });

        it('should return unknown name if type is not in ITEM_INFOS', () => {
            const itemModel = new ItemModel(999);
            expect(itemModel.name).toBe(UNKNOWN_ITEM.name);
        });
    });

    describe('description getter', () => {
        Object.entries(ITEM_INFOS).forEach(([type, info]) => {
            it(`should return correct description for type ${type}`, () => {
                const itemModel = new ItemModel(Number(type));
                expect(itemModel.description).toBe(info.description);
            });
        });

        it('should return unknown description if type is not in ITEM_INFOS', () => {
            const itemModel = new ItemModel(999);
            expect(itemModel.description).toBe(UNKNOWN_ITEM.description);
        });
    });
});
