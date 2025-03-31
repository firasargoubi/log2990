import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
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
    let confirmSpy: jasmine.Spy;
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

        confirmSpy = spyOn(window, 'confirm');
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit - onInventoryFull', () => {
        it('should do nothing if item is empty or inventory invalid', fakeAsync(() => {
            inventoryFullSubject.next({ item: ObjectsTypes.EMPTY, currentInventory: [] });
            tick();
            expect(lobbyServiceMock.resolveInventory).not.toHaveBeenCalled();
            expect(lobbyServiceMock.cancelInventoryChoice).not.toHaveBeenCalled();
        }));

        it('should resolve inventory when user confirms replacement', fakeAsync(() => {
            confirmSpy.and.returnValue(true);
            inventoryFullSubject.next({
                item: ObjectsTypes.SWORD,
                currentInventory: [ObjectsTypes.BOOTS, ObjectsTypes.POTION],
            });
            tick();
            expect(lobbyServiceMock.resolveInventory).toHaveBeenCalledWith('lobby123', ObjectsTypes.BOOTS, ObjectsTypes.SWORD);
            expect(component.items).toEqual([ObjectsTypes.BOOTS, ObjectsTypes.POTION]);
        }));

        it('should cancel inventory choice when user declines', fakeAsync(() => {
            confirmSpy.and.returnValue(false);
            inventoryFullSubject.next({
                item: ObjectsTypes.SWORD,
                currentInventory: [ObjectsTypes.BOOTS, ObjectsTypes.POTION],
            });
            tick();
            expect(lobbyServiceMock.cancelInventoryChoice).toHaveBeenCalledWith('lobby123');
            expect(component.items).toEqual([ObjectsTypes.BOOTS, ObjectsTypes.POTION]);
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
                            items: [ObjectsTypes.SWORD, ObjectsTypes.POTION],
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
                        {
                            id: 'another',
                            items: [],
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
            expect(component.items).toEqual([ObjectsTypes.SWORD, ObjectsTypes.POTION]);
        }));

        it('should default to empty array if no matching player found', fakeAsync(() => {
            movementProcessedSubject.next({
                gameState: {
                    id: 'game1',
                    board: [[]],
                    currentPlayer: '',
                    animation: false,
                    players: [
                        {
                            id: 'another',
                            items: [ObjectsTypes.CRYSTAL],
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
                playerMoved: 'another',
                newPosition: { x: 0, y: 0 },
            });
            tick();
            expect(component.items).toEqual([]);
        }));
    });

    describe('getItemName()', () => {
        it('should return correct item name', () => {
            expect(component.getItemName(ObjectsTypes.BOOTS)).toBe('Bottes');
            expect(component.getItemName(ObjectsTypes.SWORD)).toBe('Épée');
            expect(component.getItemName(ObjectsTypes.POTION)).toBe('Potion');
            expect(component.getItemName(ObjectsTypes.WAND)).toBe('Baguette');
            expect(component.getItemName(ObjectsTypes.CRYSTAL)).toBe('Cristal');
            expect(component.getItemName(ObjectsTypes.JUICE)).toBe('Jus');
            expect(component.getItemName(ObjectsTypes.RANDOM)).toBe('Objet aléatoire');
        });

        it('should return "Objet inconnu" for unknown item id', () => {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            expect(component.getItemName(999)).toBe('Objet inconnu');
        });
    });
});
