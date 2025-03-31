import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LobbyService } from '@app/services/lobby.service';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { ObjectsTypes } from '@common/game.interface';
import { Subject } from 'rxjs';
import { InventoryComponent } from './inventory.component';

describe('InventoryComponent', () => {
    let component: InventoryComponent;
    let fixture: ComponentFixture<InventoryComponent>;
    let lobbyServiceMock: jasmine.SpyObj<LobbyService>;
    let inventoryFullSubject: Subject<{ item: number; currentInventory: number[] }>;
    let movementProcessedSubject: Subject<{
        gameState: GameState;
        playerMoved: string;
        newPosition: Coordinates;
    }>;
    const mockPlayerId = 'socket123';

    beforeEach(async () => {
        inventoryFullSubject = new Subject();
        movementProcessedSubject = new Subject();

        lobbyServiceMock = jasmine.createSpyObj('LobbyService', [
            'onInventoryFull',
            'onMovementProcessed',
            'resolveInventory',
            'cancelInventoryChoice',
            'getSocketId',
        ]);

        lobbyServiceMock.onInventoryFull.and.returnValue(inventoryFullSubject.asObservable());
        lobbyServiceMock.onMovementProcessed.and.returnValue(movementProcessedSubject.asObservable());
        lobbyServiceMock.getSocketId.and.returnValue(mockPlayerId);

        await TestBed.configureTestingModule({
            imports: [InventoryComponent],
            providers: [{ provide: LobbyService, useValue: lobbyServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(InventoryComponent);
        component = fixture.componentInstance;
        component.lobbyId = 'lobby123';
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit - onInventoryFull', () => {
        it('should do nothing if item is EMPTY or inventory is invalid', fakeAsync(() => {
            inventoryFullSubject.next({ item: ObjectsTypes.EMPTY, currentInventory: [] });
            tick();
            expect(component.showPopup).toBeFalse();
            expect(component.pendingItem).toBe(0);
        }));

        it('should set popup state and store inventory when valid item received', fakeAsync(() => {
            inventoryFullSubject.next({
                item: ObjectsTypes.SWORD,
                currentInventory: [ObjectsTypes.BOOTS, ObjectsTypes.POTION],
            });
            tick();
            expect(component.pendingItem).toBe(ObjectsTypes.SWORD);
            expect(component.items).toEqual([ObjectsTypes.BOOTS, ObjectsTypes.POTION]);
            expect(component.showPopup).toBeTrue();
        }));
    });

    describe('ngOnInit - onMovementProcessed', () => {
        it('should update items based on game state for current player', fakeAsync(() => {
            movementProcessedSubject.next({
                gameState: {
                    id: 'game1',
                    board: [[]],
                    currentPlayer: '',
                    animation: false,
                    players: [
                        {
                            id: mockPlayerId,
                            items: [ObjectsTypes.SWORD, ObjectsTypes.JUICE],
                            pendingItem: 0,
                            name: '',
                            avatar: '',
                            isHost: false,
                            life: 0,
                            maxLife: 0,
                            speed: 0,
                            attack: 0,
                            defense: 0,
                            winCount: 0,
                        },
                    ],
                    turnCounter: 0,
                    availableMoves: [],
                    shortestMoves: [],
                    playerPositions: [],
                    spawnPoints: [],
                    currentPlayerMovementPoints: 0,
                    currentPlayerActionPoints: 0,
                    debug: false,
                },
                playerMoved: mockPlayerId,
                newPosition: { x: 0, y: 0 },
            });
            tick();
            expect(component.items).toEqual([ObjectsTypes.SWORD, ObjectsTypes.JUICE]);
        }));

        it('should set items to empty array if player not found', fakeAsync(() => {
            movementProcessedSubject.next({
                gameState: {
                    id: 'game1',
                    board: [[]],
                    currentPlayer: '',
                    animation: false,
                    players: [],
                    turnCounter: 0,
                    availableMoves: [],
                    shortestMoves: [],
                    playerPositions: [],
                    spawnPoints: [],
                    currentPlayerMovementPoints: 0,
                    currentPlayerActionPoints: 0,
                    debug: false,
                },
                playerMoved: 'another',
                newPosition: { x: 0, y: 0 },
            });
            tick();
            expect(component.items).toEqual([]);
        }));
    });

    describe('Popup actions', () => {
        beforeEach(() => {
            component.items = [ObjectsTypes.BOOTS, ObjectsTypes.POTION];
            component.pendingItem = ObjectsTypes.WAND;
            component.showPopup = true;
        });

        it('handleConfirmReplace() should call resolveInventory and close popup', () => {
            component.handleConfirmReplace();
            expect(lobbyServiceMock.resolveInventory).toHaveBeenCalledWith('lobby123', ObjectsTypes.BOOTS, ObjectsTypes.WAND);
            expect(component.showPopup).toBeFalse();
        });

        it('handleCancelReplace() should call cancelInventoryChoice and close popup', () => {
            component.handleCancelReplace();
            expect(lobbyServiceMock.cancelInventoryChoice).toHaveBeenCalledWith('lobby123');
            expect(component.showPopup).toBeFalse();
        });
    });

    describe('getItemImage()', () => {
        it('should return correct path for known items', () => {
            expect(component.getItemImage(ObjectsTypes.SWORD)).toBe('assets/objects/sword.png');
            expect(component.getItemImage(ObjectsTypes.CRYSTAL)).toBe('assets/objects/crystal_ball.png');
        });

        it('should return fallback path for unknown item', () => {
            expect(component.getItemImage(999)).toBe('assets/items/unknown.png');
        });
    });

    describe('getItemName()', () => {
        it('should return correct name for known items', () => {
            expect(component.getItemName(ObjectsTypes.JUICE)).toBe('Jus');
        });

        it('should return fallback name for unknown item', () => {
            expect(component.getItemName(999)).toBe('Objet inconnu');
        });
    });
});
