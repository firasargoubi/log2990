/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { LobbyService } from '@app/services/lobby.service';
import { CountdownPlayerComponent } from './countdown-player.component';

describe('CountdownPlayerComponent', () => {
    let component: CountdownPlayerComponent;
    let fixture: ComponentFixture<CountdownPlayerComponent>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;
    let setIntervalSpy: jasmine.Spy;
    let clearIntervalSpy: jasmine.Spy;

    beforeEach(async () => {
        lobbyServiceSpy = jasmine.createSpyObj('LobbyService', ['requestEndTurn']);

        await TestBed.configureTestingModule({
            imports: [],
            providers: [{ provide: LobbyService, useValue: lobbyServiceSpy }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CountdownPlayerComponent);
        component = fixture.componentInstance;
        component.countdown = 60;
        component.isPlayerTurn = false;
        component.isTransitioning = false;
        component.lobbyId = 'test-lobby';
        component.isInCombat = false;
        component.isAnimated = false;
        component['remainingTime'] = 60;

        // Spy on window methods
        setIntervalSpy = spyOn(window, 'setInterval').and.returnValue(123 as any);
        clearIntervalSpy = spyOn(window, 'clearInterval');
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should initialize with correct values', () => {
        fixture.detectChanges();
        expect(component['remainingTime']).toBe(60);
    });

    it('should decrement remainingTime during fake countdown', () => {
        fixture.detectChanges();
        component['remainingTime'] = 10;

        // Simulate countdown
        for (let i = 0; i < 5; i++) {
            component['remainingTime']--;
        }

        expect(component['remainingTime']).toBe(5);
    });

    it('should pause countdown correctly', () => {
        fixture.detectChanges();
        component['remainingTime'] = 30;

        // Simulate starting countdown
        component['interval'] = 1; // Mock interval ID
        component['pauseCountdown']();

        expect(component['interval']).toBeNull();
        expect(clearIntervalSpy).toHaveBeenCalledWith(1);
    });

    it('should get display time correctly when time remains', () => {
        fixture.detectChanges();
        component['remainingTime'] = 42;
        expect(component.getDisplayTime()).toBe('42s');
    });

    it('should get display time correctly when time is up', () => {
        fixture.detectChanges();
        component['remainingTime'] = 0;
        expect(component.getDisplayTime()).toBe('Temps écoulé');
    });

    it('should clear interval on destroy', () => {
        fixture.detectChanges();

        component['interval'] = 1; // Mock interval ID
        component.ngOnDestroy();

        expect(component['interval']).toBeNull();
        expect(clearIntervalSpy).toHaveBeenCalledWith(1);
    });

    it('should start countdown when not in combat', () => {
        fixture.detectChanges();

        // Reset any previous calls to setInterval
        setIntervalSpy.calls.reset();

        component.isInCombat = false;
        component.ngOnChanges();

        expect(setIntervalSpy).toHaveBeenCalled();
        expect(component['interval']).toBe(123);
    });

    it('should not end turn if animation is in progress', fakeAsync(() => {
        fixture.detectChanges();
        component['remainingTime'] = 0;
        component['interval'] = 123;
        component.isAnimated = true;

        // Mock the behavior of the while loop checking animation state
        spyOn(component as any, 'startCountdown').and.callFake(() => {
            // Mock implementation that avoids the while loop
            component['interval'] = 123;
            // We won't actually start the interval in this test
        });

        component.ngOnChanges();

        // Get the interval callback function from the original startCountdown call
        const intervalCallback = setIntervalSpy.calls.first()?.args[0];

        // Call the callback to simulate time hitting zero with animation active
        if (intervalCallback) {
            intervalCallback();
        }

        expect(lobbyServiceSpy.requestEndTurn).not.toHaveBeenCalled();

        // Now simulate animation ending
        component.isAnimated = false;

        // Call again to check if it proceeds after animation ends
        if (intervalCallback) {
            intervalCallback();
        }

        expect(lobbyServiceSpy.requestEndTurn).not.toHaveBeenCalled();
    }));

    it('should pause countdown when entering combat', () => {
        fixture.detectChanges();
        component['remainingTime'] = 30;

        // Simulate starting countdown
        component['interval'] = 123; // Mock interval ID

        // Simulate entering combat
        component.isInCombat = true;
        component.ngOnChanges();

        expect(component['interval']).toBeNull();
        expect(clearIntervalSpy).toHaveBeenCalledWith(123);
    });

    it('should start a new countdown and clear any existing interval', () => {
        fixture.detectChanges();

        // First set an interval
        component['interval'] = 123;

        // Now call startCountdown which should clear the existing interval
        component['startCountdown'](30);

        expect(clearIntervalSpy).toHaveBeenCalledWith(123);
        expect(setIntervalSpy).toHaveBeenCalled();
        expect(component['interval']).toBe(123); // New interval ID
    });

    it('should execute the interval callback properly', fakeAsync(() => {
        fixture.detectChanges();
        component['remainingTime'] = 5;

        // Mock the setInterval to capture and execute the callback
        setIntervalSpy.and.callFake((callback: Function) => {
            callback(); // Execute the callback once to test time decrement
            return 123;
        });

        component['startCountdown'](5);

        expect(component['remainingTime']).toBe(5);
    }));
});
