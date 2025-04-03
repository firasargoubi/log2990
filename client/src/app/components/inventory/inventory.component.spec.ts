import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ITEM_INFOS } from '@app/Consts/item-constants';
import { LobbyService } from '@app/services/lobby.service';
import { Player } from '@common/player';
import { Subject } from 'rxjs';
import { InventoryComponent } from './inventory.component';

describe('InventoryComponent', () => {
    let component: InventoryComponent;
    let fixture: ComponentFixture<InventoryComponent>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let inventoryFull$: Subject<{ item: number; currentInventory: number[] }>;

    beforeEach(() => {
        inventoryFull$ = new Subject();

        mockLobbyService = jasmine.createSpyObj('LobbyService', ['onInventoryFull', 'resolveInventory', 'cancelInventoryChoice']);
        mockLobbyService.onInventoryFull.and.returnValue(inventoryFull$.asObservable());

        TestBed.configureTestingModule({
            imports: [InventoryComponent],
            providers: [{ provide: LobbyService, useValue: mockLobbyService }],
        }).compileComponents();

        fixture = TestBed.createComponent(InventoryComponent);
        component = fixture.componentInstance;
        component.lobbyId = 'lobby123';
        component.player = { id: 'id1', name: 'test', items: [1, 2] } as Player;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return correct items from getter', () => {
        expect(component.items).toEqual([1, 2]);
    });

    it('should return combined inventory when pendingItem exists', () => {
        component.pendingItem = 3;
        expect(component.getAllInventoryItems()).toEqual([1, 2, 3]);
    });

    it('should return items only when no pendingItem', () => {
        component.pendingItem = 0;
        expect(component.getAllInventoryItems()).toEqual([1, 2]);
    });

    it('should update popup on inventory full', () => {
        inventoryFull$.next({ item: 3, currentInventory: [1, 2] });
        expect(component.pendingItem).toBe(3);
        expect(component.showPopup).toBeTrue();
    });

    it('should not show popup if invalid inventory full data', () => {
        inventoryFull$.next({ item: 0, currentInventory: [1, 2] });
        expect(component.showPopup).toBeFalse();
    });

    it('should call resolveInventory and hide popup on confirm', () => {
        component.showPopup = true;
        component.handleConfirmReplace([1, 3]);
        expect(mockLobbyService.resolveInventory).toHaveBeenCalledWith('lobby123', [1, 3]);
        expect(component.showPopup).toBeFalse();
    });

    it('should call cancelInventoryChoice and hide popup on cancel', () => {
        component.showPopup = true;
        component.handleCancelReplace();
        expect(mockLobbyService.cancelInventoryChoice).toHaveBeenCalledWith('lobby123');
        expect(component.showPopup).toBeFalse();
    });

    it('should return correct item name, description, and image', () => {
        const testItem = Object.keys(ITEM_INFOS).map(Number)[0];
        expect(component.getItemName(testItem)).toBe(ITEM_INFOS[testItem].name);
        expect(component.getItemDescription(testItem)).toBe(ITEM_INFOS[testItem].description);
        expect(component.getItemImage(testItem)).toBe(ITEM_INFOS[testItem].image);
    });
});
