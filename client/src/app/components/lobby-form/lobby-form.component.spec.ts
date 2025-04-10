/* eslint-disable @typescript-eslint/no-magic-numbers */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { MAIN_PAGE_CONSTANTS } from '@app/consts/app-constants';
import { LobbyService } from '@app/services/lobby.service';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { LobbyFormComponent } from './lobby-form.component';

describe('LobbyFormComponent', () => {
    let component: LobbyFormComponent;
    let fixture: ComponentFixture<LobbyFormComponent>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<LobbyFormComponent>>;
    let mockMatDialog: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        mockLobbyService = jasmine.createSpyObj('LobbyService', ['getLobby', 'verifyRoom', 'lockLobby']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);

        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, LobbyFormComponent],
            providers: [
                { provide: LobbyService, useValue: mockLobbyService },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MatDialog, useValue: mockMatDialog },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LobbyFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should open BoxFormDialog when lobby exists and is full but not locked', fakeAsync(() => {
        const mockPlayer: Player = {
            id: 'p1',
            name: 'Player 1',
            avatar: 'avatar1.png',
            isHost: true,
            life: 100,
            speed: 5,
            attack: 10,
            defense: 8,
            maxLife: 0,
            winCount: 0,
            pendingItem: 0,
        };
        const mockLobby: GameLobby = {
            id: '123',
            maxPlayers: 2,
            players: [mockPlayer, { ...mockPlayer, id: 'p2', name: 'Player 2' }],
            gameId: 'game1',
            isLocked: false,
        };

        mockLobbyService.getLobby.and.returnValue(of(mockLobby));
        mockLobbyService.verifyRoom.and.returnValue(of({ exists: true, isLocked: false }));

        const dummyDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dummyDialogRef.afterClosed.and.returnValue(of(true));
        mockMatDialog.open.and.returnValue(dummyDialogRef);

        component.lobbyId = '123';
        component.validateGameId();
        tick();

        expect(mockMatDialog.open).toHaveBeenCalledWith(BoxFormDialogComponent, {
            data: { lobbyId: '123', boxId: 'game1', isJoining: true },
        });
        expect(mockDialogRef.close).toHaveBeenCalledWith('123');
    }));

    it('should open BoxFormDialog and close current dialog when lobby exists', fakeAsync(() => {
        const mockPlayer: Player = {
            id: 'p1',
            name: 'Player 1',
            avatar: 'avatar1.png',
            isHost: true,
            life: 100,
            speed: 5,
            attack: 10,
            defense: 8,
            maxLife: 0,
            winCount: 0,
            pendingItem: 0,
        };
        const mockLobby: GameLobby = {
            id: '123',
            maxPlayers: 4,
            players: [mockPlayer],
            gameId: 'game1',
            isLocked: false,
        };
        const mockBoxDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockBoxDialogRef.afterClosed.and.returnValue(of(true));

        mockLobbyService.getLobby.and.returnValue(of(mockLobby));
        mockLobbyService.verifyRoom.and.returnValue(of({ exists: true, isLocked: false }));
        mockMatDialog.open.and.returnValue(mockBoxDialogRef);

        component.lobbyId = '123';
        component.validateGameId();
        tick();

        expect(component.isLoading).toBeFalse();
        expect(mockDialogRef.close).toHaveBeenCalledWith('123');
        expect(mockMatDialog.open).toHaveBeenCalledWith(BoxFormDialogComponent, {
            data: { lobbyId: '123', boxId: 'game1', isJoining: true },
        });
    }));

    it('should set error message when lobby does not exist', fakeAsync(() => {
        mockLobbyService.getLobby.and.returnValue(of());
        mockLobbyService.verifyRoom.and.returnValue(of({ exists: false, isLocked: false }));

        component.lobbyId = 'invalid';
        component.validateGameId();
        tick();

        expect(component.errorMessage).toBe(MAIN_PAGE_CONSTANTS.errorJoinMessage);
        expect(component.isLoading).toBeFalse();
    }));

    it('should set locked error message when lobby is locked', fakeAsync(() => {
        const mockPlayer: Player = {
            id: 'p1',
            name: 'Player 1',
            avatar: 'avatar1.png',
            isHost: true,
            life: 100,
            speed: 5,
            attack: 10,
            defense: 8,
            maxLife: 0,
            winCount: 0,
            pendingItem: 0,
        };
        const mockLobby: GameLobby = {
            id: '123',
            maxPlayers: 4,
            players: [mockPlayer],
            gameId: 'game1',
            isLocked: true,
        };
        mockLobbyService.getLobby.and.returnValue(of(mockLobby));

        mockLobbyService.verifyRoom.and.returnValue(of({ exists: false, isLocked: true }));

        component.lobbyId = 'locked';
        component.validateGameId();
        tick();

        expect(component.errorMessage).toBe(MAIN_PAGE_CONSTANTS.errorLockedLobbyMessage);
        expect(component.isLoading).toBeFalse();
    }));

    it('should handle loading state correctly', fakeAsync(() => {
        const mockPlayer: Player = {
            id: 'p1',
            name: 'Player 1',
            avatar: 'avatar1.png',
            isHost: true,
            life: 100,
            speed: 5,
            attack: 10,
            defense: 8,
            maxLife: 0,
            winCount: 0,
            pendingItem: 0,
        };
        const mockLobby: GameLobby = {
            id: '123',
            maxPlayers: 4,
            players: [mockPlayer],
            gameId: 'game1',
            isLocked: true,
        };
        mockLobbyService.getLobby.and.returnValue(of(mockLobby));
        mockLobbyService.verifyRoom.and.returnValue(of({ exists: true, isLocked: false }).pipe(delay(100)));

        const mockBoxDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockBoxDialogRef.afterClosed.and.returnValue(of(true));
        mockMatDialog.open.and.returnValue(mockBoxDialogRef);

        component.lobbyId = '123';
        component.validateGameId();

        expect(component.isLoading).toBeTrue();
        tick(100);
        expect(component.isLoading).toBeFalse();
    }));

    it('should open dialog with correct parameters', () => {
        const mockPlayer: Player = {
            id: 'p1',
            name: 'Player 1',
            avatar: 'avatar1.png',
            isHost: true,
            life: 100,
            speed: 5,
            attack: 10,
            defense: 8,
            maxLife: 0,
            winCount: 0,
            pendingItem: 0,
        };
        const mockLobby: GameLobby = {
            id: '123',
            maxPlayers: 4,
            players: [mockPlayer],
            gameId: 'game1',
            isLocked: false,
        };
        const mockBoxDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        mockBoxDialogRef.afterClosed.and.returnValue(of(true));

        mockLobbyService.getLobby.and.returnValue(of(mockLobby));
        mockMatDialog.open.and.returnValue(mockBoxDialogRef);

        component.lobbyId = '123';
        component['openBoxFormDialog']();

        expect(mockMatDialog.open).toHaveBeenCalledWith(BoxFormDialogComponent, {
            data: { lobbyId: '123', boxId: 'game1', isJoining: true },
        });
    });

    it('should close the dialog', () => {
        component.closeDialog();
        expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should clear error message', () => {
        component.errorMessage = 'Test error';
        component.resetError();
        expect(component.errorMessage).toBe('');
    });
});
