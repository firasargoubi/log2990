/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LobbyService } from '@app/services/lobby.service';
import { BehaviorSubject, of } from 'rxjs';
import { CountdownPlayerComponent } from './countdown-player.component';

describe('CountdownPlayerComponent', () => {
    let component: CountdownPlayerComponent;
    let fixture: ComponentFixture<CountdownPlayerComponent>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;

    const mockIsInCombat$ = new BehaviorSubject<boolean>(false);

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('LobbyService', ['requestEndTurn', 'updateCombatTime', 'onCombatUpdate']);
        spy.onCombatUpdate.and.returnValue(of({ timeLeft: 30 }));
        Object.defineProperty(spy, 'isInCombat$', {
            get: () => mockIsInCombat$,
        });

        await TestBed.configureTestingModule({
            imports: [],
            providers: [{ provide: LobbyService, useValue: spy }],
        }).compileComponents();

        lobbyServiceSpy = TestBed.inject(LobbyService) as jasmine.SpyObj<LobbyService>;
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
        mockIsInCombat$.next(false);
        if (component['interval'] !== null) {
            clearInterval(component['interval']);
            component['interval'] = null;
        }
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should initialize with correct values', () => {
        fixture.detectChanges();
        expect(component['remainingTime']).toBe(60);
    });

    it('should decrement remainingTime during countdown', fakeAsync(() => {
        fixture.detectChanges();
        component['startCountdown'](10);
        expect(component['remainingTime']).toBe(60);

        tick(1000);
        expect(component['remainingTime']).toBe(59);

        if (component['interval'] !== null) {
            clearInterval(component['interval']);
            component['interval'] = null;
        }
    }));

    it('should pause countdown correctly', () => {
        fixture.detectChanges();
        component['remainingTime'] = 30;
        component['startCountdown'](component['remainingTime']);

        expect(component['interval']).not.toBeNull();

        component['pauseCountdown']();

        expect(component['interval']).toBeNull();
        expect(lobbyServiceSpy.updateCombatTime).toHaveBeenCalledWith(30);
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

    it('should unsubscribe and clear interval on destroy', () => {
        fixture.detectChanges();

        component['interval'] = window.setInterval(() => {}, 1000);

        const subscriptionSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        component['combatStatusSubscription'] = subscriptionSpy;

        component.ngOnDestroy();

        expect(component['interval']).toBeNull();
        expect(subscriptionSpy.unsubscribe).toHaveBeenCalled();
    });

    it('should handle unsubscribe safely when subscription is null', () => {
        fixture.detectChanges();

        component['combatStatusSubscription'] = null;
        expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should handle interval correctly when timer reaches zero', fakeAsync(() => {
        fixture.detectChanges();
        component['remainingTime'] = 1;
        component['startCountdown'](component['remainingTime']);

        tick(1000);
        expect(component['remainingTime']).toBe(0);
    }));
    it('should pause countdown when entering combat', () => {
        fixture.detectChanges();
        component['remainingTime'] = 30;
        component['startCountdown'](component['remainingTime']);

        expect(component['interval']).not.toBeNull();

        mockIsInCombat$.next(true);

        expect(component['interval']).toBeNull();
        expect(lobbyServiceSpy.updateCombatTime).toHaveBeenCalledWith(30);
    });
});
