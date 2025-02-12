import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemComponent } from './item.component';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { of, Subject } from 'rxjs';

describe('ItemComponent', () => {
    let component: ItemComponent;
    let fixture: ComponentFixture<ItemComponent>;
    let objectCounterServiceSpy: jasmine.SpyObj<ObjectCounterService>;

    beforeEach(async () => {
        objectCounterServiceSpy = jasmine.createSpyObj('ObjectCounterService', [], {
            spawnCounter$: of(0),
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
        component.type = 999; // Invalid type
        expect(component.image).toBe('assets/objects/undefined.png');
    });

    it('should return "assets/objects/undefined.png" when type is invalid in name getter', () => {
        component.type = 999; // Invalid type
        expect(component.name).toBe('assets/objects/undefined.png');
    });

    it('should initialize objectCounterService in constructor', () => {
        expect(component.objectCounterService).toBe(objectCounterServiceSpy);
    });

    it('should not subscribe to spawnCounter$ if type is not SPAWN', () => {
        const spawnCounter$ = new Subject<number>();
        objectCounterServiceSpy.spawnCounter$ = spawnCounter$;

        component.type = ObjectsTypes.BOOTS;
        component.ngOnInit();

        expect(component.spawnCounter).toBe(0);
        expect(component.isPlaced).toBe(false);
    });

    it('should set isPlaced to true when spawnCounter$ emits 0', () => {
        const spawnCounter$ = new Subject<number>();
        objectCounterServiceSpy.spawnCounter$ = spawnCounter$;

        component.type = ObjectsTypes.SPAWN;
        component.ngOnInit();

        spawnCounter$.next(0);
        expect(component.spawnCounter).toBe(0);
        expect(component.isPlaced).toBe(true);
    });

    it('should emit itemAdded event on ngOnInit', () => {
        spyOn(component.itemAdded, 'emit');
        component.ngOnInit();
        expect(component.itemAdded.emit).toHaveBeenCalledWith(component);
    });

    it('should update spawnCounter and set isPlaced to true when spawnCounter$ emits 0', () => {
        const spawnCounter$ = new Subject<number>();
        objectCounterServiceSpy.spawnCounter$ = spawnCounter$;

        component.type = ObjectsTypes.SPAWN;
        component.ngOnInit();

        spawnCounter$.next(0);

        expect(component.spawnCounter).toBe(0);

        expect(component.isPlaced).toBe(true);
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
        expect(component.name).toBe('assets/objects/boots.png');

        component.type = ObjectsTypes.SWORD;
        expect(component.name).toBe('assets/objects/sword.png');

        component.type = ObjectsTypes.POTION;
        expect(component.name).toBe('assets/objects/potion.png');

        component.type = ObjectsTypes.WAND;
        expect(component.name).toBe('assets/objects/wand.png');

        component.type = ObjectsTypes.CRYSTAL;
        expect(component.name).toBe('assets/objects/crystal_ball.png');

        component.type = ObjectsTypes.JUICE;
        expect(component.name).toBe('assets/objects/berry-juice.png');

        component.type = ObjectsTypes.SPAWN;
        expect(component.name).toBe('assets/objects/vortex.png');

        component.type = ObjectsTypes.RANDOM;
        expect(component.name).toBe('assets/objects/gnome.png');

        component.type = 999;
        expect(component.name).toBe('assets/objects/undefined.png');
    });
});
