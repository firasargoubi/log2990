import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryComponent } from './inventory.component';

describe('InventoryComponent', () => {
    let component: InventoryComponent;
    let fixture: ComponentFixture<InventoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CommonModule, InventoryComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(InventoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should add an item to the first empty slot', () => {
        component.pickUpItem('Épée');
        expect(component.inventory).toEqual(['Épée (Ramassé)', 'Espace 2: Vide']);
    });

    it('should add an item to the next empty slot', () => {
        component.inventory = ['Épée (Ramassé)', 'Espace 2: Vide'];
        component.pickUpItem('Bouclier');
        expect(component.inventory).toEqual(['Épée (Ramassé)', 'Bouclier (Ramassé)']);
    });

    it('should not modify inventory if it is full', () => {
        component.inventory = ['Épée (Ramassé)', 'Bouclier (Ramassé)'];
        component.pickUpItem('Potion');
        expect(component.inventory).toEqual(['Épée (Ramassé)', 'Bouclier (Ramassé)']);
    });

    it('should reset the inventory to initial state', () => {
        component.inventory = ['Épée (Ramassé)', 'Bouclier (Ramassé)'];
        component.resetInventory();
        expect(component.inventory).toEqual(['Espace 1: Vide', 'Espace 2: Vide']);
    });
});
