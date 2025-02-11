/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ObjectsComponent } from './objects.component';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { Router, NavigationEnd } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ItemComponent } from '@app/components/item/item.component';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';

describe('ObjectsComponent', () => {
    let component: ObjectsComponent;
    let fixture: ComponentFixture<ObjectsComponent>;
    let mockCounterService: jasmine.SpyObj<ObjectCounterService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let spawnCounter$: Subject<number>;

    beforeEach(async () => {
        spawnCounter$ = new Subject<number>();

        mockCounterService = jasmine.createSpyObj('ObjectCounterService', ['incrementCounter'], {
            counter$: of(0),
            spawnCounter$: spawnCounter$.asObservable(),
        });

        mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
            events: of(new NavigationEnd(1, '/', '/home')),
        });

        await TestBed.configureTestingModule({
            imports: [ObjectsComponent],
            providers: [
                { provide: ObjectCounterService, useValue: mockCounterService },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectsComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize range with values from 0 to 7', () => {
        expect(component.range).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    it('should subscribe to spawnCounter$ and update items when value is 0', () => {
        // Ensure ObjectsTypes.SPAWN is defined in the mock setup
        const spawnIndex = ObjectsTypes.SPAWN || 0;

        const mockItem = new ItemComponent(mockCounterService);
        mockItem.type = spawnIndex;
        mockItem.isPlaced = false;

        // Ensure the array has enough elements
        component.items = [];
        component.items[spawnIndex] = mockItem;

        spawnCounter$.next(0);

        expect(component.items[spawnIndex].isPlaced).toBeTrue();
    });

    it('should call resetComponent on init', () => {
        spyOn(component, 'resetComponent');
        component.ngOnInit();
        expect(component.resetComponent).toHaveBeenCalled();
    });

    it('should call resetComponent on NavigationEnd event', () => {
        spyOn(component, 'resetComponent');
        component.ngOnInit();
        expect(component.resetComponent).toHaveBeenCalled();
    });

    it('should reset items array in resetComponent', () => {
        component.resetComponent();
        expect(component.items.length).toBe(8);
        expect(component.items.every((item) => item instanceof ItemComponent)).toBeTrue();
    });

    it('should generate a correct range of numbers', () => {
        const result = component.generateRange(3, 6);
        expect(result).toEqual([3, 4, 5, 6]);
    });

    it('should add an item to items array when onItemAdded is called', () => {
        const newItem = new ItemComponent(mockCounterService);
        component.onItemAdded(newItem);
        expect(component.items.includes(newItem)).toBeTrue();
    });

    it('should call incrementCounter in ObjectCounterService when incrementCounter is called', () => {
        const mockItem = new ItemComponent(mockCounterService);
        mockItem.type = 2;

        component.incrementCounter(mockItem);

        expect(mockCounterService.incrementCounter).toHaveBeenCalledWith(2);
    });

    it('should handle drag-and-drop event correctly', () => {
        const item1 = new ItemComponent(mockCounterService);
        item1.type = 1;
        item1.isPlaced = true;

        const item2 = new ItemComponent(mockCounterService);
        item2.type = 2;

        component.items = [item1, item2];

        const event: CdkDragDrop<ItemComponent[]> = {
            previousContainer: { data: component.items } as never,
            container: { data: [] } as never,
            previousIndex: 0,
            currentIndex: 0,
            item: {} as never,
            isPointerOverContainer: true,
            distance: { x: 0, y: 0 },
            dropPoint: {
                x: 0,
                y: 0,
            },
            event: {} as never,
        };

        spyOn(component, 'incrementCounter');

        component.drop(event);

        expect(item1.isPlaced).toBeFalse();
        expect(component.incrementCounter).toHaveBeenCalledWith(item1);
    });

    it('should unsubscribe from subscriptions on destroy', () => {
        const mockSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);

        component['subscriptions'].push(mockSubscription);

        component.ngOnDestroy();

        expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
});
