/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NavigationEnd, Router } from '@angular/router';
import { ObjectsComponent } from './objects.component';
import { MAX_OBJECTS, ObjectsTypes } from '@app/Consts/app.constants';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { of, Subject } from 'rxjs';
import { ItemModel } from '@app/interfaces/item.model';

describe('ObjectsComponent', () => {
    let component: ObjectsComponent;
    let fixture: ComponentFixture<ObjectsComponent>;
    let counterServiceSpy: jasmine.SpyObj<ObjectCounterService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let spawnCounter$: Subject<number>;

    beforeEach(async () => {
        spawnCounter$ = new Subject<number>();

        counterServiceSpy = jasmine.createSpyObj('ObjectCounterService', ['incrementCounter'], {
            counter$: of(0),
            spawnCounter$: spawnCounter$.asObservable(),
        });

        routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
            events: of(new NavigationEnd(1, '/', '/home')),
        });

        await TestBed.configureTestingModule({
            imports: [ObjectsComponent],
            providers: [
                { provide: ObjectCounterService, useValue: counterServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with a range of values from 0 to MAX_OBJECTS', () => {
        expect(component.range.length).toBe(MAX_OBJECTS + 1);
        expect(component.range[0]).toBe(0);
        expect(component.range[MAX_OBJECTS]).toBe(MAX_OBJECTS);
    });

    describe('Item initialization and updates', () => {
        it('should initialize items during ngOnInit', () => {
            component.items = [];
            component.ngOnInit();

            expect(component.items.length).toBe(MAX_OBJECTS + 1);
            expect(component.items.every((item) => item instanceof ItemModel)).toBeTrue();
        });

        it('should update spawn item when spawnCounter$ emits 0', () => {
            component.ngOnInit();

            const spawnIndex = component.items.findIndex((item) => item.type === ObjectsTypes.SPAWN);
            expect(spawnIndex).not.toBe(-1);

            expect(component.items[spawnIndex].isPlaced).toBeFalse();

            spawnCounter$.next(0);
            fixture.detectChanges();

            expect(component.items[spawnIndex].isPlaced).toBeTrue();
        });

        it('should reset component on NavigationEnd event', () => {
            component.items = [];

            component.ngOnInit();

            expect(component.items.length).toBe(MAX_OBJECTS + 1);
        });
    });

    describe('Internal behavior', () => {
        it('should have the correct range initialized', () => {
            expect(component.range).toContain(3);
            expect(component.range).toContain(4);
            expect(component.range).toContain(5);
        });

        it('should call counterService.incrementCounter when handling drag and drop', () => {
            const testItem = new ItemModel(2); // Type 2
            testItem.isPlaced = true;

            component.items = [testItem];

            const mockEvent: Partial<CdkDragDrop<ItemModel[]>> = {
                previousContainer: { data: component.items } as any,
                container: { data: [] } as any,
                previousIndex: 0,
                currentIndex: 0,
                item: {} as any,
                isPointerOverContainer: true,
                distance: { x: 0, y: 0 },
                dropPoint: { x: 0, y: 0 },
                event: {} as any,
            };

            component.drop(mockEvent as CdkDragDrop<ItemModel[]>);

            expect(counterServiceSpy.incrementCounter).toHaveBeenCalledWith(2);
        });
    });

    describe('Drag and drop handling', () => {
        it('should handle drag-and-drop event correctly', () => {
            const testItem = new ItemModel(ObjectsTypes.BOOTS);
            testItem.isPlaced = true;

            component.items = [testItem];

            const mockEvent: Partial<CdkDragDrop<ItemModel[]>> = {
                previousContainer: { data: component.items } as any,
                container: { data: [] } as any,
                previousIndex: 0,
                currentIndex: 0,
                item: {} as any,
                isPointerOverContainer: true,
                distance: { x: 0, y: 0 },
                dropPoint: { x: 0, y: 0 },
                event: {} as any,
            };

            component.drop(mockEvent as CdkDragDrop<ItemModel[]>);

            expect(testItem.isPlaced).toBeFalse();
            expect(counterServiceSpy.incrementCounter).toHaveBeenCalledWith(testItem.type);
        });

        it('should not modify items if containers are the same', () => {
            const testItem = new ItemModel(ObjectsTypes.BOOTS);

            component.items = [testItem];

            counterServiceSpy.incrementCounter.calls.reset();

            const containerE = { data: component.items, id: 'same' } as any;
            const mockEvent: Partial<CdkDragDrop<ItemModel[]>> = {
                previousContainer: containerE,
                container: containerE,
                previousIndex: 0,
                currentIndex: 0,
                item: {} as any,
                isPointerOverContainer: true,
                distance: { x: 0, y: 0 },
                dropPoint: { x: 0, y: 0 },
                event: {} as any,
            };

            component.drop(mockEvent as CdkDragDrop<ItemModel[]>);

            expect(counterServiceSpy.incrementCounter).not.toHaveBeenCalled();
        });
    });

    describe('Lifecycle methods', () => {
        it('should unsubscribe from all subscriptions on destroy', () => {
            const mockSub1 = jasmine.createSpyObj('Subscription', ['unsubscribe']);
            const mockSub2 = jasmine.createSpyObj('Subscription', ['unsubscribe']);

            (component as any).subscriptions = [mockSub1, mockSub2];

            component.ngOnDestroy();

            expect(mockSub1.unsubscribe).toHaveBeenCalled();
            expect(mockSub2.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('Map size input', () => {
        it('should handle map size input', () => {
            component.mapSize = 'large';
            fixture.detectChanges();

            expect(component.mapSize).toBe('large');
        });
    });
});
