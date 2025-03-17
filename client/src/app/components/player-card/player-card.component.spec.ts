import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerCardComponent } from './player-card.component';
import { Player } from '@common/player';

describe('PlayerCardComponent', () => {
    let component: PlayerCardComponent;
    let fixture: ComponentFixture<PlayerCardComponent>;
    const mockPlayer: Player = {
        id: '1',
        name: 'Player 1',
        avatar: '',
        isHost: false,
        life: 0,
        speed: 0,
        attack: 0,
        defense: 0,
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PlayerCardComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerCardComponent);
        component = fixture.componentInstance;

        component.player = mockPlayer;
        component.currentPlayer = mockPlayer;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return true if current player is host', () => {
        component.currentPlayer = mockPlayer;
        component.hostId = '1';
        expect(component.isHost()).toBeTrue();
    });

    it('should return false if current player is not host', () => {
        component.currentPlayer = mockPlayer;
        component.hostId = '2';
        expect(component.isHost()).toBeFalse();
    });

    it('should emit remove event with player id on remove', () => {
        spyOn(component.remove, 'emit');
        component.player = mockPlayer;
        component.onRemovePlayer();
        expect(component.remove.emit).toHaveBeenCalledWith('1');
    });
});
