/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GAME_IMAGES, OBJECT_NAMES, OBJECTS_DESCRIPTION } from '@app/Consts/app.constants';
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
        // Initialize subjects to simulate observable streams
        spawnCounterSubject = new Subject<number>();
        flagPlacedSubject = new Subject<boolean>();
        itemCounterSubject = new Subject<number>();

        // Create a spy object for ObjectCounterService with mocked observables and methods
        objectCounterServiceSpy = jasmine.createSpyObj('ObjectCounterService', ['isItemPlaced', 'getItemCounter'], {
            spawnCounter$: spawnCounterSubject.asObservable(),
            flagPlaced$: flagPlacedSubject.asObservable(),
            itemCounter$: itemCounterSubject.asObservable(),
        });

        // Configure the testing module
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
            providers: [{ provide: ObjectCounterService, useValue: objectCounterServiceSpy }],
        }).compileComponents();

        // Create the component instance and detect changes
        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // Basic creation test
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // Test invalid type handling in getters
    it('should return "assets/objects/undefined.png" when type is invalid in image getter', () => {
        component.type = 999;
        expect(component.image).toBe(GAME_IMAGES.undefined);
    });

    it('should return "Objet inconnu" when type is invalid in name getter', () => {
        component.type = 999;
        expect(component.name).toBe(OBJECT_NAMES.undefined);
    });

    it('should return default description when type is invalid in description getter', () => {
        component.type = 999;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.undefined);
    });

    // Test service initialization
    it('should initialize objectCounterService in constructor', () => {
        expect(component.objectCounterService).toBe(objectCounterServiceSpy);
    });

    // Test SPAWN type behavior
    it('should set isPlaced correctly for SPAWN type', () => {
        component.type = ObjectsTypes.SPAWN;
        component.ngOnInit();

        spawnCounterSubject.next(0); // No spawns active
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();

        spawnCounterSubject.next(1); // One spawn active
        fixture.detectChanges();
        expect(component.isPlaced).toBeFalse();
    });

    // Test FLAG type behavior
    it('should set isPlaced correctly for FLAG type', () => {
        component.type = ObjectsTypes.FLAG;
        component.ngOnInit();

        flagPlacedSubject.next(true); // Flag is placed
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();

        flagPlacedSubject.next(false); // Flag is not placed
        fixture.detectChanges();
        expect(component.isPlaced).toBeFalse();
    });

    // Test RANDOM type behavior
    it('should set isPlaced correctly for RANDOM type', () => {
        component.type = ObjectsTypes.RANDOM;
        component.ngOnInit();

        itemCounterSubject.next(0); // No items placed
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();

        itemCounterSubject.next(1); // One item placed
        fixture.detectChanges();
        expect(component.isPlaced).toBeFalse();
    });

    // Test unique items behavior
    it('should set isPlaced correctly for unique items', () => {
        component.type = ObjectsTypes.BOOTS;
        objectCounterServiceSpy.isItemPlaced.and.returnValue(false);
        objectCounterServiceSpy.getItemCounter.and.returnValue(1); // One item available
        component.ngOnInit();

        itemCounterSubject.next(1); // Trigger subscription
        fixture.detectChanges();
        expect(component.isPlaced).toBeFalse(); // Not placed yet

        objectCounterServiceSpy.isItemPlaced.and.returnValue(true); // Item is placed
        itemCounterSubject.next(1);
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();

        objectCounterServiceSpy.isItemPlaced.and.returnValue(false);
        objectCounterServiceSpy.getItemCounter.and.returnValue(0); // No items available
        itemCounterSubject.next(0);
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue(); // Max items reached
    });

    // Test image getter for all types
    it('should return correct image path based on type', () => {
        component.type = ObjectsTypes.BOOTS;
        expect(component.image).toBe(GAME_IMAGES.boots);

        component.type = ObjectsTypes.SWORD;
        expect(component.image).toBe(GAME_IMAGES.sword);

        component.type = ObjectsTypes.POTION;
        expect(component.image).toBe(GAME_IMAGES.potion);

        component.type = ObjectsTypes.WAND;
        expect(component.image).toBe(GAME_IMAGES.wand);

        component.type = ObjectsTypes.CRYSTAL;
        expect(component.image).toBe(GAME_IMAGES.crystalBall);

        component.type = ObjectsTypes.JUICE;
        expect(component.image).toBe(GAME_IMAGES.berryJuice);

        component.type = ObjectsTypes.SPAWN;
        expect(component.image).toBe(GAME_IMAGES.vortex);

        component.type = ObjectsTypes.RANDOM;
        expect(component.image).toBe(GAME_IMAGES.gnome);

        component.type = ObjectsTypes.FLAG;
        expect(component.image).toBe(GAME_IMAGES.flag);

        component.type = 999;
        expect(component.image).toBe(GAME_IMAGES.undefined);
    });

    // Test name getter for all types
    it('should return correct name based on type', () => {
        component.type = ObjectsTypes.BOOTS;
        expect(component.name).toBe(OBJECT_NAMES.boots);

        component.type = ObjectsTypes.SWORD;
        expect(component.name).toBe(OBJECT_NAMES.sword);

        component.type = ObjectsTypes.POTION;
        expect(component.name).toBe(OBJECT_NAMES.potion);

        component.type = ObjectsTypes.WAND;
        expect(component.name).toBe(OBJECT_NAMES.wand);

        component.type = ObjectsTypes.CRYSTAL;
        expect(component.name).toBe(OBJECT_NAMES.crystalBall);

        component.type = ObjectsTypes.JUICE;
        expect(component.name).toBe(OBJECT_NAMES.berryJuice);

        component.type = ObjectsTypes.SPAWN;
        expect(component.name).toBe(OBJECT_NAMES.vortex);

        component.type = ObjectsTypes.RANDOM;
        expect(component.name).toBe(OBJECT_NAMES.gnome);

        component.type = ObjectsTypes.FLAG;
        expect(component.name).toBe(OBJECT_NAMES.flag);

        component.type = 999;
        expect(component.name).toBe(OBJECT_NAMES.undefined);
    });

    // Test description getter for all types
    it('should return correct description based on type', () => {
        component.type = ObjectsTypes.BOOTS;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.boots);

        component.type = ObjectsTypes.SWORD;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.sword);

        component.type = ObjectsTypes.POTION;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.potion);

        component.type = ObjectsTypes.WAND;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.wand);

        component.type = ObjectsTypes.CRYSTAL;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.crystal);

        component.type = ObjectsTypes.JUICE;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.berryJuice);

        component.type = ObjectsTypes.SPAWN;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.vortex);

        component.type = ObjectsTypes.RANDOM;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.gnome);

        component.type = ObjectsTypes.FLAG;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.flag);

        component.type = 999;
        expect(component.description).toBe(OBJECTS_DESCRIPTION.undefined);
    });

    // Test cleanup on destroy
    it('should properly unsubscribe on destroy', () => {
        component.type = ObjectsTypes.SPAWN;
        component.ngOnInit();

        const subscriptionSpy = spyOn<any>(component['subscriptions'][0], 'unsubscribe');
        component.ngOnDestroy();

        expect(subscriptionSpy).toHaveBeenCalled();
    });

    it('should not error when no subscriptions exist during destroy', () => {
        expect(() => component.ngOnDestroy()).not.toThrow();
    });
});
