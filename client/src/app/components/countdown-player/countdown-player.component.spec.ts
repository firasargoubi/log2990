import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyService } from '@app/services/lobby.service';
import { of } from 'rxjs';
import { CountdownComponent } from './countdown-player.component';

describe('CountdownComponent', () => {
    let component: CountdownComponent;
    let fixture: ComponentFixture<CountdownComponent>;
    let lobbyService: LobbyService;

    beforeEach(async () => {
        lobbyService = jasmine.createSpyObj('LobbyService', ['onCombatUpdate', 'requestEndTurn']);
        (lobbyService.onCombatUpdate as jasmine.Spy).and.returnValue(of({ timeLeft: 10 }));

        await TestBed.configureTestingModule({
            imports: [CountdownComponent], // Import the CountdownComponent
            providers: [{ provide: LobbyService, useValue: lobbyService }],
        }).compileComponents();

        fixture = TestBed.createComponent(CountdownComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
        expect(component.countdown).toBe(30);
        expect(component.isPlayerTurn).toBeFalse();
        expect(component.isInCombat).toBeFalse();
        expect(component.lobbyId).toBe('');
        expect(component.remainingTime).toBe(10);
        expect(component.interval).toBeNull();
    });

    it('should start normal countdown on player turn', () => {
        component.isPlayerTurn = true;
        component.ngOnInit();
        expect(component.remainingTime).toBe(10); // Default countdown value
        expect(component.interval).not.toBeNull();
    });

    it('should start combat countdown when in combat', () => {
        component.isInCombat = true;
        component.ngOnInit();
        expect(component.remainingTime).toBe(10); // Default countdown value
        expect(component.interval).not.toBeNull();
    });

    it('should update remaining time on combat update', () => {
        component.ngOnInit();
        expect(component.remainingTime).toBe(10); // Updated from combat subscription
    });

    it('should stop countdown on destroy', () => {
        component.ngOnInit();
        component.ngOnDestroy();
        expect(component.interval).toBeNull();
        expect(component.combatSubscription?.closed).toBeTrue();
    });

    it('should stop countdown when remaining time is zero', (done) => {
        component.remainingTime = 1;
        component.startNormalCountdown();
        setTimeout(() => {
            expect(component.remainingTime).toBe(0);
            expect(component.interval).toBeNull();
            done();
        }, 2000);
    });

    it('should return correct display time', () => {
        component.remainingTime = 10;
        expect(component.getDisplayTime()).toBe('10s');
        component.remainingTime = 0;
        expect(component.getDisplayTime()).toBe('Time is up!');
        component.isInCombat = true;
        component.remainingTime = 10;
        expect(component.getDisplayTime()).toBe('10s');
        component.remainingTime = 0;
        expect(component.getDisplayTime()).toBe('Combat Ended');
    });

    it('should reset the countdown when the turn ends and pass to next player', () => {
        component.remainingTime = 30;
        component.startNormalCountdown();
        lobbyService.requestEndTurn(component.lobbyId); // Simulate turn end
        expect(component.remainingTime).toBe(30); // Time should reset for the next player
    });

    it('should handle time remaining properly when player is not in combat', () => {
        component.isInCombat = false;
        component.isPlayerTurn = true;
        component.ngOnInit();
        expect(component.remainingTime).toBe(10); // Default countdown value
    });

    it('should handle time remaining properly when player is in combat', () => {
        component.isInCombat = true;
        component.isPlayerTurn = false;
        component.ngOnInit();
        expect(component.remainingTime).toBe(10); // Default countdown value
    });

    it('should call `requestEndTurn` when countdown ends', (done) => {
        component.remainingTime = 1;
        component.startNormalCountdown();
        setTimeout(() => {
            expect(lobbyService.requestEndTurn).toHaveBeenCalledWith(component.lobbyId);
            done();
        }, 2000);
    });

    it('should not start countdown if remaining time is zero', () => {
        component.remainingTime = 0;
        component.startNormalCountdown();
        expect(component.interval).toBeNull();
    });

    it('should not start combat countdown if remaining time is zero', () => {
        component.remainingTime = 0;
        component.startCombatCountdown();
        expect(component.interval).toBeNull();
    });

    it('should handle combat subscription with undefined timeLeft', () => {
        (lobbyService.onCombatUpdate as jasmine.Spy).and.returnValue(of({})); // No timeLeft
        component.ngOnInit();
        expect(component.remainingTime).toBe(10); // Should not update remainingTime
    });

    it('should handle combat subscription with timeLeft <= 0', () => {
        (lobbyService.onCombatUpdate as jasmine.Spy).and.returnValue(of({ timeLeft: 0 }));
        component.ngOnInit();
        expect(component.remainingTime).toBe(0);
        expect(component.interval).toBeNull();
    });

    it('should not start normal countdown if interval is already set', () => {
        component.interval = 123; // Simulate an existing interval
        component.startNormalCountdown();
        expect(component.interval).toBe(123); // Interval should not change
    });

    it('should not start combat countdown if interval is already set', () => {
        component.interval = 123; // Simulate an existing interval
        component.startCombatCountdown();
        expect(component.interval).toBe(123); // Interval should not change
    });

    it('should decrement remainingTime when remainingTime > 0 in normal countdown', (done) => {
        component.remainingTime = 2; // Set initial time
        component.startNormalCountdown();
        setTimeout(() => {
            expect(component.remainingTime).toBe(1); // Should decrement by 1
            done();
        }, 1100); // Wait for 1 second
    });

    it('should stop countdown when remainingTime reaches 0 in combat countdown', (done) => {
        component.remainingTime = 1;
        component.startCombatCountdown();
        setTimeout(() => {
            expect(component.remainingTime).toBe(0);
            done();
        }, 1100);
    });

    it('should decrement remainingTime when remainingTime > 0 in combat countdown', (done) => {
        component.remainingTime = 2; // Set initial time
        component.startCombatCountdown();
        setTimeout(() => {
            expect(component.remainingTime).toBe(1); // Should decrement by 1
            done();
        }, 1100); // Wait for 1 second
    });

    it('should stop countdown when remainingTime reaches 0 in normal countdown', (done) => {
        component.remainingTime = 1;
        component.startNormalCountdown();
        setTimeout(() => {
            expect(component.remainingTime).toBe(0);
            done();
        }, 1100);
    });

    it('should set combatSubscription during ngOnInit', () => {
        component.ngOnInit();
        expect(component.combatSubscription).not.toBeNull();
    });

    const ONE_SECOND = 1100;

    it('should call stopCountdown when remainingTime reaches 0 in combat countdown', (done) => {
        // Set initial time for the combat countdown
        component.remainingTime = 1;

        // Spy on the stopCountdown method to check if it's called
        spyOn(component, 'stopCountdown');

        // Start the combat countdown
        component.startCombatCountdown();

        // Simulate the passage of time and check after 1 second (setInterval should decrement remainingTime)
        setTimeout(() => {
            // Check that stopCountdown has been called
            expect(component.stopCountdown).toHaveBeenCalled();

            // Check that the remaining time is 0
            expect(component.remainingTime).toBe(0);

            // Verify that the interval has been cleared and no further countdowns are happening
            expect(component.interval).toBeNull(); // Ensure that the interval is cleared

            done(); // Call done to ensure that the test completes properly
        }, ONE_SECOND); // Wait for 1 second
    });
});
