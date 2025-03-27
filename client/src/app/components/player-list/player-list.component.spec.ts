import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerListComponent } from './player-list.component';
import { By } from '@angular/platform-browser';
import { PlayerCardComponent } from '@app/components/player-card/player-card.component';
import { Player } from '@common/player';
import { DebugElement } from '@angular/core';

describe('PlayerListComponent', () => {
    let component: PlayerListComponent;
    let fixture: ComponentFixture<PlayerListComponent>;
    let mockPlayers: Player[];

    beforeEach(async () => {
        mockPlayers = [
            {
                id: '1',
                name: 'Player 1',
                avatar: '',
                isHost: false,
                life: 0,
                speed: 0,
                attack: 0,
                defense: 0,
                maxLife: 0,
                winCount: 0,
            },
            {
                id: '2',
                name: 'Player 2',
                avatar: '',
                isHost: false,
                life: 0,
                speed: 0,
                attack: 0,
                defense: 0,
                maxLife: 0,
                winCount: 0,
            },
        ];

        await TestBed.configureTestingModule({
            imports: [PlayerListComponent, PlayerCardComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerListComponent);
        component = fixture.componentInstance;
        component.players = mockPlayers;
        component.currentPlayer = mockPlayers[0];
        component.hostId = '1';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render player cards', () => {
        const playerCards: DebugElement[] = fixture.debugElement.queryAll(By.directive(PlayerCardComponent));
        expect(playerCards.length).toBe(mockPlayers.length);
    });

    it('should identify the host correctly', () => {
        expect(component.isHost(mockPlayers[0])).toBeTrue();
        expect(component.isHost(mockPlayers[1])).toBeFalse();
    });

    it('should emit removePlayer event when remove is called', () => {
        spyOn(component.removePlayer, 'emit');
        const playerId = '2';
        component.remove(playerId);
        expect(component.removePlayer.emit).toHaveBeenCalledWith(playerId);
    });
});
