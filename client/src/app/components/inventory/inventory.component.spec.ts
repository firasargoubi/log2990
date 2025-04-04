/* eslint-disable @typescript-eslint/no-magic-numbers */
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
        it('should do nothing if item is EMPTY', fakeAsync(() => {
            inventoryFullSubject.next({ item: ObjectsTypes.EMPTY, currentInventory: [1, 2] });
            tick();
            expect(component.showPopup).toBeFalse();
            expect(component.pendingItem).toBe(0);
        }));

        it('should do nothing if currentInventory is empty', fakeAsync(() => {
            inventoryFullSubject.next({ item: ObjectsTypes.SWORD, currentInventory: [] });
            tick();
            expect(component.showPopup).toBeFalse();
            expect(component.pendingItem).toBe(0);
        }));

        it('should do nothing if currentInventory has less than 2 items', fakeAsync(() => {
            inventoryFullSubject.next({ item: ObjectsTypes.SWORD, currentInventory: [1] });
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
            const mockGameState: GameState = {
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
                gameMode: 'default',
            };

            movementProcessedSubject.next({
                gameState: mockGameState,
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
                    gameMode: 'default',
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
        it('should return correct path for all known items', () => {
            expect(component.getItemImage(ObjectsTypes.BOOTS)).toBe('assets/objects/boots.png');
            expect(component.getItemImage(ObjectsTypes.SWORD)).toBe('assets/objects/sword.png');
            expect(component.getItemImage(ObjectsTypes.POTION)).toBe('assets/objects/potion.png');
            expect(component.getItemImage(ObjectsTypes.WAND)).toBe('assets/objects/wand.png');
            expect(component.getItemImage(ObjectsTypes.CRYSTAL)).toBe('assets/objects/crystal_ball.png');
            expect(component.getItemImage(ObjectsTypes.JUICE)).toBe('assets/objects/berry-juice.png');
            expect(component.getItemImage(ObjectsTypes.RANDOM)).toBe('assets/objects/gnome.png');
            expect(component.getItemImage(ObjectsTypes.FLAG)).toBe('assets/objects/flag.png');
        });

        it('should return fallback path for unknown item', () => {
            expect(component.getItemImage(999)).toBe('assets/items/unknown.png');
        });
    });

    describe('getItemName()', () => {
        it('should return correct name for all known items', () => {
            expect(component.getItemName(ObjectsTypes.BOOTS)).toBe('Bottes de vitesse');
            expect(component.getItemName(ObjectsTypes.SWORD)).toBe('Épée de puissance');
            expect(component.getItemName(ObjectsTypes.POTION)).toBe('Potion de soin');
            expect(component.getItemName(ObjectsTypes.WAND)).toBe('Baguette magique');
            expect(component.getItemName(ObjectsTypes.CRYSTAL)).toBe('Boule de cristal');
            expect(component.getItemName(ObjectsTypes.JUICE)).toBe('Jus de baies');
            expect(component.getItemName(ObjectsTypes.RANDOM)).toBe('Gnome mystère');
            expect(component.getItemName(ObjectsTypes.FLAG)).toBe('Drapeau');
        });

        it('should return fallback name for unknown item', () => {
            expect(component.getItemName(999)).toBe('Objet inconnu');
        });
    });

    describe('getItemDescription()', () => {
        it('should return correct name for all known items', () => {
            expect(component.getItemDescription(ObjectsTypes.BOOTS)).toBe(
                'Les bottes magiques vous permettront de vous déplacer à une vitesse SUPERSONIQUE!',
            );
            expect(component.getItemDescription(ObjectsTypes.SWORD)).toBe('Cette épée effectue plus de dégats sur vos ennemis!');
            expect(component.getItemDescription(ObjectsTypes.POTION)).toBe(
                'Figez le temps et profitez-en pour vous déplacer une fois de plus que vos adversaires...',
            );
            expect(component.getItemDescription(ObjectsTypes.WAND)).toBe(
                "Cette mystérieuse baguette vous permet d'ensorceler un de vos adversaires et de le dérouter de son chemin!",
            );
            expect(component.getItemDescription(ObjectsTypes.CRYSTAL)).toBe(
                "Vos talents de clairvoyance vous permettent d'identifier tous les points faibles d'un de vos ennemis.",
            );
            expect(component.getItemDescription(ObjectsTypes.JUICE)).toBe('Ne paniquez pas, ce nectar soignera toutes vos blessures!');
            expect(component.getItemDescription(ObjectsTypes.RANDOM)).toBe('Ce petit gnome farceur a un cadeau pour vous. À vos risque et périls...');
            expect(component.getItemDescription(ObjectsTypes.FLAG)).toBe(
                "Cette relique à l'effigie de la reine de la forêt doit être sécurisé à tout prix.",
            );
        });

        it('should return fallback name for unknown item', () => {
            expect(component.getItemDescription(999)).toBe('Bravo, vous avez réussi à débloquer cet item spécial.');
        });
    });

    describe('Input properties', () => {
        it('should initialize with default values', () => {
            expect(component.items).toEqual([]);
            expect(component.lobbyId).toEqual('lobby123');
        });

        it('should accept input values', () => {
            const testItems = [1, 2, 3];
            const testLobbyId = 'testLobby';

            component.items = testItems;
            component.lobbyId = testLobbyId;

            expect(component.items).toEqual(testItems);
            expect(component.lobbyId).toEqual(testLobbyId);
        });
    });
});
