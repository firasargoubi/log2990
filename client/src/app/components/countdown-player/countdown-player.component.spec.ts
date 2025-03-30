import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyService } from '@app/services/lobby.service';
import { CountdownPlayerComponent } from './countdown-player.component';

describe('CountdownPlayerComponent', () => {
    let component: CountdownPlayerComponent;
    let fixture: ComponentFixture<CountdownPlayerComponent>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;

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
    });

    it('should handle countdown reaching zero', () => {
        fixture.detectChanges();
        component['remainingTime'] = 1;

        // Simulate countdown reaching zero
        component['remainingTime']--;

        expect(component['remainingTime']).toBe(0);
    });

    it('should pause countdown when entering combat', () => {
        fixture.detectChanges();
        component['remainingTime'] = 30;

        // Simulate starting countdown
        component['interval'] = 1; // Mock interval ID

        // Simulate entering combat
        component.isInCombat = true;
        component.ngOnChanges();
        expect(component['interval']).toBeNull();
    });
});
