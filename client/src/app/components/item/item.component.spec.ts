/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemComponent } from './item.component';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { of, Subject } from 'rxjs';
import { OBJECT_NAMES, ObjectsTypes } from '@app/Consts/app.constants';

describe('ItemComponent', () => {
    let component: ItemComponent;
    let fixture: ComponentFixture<ItemComponent>;
    let objectCounterServiceSpy: jasmine.SpyObj<ObjectCounterService>;
    let spawnCounterSubject: Subject<number>;

    beforeEach(async () => {
        spawnCounterSubject = new Subject<number>();

        objectCounterServiceSpy = jasmine.createSpyObj('ObjectCounterService', [], {
            spawnCounter$: spawnCounterSubject.asObservable(),
            randomCounter$: of(0),
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
        expect(component.image).toBe('assets/objects/undefined.png');
    });

    it('should return Objet inconnu when type is invalid in name getter', () => {
        component.type = 999;
        expect(component.name).toBe('Objet inconnu');
    });

    it('should initialize objectCounterService in constructor', () => {
        expect(component.objectCounterService).toBe(objectCounterServiceSpy);
    });

    it('should not change isPlaced for non-SPAWN objects', () => {
        component.type = ObjectsTypes.BOOTS;
        component.isPlaced = false;

        component.ngOnInit();

        expect(component.isPlaced).toBeFalse();

        spawnCounterSubject.next(0);
        fixture.detectChanges();

        expect(component.isPlaced).toBeFalse();
    });

    it('should set isPlaced to true when spawnCounter$ emits 0 for SPAWN type', () => {
        component.type = ObjectsTypes.SPAWN;
        component.isPlaced = false;

        component.ngOnInit();

        expect(component.isPlaced).toBeFalse();

        spawnCounterSubject.next(0);
        fixture.detectChanges();

        expect(component.isPlaced).toBeTrue();
    });

    it('should set isPlaced to false when spawnCounter$ emits > 0 for SPAWN type', () => {
        component.type = ObjectsTypes.SPAWN;
        component.isPlaced = true;

        component.ngOnInit();

        expect(component.isPlaced).toBeTrue();

        spawnCounterSubject.next(2);
        fixture.detectChanges();

        expect(component.isPlaced).toBeFalse();
    });

    it('should return correct image path based on type', () => {
        component.type = ObjectsTypes.BOOTS;
        expect(component.image).toBe('assets/objects/boots.png');

        component.type = ObjectsTypes.SWORD;
        expect(component.image).toBe('assets/objects/sword.png');

        component.type = ObjectsTypes.POTION;
        expect(component.image).toBe('assets/objects/potion.png');

        component.type = ObjectsTypes.WAND;
        expect(component.image).toBe('assets/objects/wand.png');

        component.type = ObjectsTypes.CRYSTAL;
        expect(component.image).toBe('assets/objects/crystal_ball.png');

        component.type = ObjectsTypes.JUICE;
        expect(component.image).toBe('assets/objects/berry-juice.png');

        component.type = ObjectsTypes.SPAWN;
        expect(component.image).toBe('assets/objects/vortex.png');

        component.type = ObjectsTypes.RANDOM;
        expect(component.image).toBe('assets/objects/gnome.png');

        component.type = 999;
        expect(component.image).toBe('assets/objects/undefined.png');
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

        component.type = 999;
        expect(component.name).toBe(OBJECT_NAMES.undefined);
    });

    it('should properly unsubscribe on destroy', () => {
        component.type = ObjectsTypes.SPAWN;
        component.ngOnInit();

        const subscriptionSpy = spyOn<any>(component['subscriptions'][0], 'unsubscribe');

        component.ngOnDestroy();

        expect(subscriptionSpy).toHaveBeenCalled();
    });

    it('should not error when no subscriptions exist during destroy', () => {
        component.type = ObjectsTypes.BOOTS;
        component.ngOnInit();

        expect(() => component.ngOnDestroy()).not.toThrow();
    });
});
