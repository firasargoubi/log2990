import { TestBed } from '@angular/core/testing';
import { LobbyService } from './lobby.service';
import { TurnTimerService } from './turn-timer.service';

describe('TurnTimerService', () => {
    let service: TurnTimerService;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('LobbyService', ['updateCombatTime']);

        TestBed.configureTestingModule({
            providers: [TurnTimerService, { provide: LobbyService, useValue: spy }],
        });

        service = TestBed.inject(TurnTimerService);
        lobbyServiceSpy = TestBed.inject(LobbyService) as jasmine.SpyObj<LobbyService>;
    });

    afterEach(() => {
        service.clearCountdown();
        jasmine.clock().uninstall();
    });

    it('should start countdown and update timer correctly', () => {
        jasmine.clock().install();
        const onTickSpy = jasmine.createSpy('onTick');
        const onEndSpy = jasmine.createSpy('onEnd');

        service.startCountdown(3, 'player1', onTickSpy, onEndSpy);

        jasmine.clock().tick(1000);
        expect(onTickSpy).toHaveBeenCalledWith(2);
        expect(lobbyServiceSpy.updateCombatTime).toHaveBeenCalledWith(2);

        jasmine.clock().tick(1000);
        expect(onTickSpy).toHaveBeenCalledWith(1);
        expect(lobbyServiceSpy.updateCombatTime).toHaveBeenCalledWith(1);

        jasmine.clock().tick(1000);
        expect(onTickSpy).toHaveBeenCalledWith(0);
        expect(lobbyServiceSpy.updateCombatTime).toHaveBeenCalledWith(0);

        jasmine.clock().tick(1000);
        expect(onEndSpy).toHaveBeenCalled();
    });

    it('should not start countdown if remainingTime is 0', () => {
        const onTickSpy = jasmine.createSpy('onTick');
        service.startCountdown(0, 'player1', onTickSpy);
        expect(onTickSpy).not.toHaveBeenCalled();
    });

    it('should clear countdown', () => {
        jasmine.clock().install();
        const onTickSpy = jasmine.createSpy('onTick');

        service.startCountdown(5, 'player1', onTickSpy);
        jasmine.clock().tick(1000);
        expect(onTickSpy).toHaveBeenCalled();

        service.clearCountdown();
        jasmine.clock().tick(2000);
        // Should not be called again after clearing
        expect(onTickSpy.calls.count()).toBe(1);
    });
});
