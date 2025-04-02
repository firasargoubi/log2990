/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { CREATE_PAGE_CONSTANTS } from '@app/Consts/app-constants';
import { GameService } from '@app/services/game.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Game, GameSize, GameType } from '@common/game.interface';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CreatePageComponent } from './create-page.component';

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;

    beforeEach(async () => {
        const mockGamesSubject = new BehaviorSubject<Game[]>([
            {
                id: '1',
                name: 'Chess',
                mapSize: GameSize.medium,
                mode: GameType.classic,
                previewImage: 'chess.png',
                description: 'A normal board game.',
                lastModified: new Date('2024-01-01T10:00:00Z'),
                isVisible: true,
                board: [
                    [0, 1],
                    [1, 0],
                ],
                objects: [],
            },
            {
                id: '2',
                name: 'Poker',
                mapSize: GameSize.medium,
                mode: GameType.classic,
                previewImage: 'poker.png',
                description: 'A popular card game.',
                lastModified: new Date('2024-01-02T15:30:00Z'),
                isVisible: true,
                board: [
                    [1, 1],
                    [0, 0],
                ],
                objects: [],
            },
        ]);

        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchVisibleGames', 'verifyGameAccessible']);
        gameServiceSpy.fetchVisibleGames.and.returnValue(mockGamesSubject.asObservable());
        lobbyServiceSpy = jasmine.createSpyObj('LobbyService', ['createLobby', 'onLobbyCreated']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
        const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], { snapshot: { params: {} } });

        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        mockDialogRef = jasmine.createSpyObj<MatDialogRef<BoxFormDialogComponent>>('MatDialogRef', ['afterClosed', 'close']);
        mockDialogRef.afterClosed.and.returnValue(of(true));
        matDialogSpy.open.and.returnValue(mockDialogRef);

        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

        await TestBed.configureTestingModule({
            imports: [
                CreatePageComponent,
                GameCreationCardComponent,
                CommonModule,
                ReactiveFormsModule,
                MatCardModule,
                RouterModule.forRoot([{ path: 'waiting', component: CreatePageComponent }]),
            ],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: LobbyService, useValue: lobbyServiceSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch games on initialization', fakeAsync(() => {
        gameServiceSpy.fetchVisibleGames.and.returnValue(
            of([
                {
                    id: '1',
                    name: 'Chess',
                    mapSize: GameSize.medium,
                    mode: GameType.classic,
                    previewImage: 'chess.png',
                    description: 'A normal board game.',
                    lastModified: new Date(),
                    isVisible: true,
                    board: [
                        [0, 1],
                        [1, 0],
                    ],
                    objects: [],
                },
            ]),
        );

        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(gameServiceSpy.fetchVisibleGames).toHaveBeenCalled();
        expect(component.games.length).toBe(1);

        discardPeriodicTasks();
    }));

    it('should block the dialog if the game is not available', fakeAsync(() => {
        gameServiceSpy.verifyGameAccessible.and.returnValue(of(false));
        component.onBoxClick(component.games[0]);
        expect(notificationServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle error from server when checking game availability', fakeAsync(() => {
        gameServiceSpy.verifyGameAccessible.and.returnValue(throwError(() => new Error('Error')));
        component.onBoxClick(component.games[0]);
        expect(notificationServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle error when fetching games fails', fakeAsync(() => {
        gameServiceSpy.fetchVisibleGames.and.returnValue(throwError(() => new Error('Error')));

        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(notificationServiceSpy.showError).toHaveBeenCalled();

        discardPeriodicTasks();
    }));

    it('should not update games array if fetched games are the same', fakeAsync(() => {
        const initialGames = component.games;
        gameServiceSpy.fetchVisibleGames.and.returnValue(of(initialGames));

        component.ngOnInit();
        tick();
        fixture.detectChanges();

        expect(component.games).toEqual(initialGames);

        discardPeriodicTasks();
    }));

    it('should create a new lobby if none exists and open the dialog', fakeAsync(() => {
        gameServiceSpy.verifyGameAccessible.and.returnValue(of(true));
        lobbyServiceSpy.createLobby.and.callFake(() => {});
        lobbyServiceSpy.onLobbyCreated.and.returnValue(
            of({
                lobby: {
                    id: '123',
                    players: [],
                    isLocked: false,
                    maxPlayers: 4,
                    gameId: 'game-123',
                },
            }),
        );

        component.onBoxClick(component.games[0]);
        tick();

        expect(lobbyServiceSpy.createLobby).toHaveBeenCalledWith(component.games[0]);
        expect(lobbyServiceSpy.onLobbyCreated).toHaveBeenCalled();
        expect(component.lobbyId).toBe('123');
        expect(matDialogSpy.open).toHaveBeenCalled();

        discardPeriodicTasks();
    }));

    it('should open the dialog without creating a new lobby if one already exists', fakeAsync(() => {
        component.lobbyId = 'existing-lobby-id';
        gameServiceSpy.verifyGameAccessible.and.returnValue(of(true));

        component.onBoxClick(component.games[0]);
        tick();

        expect(lobbyServiceSpy.createLobby).not.toHaveBeenCalled();
        expect(matDialogSpy.open).toHaveBeenCalled();

        discardPeriodicTasks();
    }));

    it('should show error if lobby creation fails', fakeAsync(() => {
        gameServiceSpy.verifyGameAccessible.and.returnValue(of(true));
        lobbyServiceSpy.onLobbyCreated.and.returnValue(throwError(() => new Error('Failed to create lobby')));

        component.onBoxClick(component.games[0]);
        tick();

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith(
            CREATE_PAGE_CONSTANTS.errorLobbyCreation + ' ' + 'Error: Failed to create lobby',
        );

        discardPeriodicTasks();
    }));

    it('should show error and reload games if game is not accessible', fakeAsync(() => {
        gameServiceSpy.verifyGameAccessible.and.returnValue(of(false));

        const loadGamesSpy = spyOn(component as any, 'loadGames');

        component.onBoxClick(component.games[0]);

        tick();

        expect(notificationServiceSpy.showError).toHaveBeenCalledWith(CREATE_PAGE_CONSTANTS.errorGameDeleted);
        expect(loadGamesSpy).toHaveBeenCalled();

        discardPeriodicTasks();
    }));
});
