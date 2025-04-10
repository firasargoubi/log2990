/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { ItemModel } from '@app/interfaces/item.model';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { GameType, ObjectsTypes } from '@common/game.interface';
import { Subject } from 'rxjs';
import { ObjectsComponent } from './objects.component';

describe('ObjectsComponent', () => {
    let fixture: ComponentFixture<ObjectsComponent>;
    let component: ObjectsComponent;
    let counterServiceSpy: jasmine.SpyObj<ObjectCounterService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let spawnCounterSubject: Subject<number>;
    let itemCounterSubject: Subject<number>;
    let flagPlacedSubject: Subject<boolean>;
    let routerEventsSubject: Subject<any>;

    beforeEach(async () => {
        spawnCounterSubject = new Subject<number>();
        itemCounterSubject = new Subject<number>();
        flagPlacedSubject = new Subject<boolean>();
        routerEventsSubject = new Subject<any>();

        counterServiceSpy = jasmine.createSpyObj('ObjectCounterService', ['incrementCounter', 'isItemPlaced', 'getItemCounter'], {
            spawnCounter$: spawnCounterSubject.asObservable(),
            itemCounter$: itemCounterSubject.asObservable(),
            flagPlaced$: flagPlacedSubject.asObservable(),
        });

        counterServiceSpy.isItemPlaced.and.returnValue(false);

        routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
            events: routerEventsSubject.asObservable(),
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

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Range generation', () => {
        it('should generate range from 1 to 8 when gameMode is not "capture"', () => {
            component.gameMode = 'normal' as GameType;
            component.ngOnInit();
            expect(component['range']).toEqual([
                ObjectsTypes.BOOTS,
                ObjectsTypes.SWORD,
                ObjectsTypes.POTION,
                ObjectsTypes.WAND,
                ObjectsTypes.CRYSTAL,
                ObjectsTypes.JUICE,
                ObjectsTypes.SPAWN,
                ObjectsTypes.RANDOM,
            ]);
        });

        it('should generate range from 1 to 9 when gameMode is "capture"', () => {
            component.gameMode = GameType.capture;
            component.ngOnInit();
            expect(component['range']).toEqual([
                ObjectsTypes.BOOTS,
                ObjectsTypes.SWORD,
                ObjectsTypes.POTION,
                ObjectsTypes.WAND,
                ObjectsTypes.CRYSTAL,
                ObjectsTypes.JUICE,
                ObjectsTypes.SPAWN,
                ObjectsTypes.RANDOM,
                ObjectsTypes.FLAG,
            ]);
        });
    });

    describe('Spawn item update', () => {
        it('should set isPlaced to true for spawn item when spawnCounter$ emits 0', () => {
            component.gameMode = 'normal' as GameType;
            component.ngOnInit();
            const spawnItem = component.items.find((item) => item.type === ObjectsTypes.SPAWN);
            expect(spawnItem).toBeDefined();
            expect(spawnItem?.isPlaced).toBeFalse();

            spawnCounterSubject.next(0);
            fixture.detectChanges();
            expect(spawnItem?.isPlaced).toBeTrue();
        });
    });

    describe('Component reset', () => {
        it('should reset items on NavigationEnd event', () => {
            component.gameMode = 'normal' as GameType;
            component.ngOnInit();
            expect(component.items.length).toBe(8);

            const spawnItem = component.items.find((item) => item.type === ObjectsTypes.SPAWN);
            expect(spawnItem).toBeDefined();
            if (spawnItem) {
                spawnItem.isPlaced = true;
            }

            routerEventsSubject.next(new NavigationEnd(1, '/', '/home'));
            fixture.detectChanges();

            expect(component.items.length).toBe(8);
            const newSpawnItem = component.items.find((item) => item.type === ObjectsTypes.SPAWN);
            expect(newSpawnItem).toBeDefined();
            expect(newSpawnItem?.isPlaced).toBeFalse();
        });
    });

    describe('Drag and drop handling', () => {
        it('should call incrementCounter and remove item when dropped outside', () => {
            component.gameMode = 'normal' as GameType;
            component.ngOnInit();
            const initialLength = component.items.length;
            const testItem = component.items[0];

            const mockEvent: CdkDragDrop<ItemModel[]> = {
                previousContainer: { data: component.items } as any,
                container: { data: [] } as any,
                previousIndex: 0,
                currentIndex: 0,
                item: { data: testItem } as any,
                isPointerOverContainer: true,
                distance: { x: 0, y: 0 },
                dropPoint: { x: 0, y: 0 },
                event: {} as any,
            };

            component.drop(mockEvent);
            expect(counterServiceSpy.incrementCounter).toHaveBeenCalledWith(testItem.type);
            expect(component.items.length).toBe(initialLength - 1);
            expect(component.items).not.toContain(testItem);
        });
    });

    describe('Lifecycle methods', () => {
        it('should unsubscribe from all subscriptions on destroy', () => {
            const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
            (component as any).subscriptions = [mockSub];
            component.ngOnDestroy();
            expect(mockSub.unsubscribe).toHaveBeenCalled();
        });
    });

    describe('Map size input', () => {
        it('should accept mapSize input without affecting logic', () => {
            component.mapSize = 'large';
            fixture.detectChanges();
            expect(component.mapSize).toBe('large');
        });
    });
});
