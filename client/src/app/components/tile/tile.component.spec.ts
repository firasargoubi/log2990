import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TileComponent } from './tile.component';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { ItemComponent } from '@app/components/item/item.component';
import { TileTypes } from '@app/interfaces/tileTypes';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';
import { of } from 'rxjs';

const SPAWN_COUNTER = 5;
describe('TileComponent', () => {
    let component: TileComponent;
    let fixture: ComponentFixture<TileComponent>;
    let counterService: jasmine.SpyObj<ObjectCounterService>;

    beforeEach(async () => {
        const counterServiceSpy = jasmine.createSpyObj('ObjectCounterService', ['decrementCounter', 'incrementCounter'], {
            spawnCounter$: of(SPAWN_COUNTER),
        });

        await TestBed.configureTestingModule({
            imports: [TileComponent],
            providers: [{ provide: ObjectCounterService, useValue: counterServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(TileComponent);
        component = fixture.componentInstance;
        counterService = TestBed.inject(ObjectCounterService) as jasmine.SpyObj<ObjectCounterService>;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set baseImage correctly based on type', () => {
        component.type = TileTypes.Grass;
        expect(component.baseImage).toBe('assets/tiles/grass.png');

        component.type = TileTypes.Water;
        expect(component.baseImage).toBe('assets/tiles/water.png');

        component.type = TileTypes.Ice;
        expect(component.baseImage).toBe('assets/tiles/ice2.png');

        component.type = TileTypes.Wall;
        expect(component.baseImage).toBe('assets/tiles/wall.png');

        component.type = TileTypes.DoorClosed;
        expect(component.baseImage).toBe('assets/tiles/door_c.png');

        component.type = TileTypes.DoorOpen;
        expect(component.baseImage).toBe('assets/tiles/door_o.png');
    });

    it('should emit objectChanged with 0 if placedItem is empty or objectID is 0', () => {
        spyOn(component.objectChanged, 'emit');

        component.refreshObject();
        expect(component.objectChanged.emit).toHaveBeenCalledWith(0);

        component.objectID = 1;
        component.refreshObject();
        expect(component.objectChanged.emit).toHaveBeenCalledWith(0);
    });

    it('should emit objectChanged with objectID if placedItem is not empty', () => {
        spyOn(component.objectChanged, 'emit');

        component.objectID = 1;
        component.placedItem.push(new ItemComponent(counterService));
        component.refreshObject();
        expect(component.objectChanged.emit).toHaveBeenCalledWith(1);
    });

    it('should decrement counter and set isPlaced to true', () => {
        const item = new ItemComponent(counterService);
        item.type = ObjectsTypes.SPAWN;
        component.decrementCounter(item);
        expect(counterService.decrementCounter).toHaveBeenCalledWith(ObjectsTypes.SPAWN);
        expect(item.isPlaced).toBeFalse();
    });

    it('should handle drop event correctly', () => {
        const item = new ItemComponent(counterService);
        item.type = ObjectsTypes.SPAWN;
        const event: CdkDragDrop<ItemComponent[]> = {
            previousContainer: { data: [item], id: 'objects-container' } as any,
            container: { data: [], id: 'tile-container' } as any,
            previousIndex: 0,
            currentIndex: 0,
            item: {} as any,
            isPointerOverContainer: true,
            distance: { x: 0, y: 0 },
            dropPoint: { x: 0, y: 0 },
            event: {} as any,
        };

        component.type = TileTypes.Grass;
        spyOn(component.objectMoved, 'emit');
        component.drop(event);
        expect(component.placedItem.length).toBe(1);
        expect(component.objectID).toBe(item.type);
        expect(component.objectMoved.emit).toHaveBeenCalledWith(true);
    });

    it('should initialize placedItem and decrement counter if objectID is not 0', () => {
        component.objectID = 1;
        const object = new ItemComponent(counterService);
        spyOn(component, 'getObjectById').and.returnValue(object);
        spyOn(component, 'decrementCounter');

        component.ngOnInit();

        expect(component.getObjectById).toHaveBeenCalledWith(1);
        expect(component.placedItem.length).toBe(1);
        expect(component.placedItem[0]).toBe(object);
        expect(component.decrementCounter).toHaveBeenCalledWith(object);
    });

    it('should not initialize placedItem if objectID is 0', () => {
        component.objectID = 0;
        spyOn(component, 'getObjectById');
        spyOn(component, 'decrementCounter');

        component.ngOnInit();

        expect(component.getObjectById).not.toHaveBeenCalled();
        expect(component.placedItem.length).toBe(0);
        expect(component.decrementCounter).not.toHaveBeenCalled();
    });

    it('should return the correct object by ID', () => {
        const objectData = { id: 1, description: 'Test Object' };
        const item = component.getObjectById(objectData.id);
        expect(item).toBeTruthy();
        if (item) {
            expect(item.type).toBe(objectData.id);
        }
    });

    it('should return null if object ID is not found', () => {
        const item = component.getObjectById(-1);
        expect(item).toBeNull();
    });
    it('should decrement counter and set isPlaced to true for RANDOM type', () => {
        const item = new ItemComponent(counterService);
        item.type = ObjectsTypes.RANDOM;
        component.decrementCounter(item);
        expect(counterService.decrementCounter).toHaveBeenCalledWith(ObjectsTypes.RANDOM);
        expect(item.isPlaced).toBeFalse();
    });
    it('should not change if dragged to the same place', () => {
        const item = new ItemComponent(counterService);
        item.type = ObjectsTypes.SPAWN;
        component.placedItem.push(item);
        const event: CdkDragDrop<ItemComponent[]> = {
            previousContainer: { data: component.placedItem, id: 'tile-container' } as any,
            container: { data: component.placedItem, id: 'tile-container' } as any,
            previousIndex: 0,
            currentIndex: 0,
            item: {} as any,
            isPointerOverContainer: true,
            distance: { x: 0, y: 0 },
            dropPoint: { x: 0, y: 0 },
            event: {} as any,
        };

        component.drop(event);
        expect(component.placedItem.length).toBe(1);
        expect(component.objectID).toBe(item.type);
    });

    it('should not change if dragged to an illegal place', () => {
        const item = new ItemComponent(counterService);
        item.type = ObjectsTypes.SPAWN;
        const event: CdkDragDrop<ItemComponent[]> = {
            previousContainer: { data: [item], id: 'objects-container' } as any,
            container: { data: [] } as any,
            previousIndex: 0,
            currentIndex: 0,
            item: {} as any,
            isPointerOverContainer: true,
            distance: { x: 0, y: 0 },
            dropPoint: { x: 0, y: 0 },
            event: {} as any,
        };

        component.type = TileTypes.Wall;
        component.drop(event);
        expect(component.placedItem.length).toBe(0);
        expect(component.objectID).toBe(0);
    });

    it('should delete the tile object and increment the counter', () => {
        const item = new ItemComponent(counterService);
        item.type = ObjectsTypes.SPAWN;
        component.placedItem.push(item);
        component.objectID = item.type;

        spyOn(component.objectChanged, 'emit');

        component.deleteTile();

        expect(counterService.incrementCounter).toHaveBeenCalledWith(item.type);
        expect(component.placedItem.length).toBe(0);
        expect(component.objectID).toBe(0);
        expect(component.objectChanged.emit).toHaveBeenCalledWith(0);
    });

    it('should not increment the counter if placedItem is empty', () => {
        component.placedItem = [];
        component.objectID = 0;

        spyOn(component.objectChanged, 'emit');

        component.deleteTile();

        expect(counterService.incrementCounter).not.toHaveBeenCalled();
        expect(component.placedItem.length).toBe(0);
        expect(component.objectID).toBe(0);
        expect(component.objectChanged.emit).toHaveBeenCalledWith(0);
    });
});
