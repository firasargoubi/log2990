import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemComponent } from '../client/src/app/components/item/item.component';

describe('ItemComponent', () => {
    let component: ItemComponent;
    let fixture: ComponentFixture<ItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ItemComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render item name', () => {
        component.item = { name: 'Test Item' };
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.item-name').textContent).toContain('Test Item');
    });

    it('should render item description', () => {
        component.item = { description: 'Test Description' };
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.item-description').textContent).toContain('Test Description');
    });
});
