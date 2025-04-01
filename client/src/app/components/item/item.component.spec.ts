/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GAME_IMAGES, OBJECT_NAMES, OBJECTS_DESCRIPTION } from '@app/Consts/app-constants';
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

    it('should initialize objectCounterService in constructor', () => {
        expect(component.objectCounterService).toBe(objectCounterServiceSpy);
    });

    it('should set isPlaced correctly for SPAWN type', () => {
        component.type = ObjectsTypes.SPAWN;
        component.ngOnInit();

        spawnCounterSubject.next(0);
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();

        spawnCounterSubject.next(1);
        fixture.detectChanges();
        expect(component.isPlaced).toBeFalse();
    });

    it('should set isPlaced correctly for FLAG type', () => {
        component.type = ObjectsTypes.FLAG;
        component.ngOnInit();

        flagPlacedSubject.next(true);
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();

        flagPlacedSubject.next(false);
        fixture.detectChanges();
        expect(component.isPlaced).toBeFalse();
    });

    it('should set isPlaced correctly for RANDOM type', () => {
        component.type = ObjectsTypes.RANDOM;
        component.ngOnInit();

        itemCounterSubject.next(0);
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();

        itemCounterSubject.next(1);
        fixture.detectChanges();
        expect(component.isPlaced).toBeFalse();
    });

    it('should set isPlaced correctly for unique items', () => {
        component.type = ObjectsTypes.BOOTS;
        objectCounterServiceSpy.isItemPlaced.and.returnValue(false);
        objectCounterServiceSpy.getItemCounter.and.returnValue(1);
        component.ngOnInit();

        itemCounterSubject.next(1);
        fixture.detectChanges();
        expect(component.isPlaced).toBeFalse();

        objectCounterServiceSpy.isItemPlaced.and.returnValue(true);
        itemCounterSubject.next(1);
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();

        objectCounterServiceSpy.isItemPlaced.and.returnValue(false);
        objectCounterServiceSpy.getItemCounter.and.returnValue(0);
        itemCounterSubject.next(0);
        fixture.detectChanges();
        expect(component.isPlaced).toBeTrue();
    });

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
