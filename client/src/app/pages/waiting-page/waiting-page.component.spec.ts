import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaitingPageComponent } from './waiting-page.component';

const RANDOM = 1000;

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should generate a random number on initialization', () => {
        spyOn(component, 'generateRandomNumber').and.callThrough();
        component.ngOnInit();
        expect(component.generateRandomNumber).toHaveBeenCalled();
        expect(component.randomNumber).toBeGreaterThanOrEqual(RANDOM);
    });

    it('should generate a random number within the specified range', () => {
        component.generateRandomNumber();
        expect(component.randomNumber).toBeGreaterThanOrEqual(RANDOM);
    });
});
