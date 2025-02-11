import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemComponent } from './item.component';

describe('ItemComponent', () => {
    let component: ItemComponent;
    let fixture: ComponentFixture<ItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ItemComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should render item type', () => {
        component.item = { type: 'Test Type' };
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.item-type').textContent).toContain('Test Type');
    });
    it('should render item name', () => {
        component.item = { name: 'Test Item' };
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.item-name').textContent).toContain('Test Item');
    });
    it('should render item description', () => {
        component.item = { description: 'Test Description' };
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.item-description').textContent).toContain('Test Description');
    });
    it('should render item image', () => {
        component.item = { image: 'test.jpg' };
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.item-image').src).toContain('test.jpg');
    });
    it('should emit itemAdded event with component instance when initialized', () => {
        const component = new ItemComponent(new ObjectCounterService());
        const emitSpy = jest.spyOn(component.itemAdded, 'emit');

        component.ngOnInit();

        expect(emitSpy).toHaveBeenCalledWith(component);
    });
    it('should initialize object counter with TWO when mapSize is small', () => {
        const objectCounterService = new ObjectCounterService();
        const initializeCounterSpy = jest.spyOn(objectCounterService, 'initializeCounter');
        const component = new ItemComponent(objectCounterService);
        component.mapSize = 'small';

        component.ngOnInit();

        expect(initializeCounterSpy).toHaveBeenCalledWith(ObjectAmount.TWO);
    });
    it('should initialize object counter with FOUR when mapSize is medium', () => {
        const objectCounterService = new ObjectCounterService();
        const initializeCounterSpy = jest.spyOn(objectCounterService, 'initializeCounter');
        const component = new ItemComponent(objectCounterService);
        component.mapSize = 'medium';

        component.ngOnInit();

        expect(initializeCounterSpy).toHaveBeenCalledWith(ObjectAmount.FOUR);
    });
    it('should initialize object counter with SIX when mapSize is large', () => {
        const objectCounterService = new ObjectCounterService();
        const initializeCounterSpy = jest.spyOn(objectCounterService, 'initializeCounter');
        const component = new ItemComponent(objectCounterService);
        component.mapSize = 'large';

        component.ngOnInit();

        expect(initializeCounterSpy).toHaveBeenCalledWith(ObjectAmount.SIX);
    });
    it('should return Undefined when type is invalid in name getter', () => {
        const component = new ItemComponent({} as ObjectCounterService);
        component.type = 999;

        expect(component.name).toBe('Undefined');
    });
    it('should return Undefined when type is invalid in image getter', () => {
        const component = new ItemComponent({} as ObjectCounterService);
        component.type = 999;

        expect(component.image).toBe('Undefined');
    });
    it('should initialize counter with correct amount and emit itemAdded when initialized', () => {
        const objectCounterServiceMock = {
            initializeCounter: jest.fn(),
        };

        const component = new ItemComponent(objectCounterServiceMock as unknown);
        const emitSpy = jest.spyOn(component.itemAdded, 'emit');

        component.mapSize = 'medium';
        component.ngOnInit();

        expect(objectCounterServiceMock.initializeCounter).toHaveBeenCalledWith(ObjectAmount.FOUR);
        expect(emitSpy).toHaveBeenCalledWith(component);
    });
});
