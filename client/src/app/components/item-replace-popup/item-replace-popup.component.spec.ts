import { ItemReplacePopupComponent } from './item-replace-popup.component';

describe('ItemReplacePopupComponent (logic only)', () => {
    let component: ItemReplacePopupComponent;

    beforeEach(() => {
        component = new ItemReplacePopupComponent();
    });

    it('should emit confirm event when onConfirm() is called', () => {
        spyOn(component.confirm, 'emit');
        component.onConfirm();
        expect(component.confirm.emit).toHaveBeenCalled();
    });

    it('should emit cancel event when onCancel() is called', () => {
        spyOn(component.cancel, 'emit');
        component.onCancel();
        expect(component.cancel.emit).toHaveBeenCalled();
    });
});
