import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingPageComponent } from './waiting-page.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

const RANDOM = 1000;
const RANDOM_MAX = 9000;

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent], // ✅ FIX: Use imports instead of declarations
            providers: [
                { 
                    provide: ActivatedRoute, 
                    useValue: { params: of({}) }  // Mock ActivatedRoute with an observable
                }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should generate a random number on initialization', () => {
        spyOn(component, 'generateRandomNumber').and.callThrough();
        component.ngOnInit();
        expect(component.generateRandomNumber).toHaveBeenCalled();
        expect(component.randomNumber).toBeGreaterThanOrEqual(RANDOM);
        expect(component.randomNumber).toBeLessThanOrEqual(RANDOM + RANDOM_MAX);
    });

    it('should generate a random number within the specified range', () => {
        component.generateRandomNumber();
        expect(component.randomNumber).toBeGreaterThanOrEqual(RANDOM);
        expect(component.randomNumber).toBeLessThanOrEqual(RANDOM + RANDOM_MAX);
    });

    it('should define a random number after initialization', () => {
        component.ngOnInit();
        expect(component.randomNumber).toBeDefined();
    });

    it('should generate a random number between 1000 and 10000', () => {
        component.ngOnInit();
        expect(component.randomNumber).toBeGreaterThanOrEqual(1000);
        expect(component.randomNumber).toBeLessThanOrEqual(10000);
    });

    it('should call generateRandomNumber when ngOnInit is called', () => {
        spyOn(component, 'generateRandomNumber');
        component.ngOnInit();
        expect(component.generateRandomNumber).toHaveBeenCalled();
    });

    it('should have a defined randomNumber property', () => {
        expect(component.randomNumber).toBeDefined();
    });

    it('should have a randomNumber property of type number', () => {
        component.ngOnInit();
        expect(typeof component.randomNumber).toBe('number');
    });

    it('should have a randomNumber property within the correct range after calling generateRandomNumber', () => {
        component.generateRandomNumber();
        expect(component.randomNumber).toBeGreaterThanOrEqual(RANDOM);
        expect(component.randomNumber).toBeLessThanOrEqual(RANDOM + RANDOM_MAX);
    });

    it('should update randomNumber when generateRandomNumber is called', () => {
        const initialRandomNumber = component.randomNumber;
        component.generateRandomNumber();
        expect(component.randomNumber).not.toBe(initialRandomNumber);
    });

    it('should call generateRandomNumber exactly once during ngOnInit', () => {
        const spy = spyOn(component, 'generateRandomNumber').and.callThrough();
        component.ngOnInit();
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
