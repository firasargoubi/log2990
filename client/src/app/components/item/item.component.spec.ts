import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/consts/item-constants';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { ObjectsTypes } from '@common/game.interface';
import { Subject } from 'rxjs';
import { ItemComponent } from './item.component';

describe('ItemComponent', () => {
    let component: ItemComponent;
    let fixture: ComponentFixture<ItemComponent>;
    let objectCounterServiceSpy: jasmine.SpyObj<ObjectCounterService>;
    let spawnCounterSubject: Subject<number>;
    let flagPlacedSubject: Subject<boolean>;
    let itemCounterSubject: Subject<number>;

    beforeEach(async () => {
        spawnCounterSubject = new Subject<number>();
        flagPlacedSubject = new Subject<boolean>();
        itemCounterSubject = new Subject<number>();

        objectCounterServiceSpy = jasmine.createSpyObj('ObjectCounterService', ['isItemPlaced', 'getItemCounter'], {
            spawnCounter$: spawnCounterSubject.asObservable(),
            flagPlaced$: flagPlacedSubject.asObservable(),
            itemCounter$: itemCounterSubject.asObservable(),
        });

        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [{ provide: ObjectCounterService, useValue: objectCounterServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return UNKNOWN_ITEM image for unknown type', () => {
        component.type = 999;
        expect(component.image).toBe(UNKNOWN_ITEM.image);
    });

    it('should return UNKNOWN_ITEM name for unknown type', () => {
        component.type = 999;
        expect(component.name).toBe(UNKNOWN_ITEM.name);
    });

    it('should return UNKNOWN_ITEM description for unknown type', () => {
        component.type = 999;
        expect(component.description).toBe(UNKNOWN_ITEM.description);
    });

    it('should set isPlaced correctly for SPAWN type', () => {
        component.type = ObjectsTypes.Spawn;
        component.ngOnInit();

        spawnCounterSubject.next(0);
        expect(component.isPlaced).toBeTrue();

        spawnCounterSubject.next(1);
        expect(component.isPlaced).toBeFalse();
    });

    it('should set isPlaced correctly for FLAG type', () => {
        component.type = ObjectsTypes.Flag;
        component.ngOnInit();

        flagPlacedSubject.next(true);
        expect(component.isPlaced).toBeTrue();

        flagPlacedSubject.next(false);
        expect(component.isPlaced).toBeFalse();
    });

    it('should set isPlaced correctly for RANDOM type', () => {
        component.type = ObjectsTypes.Random;
        component.ngOnInit();

        itemCounterSubject.next(0);
        expect(component.isPlaced).toBeTrue();

        itemCounterSubject.next(1);
        expect(component.isPlaced).toBeFalse();
    });

    it('should set isPlaced correctly for other items (BOOTS)', () => {
        component.type = ObjectsTypes.Boots;

        objectCounterServiceSpy.isItemPlaced.and.returnValue(false);
        objectCounterServiceSpy.getItemCounter.and.returnValue(1);

        component.ngOnInit();
        itemCounterSubject.next(1);
        expect(component.isPlaced).toBeFalse();

        objectCounterServiceSpy.isItemPlaced.and.returnValue(true);
        itemCounterSubject.next(1);
        expect(component.isPlaced).toBeTrue();

        objectCounterServiceSpy.isItemPlaced.and.returnValue(false);
        objectCounterServiceSpy.getItemCounter.and.returnValue(0);
        itemCounterSubject.next(0);
        expect(component.isPlaced).toBeTrue();
    });

    it('should return correct image, name, and description for known types', () => {
        Object.entries(ITEM_INFOS).forEach(([type, info]) => {
            component.type = Number(type);
            expect(component.image).toBe(info.image);
            expect(component.name).toBe(info.name);
            expect(component.description).toBe(info.description);
        });
    });

    it('should unsubscribe on destroy', () => {
        component.type = ObjectsTypes.Spawn;
        component.ngOnInit();

        const unsubscribeSpy = spyOn(component['subscriptions'][0], 'unsubscribe');
        component.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should not throw error if no subscriptions on destroy', () => {
        expect(() => component.ngOnDestroy()).not.toThrow();
    });
});
