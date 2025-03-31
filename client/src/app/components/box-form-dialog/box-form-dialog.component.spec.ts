/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { CREATE_PAGE_CONSTANTS, GAME_IMAGES, MAIN_PAGE_CONSTANTS } from '@app/Consts/app.constants';
import { PageUrl } from '@app/Consts/route-constants';
import { GameService } from '@app/services/game.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameLobby } from '@common/game-lobby';
import { Game, GameSize, GameType } from '@common/game.interface';
import { of, Subject, throwError } from 'rxjs';
import { BoxFormDialogComponent } from './box-form-dialog.component';

describe('BoxFormDialogComponent', () => {
    let component: BoxFormDialogComponent;
    let fixture: ComponentFixture<BoxFormDialogComponent>;
    let mockLobbyService: jasmine.SpyObj<LobbyService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockGameService: jasmine.SpyObj<GameService>;
    let mockDialogRef: jasmine.SpyObj<MatDialogRef<BoxFormDialogComponent>>;
    let mockRouter: jasmine.SpyObj<Router>;
    let onPlayerJoinedSubject: Subject<any>;
    let onErrorSubject: Subject<any>;
    const dialogData = {
        boxId: 'box1',
        game: { id: 'game1', isVisible: true } as any,
        gameList: [],
        lobbyId: 'lobby1',
        isJoining: true,
    };

    beforeEach(async () => {
        mockLobbyService = jasmine.createSpyObj('LobbyService', [
            'verifyAvatars',
            'onPlayerJoined',
            'onError',
            'getLobby',
            'verifyUsername',
            'joinLobby',
            'lockLobby',
            'onLobbyUpdated',
            'getSocketId',
        ]);
        mockNotificationService = jasmine.createSpyObj('NotificationService', ['showError']);
        mockGameService = jasmine.createSpyObj('GameService', ['fetchVisibleGames']);
        mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        onPlayerJoinedSubject = new Subject<any>();
        onErrorSubject = new Subject<any>();

        mockLobbyService.verifyAvatars.and.returnValue(of({ avatars: [] }));
        mockLobbyService.onLobbyUpdated.and.returnValue(onPlayerJoinedSubject.asObservable());
        mockLobbyService.onError.and.returnValue(onErrorSubject.asObservable());
        mockGameService.fetchVisibleGames.and.returnValue(of([]));
        mockLobbyService.getSocketId.and.returnValue('player1-socket-id');

        await TestBed.configureTestingModule({
            imports: [CommonModule, FormsModule, RouterModule.forRoot([]), BoxFormDialogComponent],
            providers: [
                { provide: LobbyService, useValue: mockLobbyService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: GameService, useValue: mockGameService },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: dialogData },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BoxFormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
        expect(component.form).toBeDefined();
        expect(component.form.get('name')?.value).toBe('New Player');
        expect(component.form.get('avatar')?.value).toBeNull();
        expect(component.form.get('life')?.value).toBe(4);
    });

    it('closeDialog should close the dialog with the form value when the form is valid', () => {
        component.form.get('name')?.setValue('Player1');
        component.form.get('avatar')?.setValue('avatar1.png');
        component.form.get('life')?.setValue(4);
        component.form.get('speed')?.setValue(4);
        component.form.get('attack')?.setValue(4);
        component.form.get('defense')?.setValue(4);

        component.closeDialog();

        expect(mockDialogRef.close).toHaveBeenCalledWith({
            name: 'Player1',
            avatar: 'avatar1.png',
            life: 4,
            speed: 4,
            attack: 4,
            defense: 4,
        });
    });

    it('cancel should close the dialog with null', () => {
        component.cancel();
        expect(mockDialogRef.close).toHaveBeenCalledWith(null);
    });

    it('selectAvatar should update the avatar form control', () => {
        const newAvatar = GAME_IMAGES.bear;
        component.selectAvatar(newAvatar);
        expect(component.form.get('avatar')?.value).toBe(newAvatar);
    });

    it('inputName should update the name form control', () => {
        const event = { target: { value: 'TestName' } } as any as Event;
        component.inputName(event);
        expect(component.form.get('name')?.value).toBe('TestName');
    });

    it('increase should set increasedAttribute only on first call', () => {
        component.increase('life');
        expect(component.attributeClicked$).toBeTrue();
        expect(component.increasedAttribute).toBe('life');
        component.increase('speed');
        expect(component.increasedAttribute).toBe('life');
    });

    it('pickDice should set diceAttribute and diceClicked$', () => {
        component.pickDice('attack');
        expect(component.diceClicked$).toBeTrue();
        expect(component.diceAttribute).toBe('attack');
    });

    it('resetAttributes should reset stat values and flags', () => {
        component.form.patchValue({ life: 10, speed: 10, attack: 10, defense: 10 });
        component.attributeClicked$ = true;
        component.diceClicked$ = true;
        component.resetAttributes();
        expect(component.form.get('life')?.value).toBe(4);
        expect(component.form.get('speed')?.value).toBe(4);
        expect(component.attributeClicked$).toBeFalse();
        expect(component.diceClicked$).toBeFalse();
    });

    describe('isRoomLocked', () => {
        it('should return true and call lockLobby if the lobby is full', fakeAsync(() => {
            const fullLobby: GameLobby = {
                id: dialogData.lobbyId,
                maxPlayers: 3,
                players: [
                    {
                        id: 'p1',
                        name: 'Player1',
                        avatar: 'avatar1.png',
                        isHost: false,
                        life: 4,
                        speed: 4,
                        attack: 4,
                        defense: 4,
                        maxLife: 0,
                        winCount: 0,
                        pendingItem: 0,
                    },
                    {
                        id: 'p2',
                        name: 'Player2',
                        avatar: 'avatar2.png',
                        isHost: false,
                        life: 4,
                        speed: 4,
                        attack: 4,
                        defense: 4,
                        maxLife: 0,
                        winCount: 0,
                        pendingItem: 0,
                    },
                ],
                isLocked: false,
                gameId: 'game1',
            };

            mockLobbyService.getLobby.and.returnValue(of(fullLobby));

            component.isRoomLocked();
            tick();

            expect(mockLobbyService.lockLobby).toHaveBeenCalledWith(dialogData.lobbyId);
        }));

        it('should return false if the lobby is not full', () => {
            const notFullLobby: GameLobby = {
                id: dialogData.lobbyId,
                maxPlayers: 4,
                players: [
                    {
                        id: 'p1',
                        name: 'Player1',
                        avatar: 'avatar1.png',
                        isHost: false,
                        life: 4,
                        speed: 4,
                        attack: 4,
                        defense: 4,
                        maxLife: 0,
                        winCount: 0,
                        pendingItem: 0,
                    },
                ],
                isLocked: false,
                gameId: 'game1',
            };
            mockLobbyService.getLobby.and.returnValue(of(notFullLobby));
            const result = component.isRoomLocked();
            expect(result).toBeFalse();
        });
    });

    describe('onSubmit', () => {
        it('should show an error if the form is incomplete', () => {
            spyOn(component, 'save');
            component.increasedAttribute = null;
            component.onSubmit(new Event('submit'));
            expect(mockNotificationService.showError).toHaveBeenCalledWith(CREATE_PAGE_CONSTANTS.errorMissingBonuses);
            expect(component.save).not.toHaveBeenCalled();
        });

        it('should call save if the form is complete', () => {
            spyOn(component, 'save');
            component.increasedAttribute = 'life';
            component.diceAttribute = 'attack';

            component.form.get('name')?.setValue('Player1');
            component.form.get('avatar')?.setValue(component.avatars[0]);
            component.form.updateValueAndValidity();

            component.onSubmit(new Event('submit'));

            expect(component.save).toHaveBeenCalled();
        });
    });

    describe('saveJoin', () => {
        beforeEach(() => {
            component.increasedAttribute = 'life';
            component.diceAttribute = 'attack';
            component.form.get('name')?.setValue('Player1');
            component.form.get('avatar')?.setValue(GAME_IMAGES.fawn);
            component.form.get('life')?.setValue(4);
            component.form.get('speed')?.setValue(4);
            component.form.get('attack')?.setValue(4);
            component.form.get('defense')?.setValue(4);
        });

        it('should show error if bonus attributes are missing', () => {
            component.increasedAttribute = null;
            component.saveJoin();
            expect(mockNotificationService.showError).toHaveBeenCalledWith(CREATE_PAGE_CONSTANTS.errorEmptyBonuses);
        });

        it('should verify username and join lobby when valid and room is not locked', fakeAsync(() => {
            const usernameResponse = { usernames: ['Player1'] };
            mockLobbyService.verifyUsername.and.returnValue(of(usernameResponse));
            const notFullLobby: GameLobby = {
                id: dialogData.lobbyId,
                maxPlayers: 4,
                players: [
                    {
                        id: 'p1',
                        name: 'Existing',
                        avatar: 'avatar.png',
                        isHost: false,
                        life: 4,
                        speed: 4,
                        attack: 4,
                        defense: 4,
                        maxLife: 0,
                        winCount: 0,
                        pendingItem: 0,
                    },
                ],
                isLocked: false,
                gameId: 'game1',
            };
            mockLobbyService.getLobby.and.returnValue(of(notFullLobby));
            mockLobbyService.joinLobby.and.stub();
            component.saveJoin();
            tick();
            expect(mockLobbyService.verifyUsername).toHaveBeenCalledWith(dialogData.lobbyId);
            expect(mockLobbyService.joinLobby).toHaveBeenCalled();
            const playerArg = mockLobbyService.joinLobby.calls.mostRecent().args[1];
            expect(playerArg.name).toBe('Player1-2');
        }));

        it('should show error if the room is locked', fakeAsync(() => {
            const usernameResponse = { usernames: ['Player1'] };
            mockLobbyService.verifyUsername.and.returnValue(of(usernameResponse));

            const fullLobby: GameLobby = {
                id: dialogData.lobbyId,
                maxPlayers: 3,
                players: [
                    {
                        id: 'p1',
                        name: 'Player1',
                        avatar: 'avatar1.png',
                        isHost: false,
                        life: 4,
                        speed: 4,
                        attack: 4,
                        defense: 4,
                        maxLife: 0,
                        winCount: 0,
                        pendingItem: 0,
                    },
                    {
                        id: 'p2',
                        name: 'Player2',
                        avatar: 'avatar2.png',
                        isHost: false,
                        life: 4,
                        speed: 4,
                        attack: 4,
                        defense: 4,
                        maxLife: 0,
                        winCount: 0,
                        pendingItem: 0,
                    },
                ],
                isLocked: false,
                gameId: 'game1',
            };

            mockLobbyService.getLobby.and.returnValue(of(fullLobby));

            component.saveJoin();
            tick();

            expect(mockNotificationService.showError).toHaveBeenCalledWith(MAIN_PAGE_CONSTANTS.errorLockedLobbyMessage);
            expect(mockLobbyService.joinLobby).not.toHaveBeenCalled();
        }));
    });

    describe('saveCreate', () => {
        beforeEach(() => {
            dialogData.isJoining = false;
            component.data.game = { id: 'game1', isVisible: true } as any;
            component.increasedAttribute = 'life';
            component.diceAttribute = 'attack';
            component.form.get('name')?.setValue('Player1');
            component.form.get('avatar')?.setValue(GAME_IMAGES.fawn);
            component.form.get('life')?.setValue(4);
            component.form.get('speed')?.setValue(4);
            component.form.get('attack')?.setValue(4);
            component.form.get('defense')?.setValue(4);
            component.gameList = [{ id: 'game1', isVisible: true } as any];
        });

        it('should show error if bonus attributes are missing', () => {
            component.increasedAttribute = null;
            component.saveCreate();
            expect(mockNotificationService.showError).toHaveBeenCalledWith(CREATE_PAGE_CONSTANTS.errorEmptyBonuses);
        });

        it('should show error if the game does not exist or is not visible', () => {
            component.data.game = { id: 'nonexistent', isVisible: false } as any;
            component.saveCreate();
            expect(mockNotificationService.showError).toHaveBeenCalledWith(CREATE_PAGE_CONSTANTS.errorGameDeleted);
        });

        it('should join lobby if the form is valid', () => {
            mockLobbyService.joinLobby.and.stub();
            component.saveCreate();
            expect(mockLobbyService.joinLobby).toHaveBeenCalledWith(dialogData.lobbyId, jasmine.any(Object));
        });
    });

    describe('loadGames', () => {
        it('should update gameList on successful fetch', () => {
            const games: Game[] = [
                {
                    id: 'game1',
                    name: '',
                    mapSize: GameSize.small,
                    mode: GameType.classic,
                    previewImage: '',
                    description: '',
                    lastModified: new Date(),
                    isVisible: false,
                    board: [],
                    objects: [],
                },
                {
                    id: 'game2',
                    name: '',
                    mapSize: GameSize.small,
                    mode: GameType.classic,
                    previewImage: '',
                    description: '',
                    lastModified: new Date(),
                    isVisible: false,
                    board: [],
                    objects: [],
                },
            ];
            mockGameService.fetchVisibleGames.and.returnValue(of(games));
            component['loadGames']();
            expect(component.gameList).toEqual(games);
        });

        it('should show error if fetching games fails', () => {
            mockGameService.fetchVisibleGames.and.returnValue(throwError(() => 'error'));
            component['loadGames']();
            expect(mockNotificationService.showError).toHaveBeenCalledWith(CREATE_PAGE_CONSTANTS.errorLoadingGames);
        });
    });

    describe('subscriptions', () => {
        it('should navigate when a player joins', () => {
            const socketData = {
                lobby: { id: 'lobby1' },
                player: { id: 'player1' },
            };
            onPlayerJoinedSubject.next(socketData);

            expect(mockRouter.navigate).toHaveBeenCalledWith([`${PageUrl.Waiting}/lobby1/player1-socket-id`], { replaceUrl: true });
        });

        it('should show error when an error is emitted', () => {
            const errorMsg = 'Test error';
            onErrorSubject.next(errorMsg);
            expect(mockNotificationService.showError).toHaveBeenCalledWith(errorMsg);
        });
    });

    it('should unsubscribe from all subscriptions on destroy', () => {
        spyOn(component['subscriptions'][0], 'unsubscribe');
        component.ngOnDestroy();
        expect(component['subscriptions'][0].unsubscribe).toHaveBeenCalled();
    });

    describe('save', () => {
        it('should call saveJoin when data.isJoining is true', () => {
            spyOn(component, 'saveJoin');
            component.data.isJoining = true;
            component.save();
            expect(component.saveJoin).toHaveBeenCalled();
        });
        it('should call saveCreate when data.isJoining is false', () => {
            spyOn(component, 'saveCreate');
            component.data.isJoining = false;
            component.save();
            expect(component.saveCreate).toHaveBeenCalled();
        });
    });

    describe('buildBonus', () => {
        it('should set bonus.speed to 2 when increasedAttribute is speed and diceAttribute is not set', () => {
            component.increasedAttribute = 'speed';
            component.diceAttribute = null;
            const bonus = (component as any).buildBonus();
            expect(bonus.speed).toEqual(2);
        });
        it('should set bonus.attack to D4 when increasedAttribute is attack and diceAttribute is not set', () => {
            component.increasedAttribute = 'attack';
            component.diceAttribute = null;
            const bonus = (component as any).buildBonus();
            expect(bonus.attack).toEqual('D4');
        });
        it('should set bonus.defense to D4 when increasedAttribute is defense and diceAttribute is not set', () => {
            component.increasedAttribute = 'defense';
            component.diceAttribute = null;
            const bonus = (component as any).buildBonus();
            expect(bonus.defense).toEqual('D4');
        });
        it('should set bonus.defense to D6 and bonus.attack to D4 when diceAttribute is defense', () => {
            component.diceAttribute = 'defense';
            const bonus = (component as any).buildBonus();
            expect(bonus.defense).toEqual('D6');
            expect(bonus.attack).toEqual('D4');
        });
        it('inputName should set required error for empty or whitespace-only name', () => {
            const event = { target: { value: '   ' } } as unknown as Event;
            component.inputName(event);

            expect(component.form.get('name')?.errors).toEqual({ required: true });
            expect(component.formValid$).toBeFalse();

            const emptyEvent = { target: { value: '' } } as unknown as Event;
            component.inputName(emptyEvent);

            expect(component.form.get('name')?.errors).toEqual({ required: true });
            expect(component.formValid$).toBeFalse();
        });
    });
});
