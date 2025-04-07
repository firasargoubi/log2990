/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PlayerListComponent } from './player-list.component';
import { PlayerCardComponent } from '@app/components/player-card/player-card.component';
import { Player } from '@common/player';
import { DebugElement } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LobbyService } from '@app/services/lobby.service';
import { of } from 'rxjs';
import { VirtualPlayerDialogComponent } from '@app/components/virtual-player-dialog/virtual-player-dialog.component';

describe('PlayerListComponent', () => {
    let component: PlayerListComponent;
    let fixture: ComponentFixture<PlayerListComponent>;
    let mockPlayers: Player[];
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<any>>;

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
                pendingItem: 0,
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
                pendingItem: 0,
            },
        ];

        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
        mockLobbyService = jasmine.createSpyObj('LobbyService', ['joinLobby']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);

        await TestBed.configureTestingModule({
            imports: [PlayerListComponent, PlayerCardComponent],
            providers: [{ provide: LobbyService, useValue: mockLobbyService }],
        }).compileComponents();

        TestBed.overrideProvider(MatDialog, { useValue: mockDialog });

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

    it('should open the virtual player dialog and call joinLobby if a result is returned', () => {
        const mockResult = {
            id: '3',
            name: 'Virtual Player',
            avatar: '',
            isHost: false,
            life: 0,
            speed: 0,
            attack: 0,
            defense: 0,
            maxLife: 0,
            winCount: 0,
            pendingItem: 0,
        };

        mockDialogRef.afterClosed.and.returnValue(of(mockResult));
        mockDialog.open.and.returnValue(mockDialogRef);

        component.openVirtualPlayerDialog();

        expect(mockDialog.open).toHaveBeenCalledWith(VirtualPlayerDialogComponent, {});
        expect(mockLobbyService.joinLobby).toHaveBeenCalledWith(component.lobbyId, mockResult);
    });

    it('should not call joinLobby if dialog result is null', () => {
        mockDialogRef.afterClosed.and.returnValue(of(null));
        mockDialog.open.and.returnValue(mockDialogRef);

        component.openVirtualPlayerDialog();

        expect(mockDialog.open).toHaveBeenCalledWith(VirtualPlayerDialogComponent, {});
        expect(mockLobbyService.joinLobby).not.toHaveBeenCalled();
    });
});
