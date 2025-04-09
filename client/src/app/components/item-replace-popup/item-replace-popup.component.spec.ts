/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UNKNOWN_ITEM } from '@app/Consts/item-constants';
import { ItemReplacePopupComponent } from './item-replace-popup.component';

describe('ItemReplacePopupComponent', () => {
    let component: ItemReplacePopupComponent;
    let fixture: ComponentFixture<ItemReplacePopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemReplacePopupComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ItemReplacePopupComponent);
        component = fixture.componentInstance;
        component.items = [1, 2, 3];
        component.maxSelection = 2;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should select and deselect items', () => {
        component.toggleSelection(1);
        expect(component.selectedItems.has(1)).toBeTrue();

        component.toggleSelection(1);
        expect(component.selectedItems.has(1)).toBeFalse();
    });

    it('should not select more than maxSelection items', () => {
        component.toggleSelection(1);
        component.toggleSelection(2);
        component.toggleSelection(3);
        expect(component.selectedItems.size).toBe(2);
        expect(component.selectedItems.has(3)).toBeFalse();
    });

    it('should emit confirm with selected items', () => {
        const spy = spyOn(component.confirmReplace, 'emit');
        component.toggleSelection(1);
        component.toggleSelection(2);
        component.confirm();
        expect(spy).toHaveBeenCalledWith([1, 2]);
    });

    it('should emit cancel event', () => {
        const spy = spyOn(component.cancelReplace, 'emit');
        component.cancel();
        expect(spy).toHaveBeenCalled();
    });

    it('should return default values for unknown item', () => {
        const unknownItem = 9999; // un ID pas dans ITEM_INFOS

        expect(component.getItemName(unknownItem)).toBe(UNKNOWN_ITEM.name);
        expect(component.getItemDescription(unknownItem)).toBe(UNKNOWN_ITEM.description);
        expect(component.getItemImage(unknownItem)).toBe(UNKNOWN_ITEM.image);
    });
});
