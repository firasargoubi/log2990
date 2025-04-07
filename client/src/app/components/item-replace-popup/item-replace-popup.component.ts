import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-item-replace-popup',
    templateUrl: './item-replace-popup.component.html',
    styleUrls: ['./item-replace-popup.component.scss'],
    standalone: true,
    imports: [],
})
export class ItemReplacePopupComponent {
    @Input() item1Name: string = '';
    @Input() item2Name: string = '';
    @Input() newItemName: string = '';
    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    onConfirm() {
        this.confirm.emit();
    }

    onCancel() {
        this.cancel.emit();
    }
}
