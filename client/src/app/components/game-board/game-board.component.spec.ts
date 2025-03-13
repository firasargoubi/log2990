import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameBoardComponent } from './game-board.component';
import { LobbyService } from '@app/services/lobby.service';
import { GameState } from '@common/game-state';
import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';
import { OBJECT_MULTIPLIER, TileTypes, ObjectsTypes } from '@app/Consts/app.constants';
import { Tile } from '@app/interfaces/tile';
import { GameTileComponent } from '../game-tile/game-tile.component';
import { Subject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('GameBoardComponent', () => {
    let component: GameBoardComponent;
    let fixture: ComponentFixture<GameBoardComponent>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;

    const pathCalculatedSubject = new Subject<{
        destination: Coordinates;
        path: Coordinates[];
        valid: boolean;
    }>();

    const turnStartedSubject = new Subject<{
        gameState: GameState;
        currentPlayer: string;
        availableMoves: Coordinates[];
    }>();

    const movementProcessedSubject = new Subject<{
        gameState: GameState;
        playerMoved: string;
        newPosition: Coordinates;
    }>();

    const mockGameState: GameState = {
        id: 'game1',
        board: [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
        ],
        players: [
            { id: 'player1', name: 'Player 1', avatar: 'avatar1.jpg' } as Player,
            { id: 'player2', name: 'Player 2', avatar: 'avatar2.jpg' } as Player,
        ],
        currentPlayer: 'player1',
        playerPositions: new Map<string, Coordinates>([
            ['player1', { x: 0, y: 0 }],
            ['player2', { x: 2, y: 2 }],
        ]),
        availableMoves: [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
        ],
        turnCounter: 0,
        currentPlayerMovementPoints: 0,
    };

    beforeEach(async () => {
        const lobbyServiceSpyObj = jasmine.createSpyObj('LobbyService', ['onPathCalculated', 'onTurnStarted', 'onMovementProcessed', 'requestPath']);

        lobbyServiceSpyObj.onPathCalculated.and.returnValue(pathCalculatedSubject.asObservable());
        lobbyServiceSpyObj.onTurnStarted.and.returnValue(turnStartedSubject.asObservable());
        lobbyServiceSpyObj.onMovementProcessed.and.returnValue(movementProcessedSubject.asObservable());

        await TestBed.configureTestingModule({
            imports: [GameBoardComponent, GameTileComponent],
            providers: [{ provide: LobbyService, useValue: lobbyServiceSpyObj }],
            schemas: [NO_ERRORS_SCHEMA], // To avoid having to import all child components
        }).compileComponents();

        lobbyServiceSpy = TestBed.inject(LobbyService) as jasmine.SpyObj<LobbyService>;

        fixture = TestBed.createComponent(GameBoardComponent);
        component = fixture.componentInstance;

        // Set up input properties
        component.gameState = { ...mockGameState };
        component.currentPlayerId = 'player1';
        component.lobbyId = 'lobby1';
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should initialize the board with correct size', () => {
        fixture.detectChanges();
        expect(component.tiles.length).toBe(3); // Based on the mock game state
        expect(component.tiles[0].length).toBe(3);
    });

    it('should initialize available moves correctly', () => {
        fixture.detectChanges();
        expect(component.availableMoves.length).toBe(2);
        expect(component.availableMoves).toEqual([
            { x: 0, y: 1 },
            { x: 1, y: 0 },
        ]);
    });

    it('should correctly identify available moves', () => {
        fixture.detectChanges();
        expect(component.isAvailableMove(0, 1)).toBeTrue();
        expect(component.isAvailableMove(1, 0)).toBeTrue();
        expect(component.isAvailableMove(0, 0)).toBeFalse();
    });

    it('should correctly identify a player at a position', () => {
        fixture.detectChanges();

        const playerAtStart = component.getPlayerAtPosition(0, 0);
        expect(playerAtStart).toBeTruthy();
        expect(playerAtStart?.player.id).toBe('player1');
        expect(playerAtStart?.isCurrentPlayer).toBeTrue();
        expect(playerAtStart?.isLocalPlayer).toBeTrue();

        const playerAtEnd = component.getPlayerAtPosition(2, 2);
        expect(playerAtEnd).toBeTruthy();
        expect(playerAtEnd?.player.id).toBe('player2');
        expect(playerAtEnd?.isCurrentPlayer).toBeFalse();
        expect(playerAtEnd?.isLocalPlayer).toBeFalse();

        const emptyPosition = component.getPlayerAtPosition(1, 1);
        expect(emptyPosition).toBeNull();
    });

    it('should respond to changes in game state', () => {
        fixture.detectChanges();

        const updatedGameState: GameState = {
            ...mockGameState,
            board: [
                [1, 1, 1, 1],
                [1, 1, 1, 1],
                [1, 1, 1, 1],
                [1, 1, 1, 1],
            ],
            availableMoves: [
                { x: 0, y: 1 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
            ],
        };

        component.gameState = updatedGameState;

        // Trigger OnChanges lifecycle
        component.ngOnChanges({
            gameState: {
                currentValue: updatedGameState,
                previousValue: mockGameState,
                firstChange: false,
                isFirstChange: () => false,
            },
        });

        fixture.detectChanges();

        // The board should now be 4x4
        expect(component.tiles.length).toBe(4);
        expect(component.tiles[0].length).toBe(4);

        // Should have 3 available moves
        expect(component.availableMoves.length).toBe(3);
    });

    it('should emit move request when clicking an available move', () => {
        fixture.detectChanges();

        const moveRequestSpy = spyOn(component.moveRequest, 'emit');

        // Get coordinates at position 0,1 (which is an available move)
        const tile: Tile = {
            type: TileTypes.Grass,
            object: 0,
            x: 0,
            y: 1,
            id: '0-1',
        };

        component.onTileClick(tile);

        expect(moveRequestSpy).toHaveBeenCalledWith({ x: 0, y: 1 });
    });

    it('should not emit move request when clicking an unavailable move', () => {
        fixture.detectChanges();

        const moveRequestSpy = spyOn(component.moveRequest, 'emit');

        // Get coordinates at position 1,1 (which is not an available move)
        const tile: Tile = {
            type: TileTypes.Grass,
            object: 0,
            x: 1,
            y: 1,
            id: '1-1',
        };

        component.onTileClick(tile);

        expect(moveRequestSpy).not.toHaveBeenCalled();
    });

    it('should calculate and highlight path on hover', fakeAsync(() => {
        fixture.detectChanges();

        const tile: Tile = {
            type: TileTypes.Grass,
            object: 0,
            x: 0,
            y: 1,
            id: '0-1',
        };

        // There is no cached path yet
        expect(component.highlightedPath.length).toBe(0);

        component.onTileHover(tile);

        // Should request a path
        expect(lobbyServiceSpy.requestPath).toHaveBeenCalledWith('lobby1', { x: 0, y: 1 });

        // Simulate path calculation response
        const path: Coordinates[] = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ];

        pathCalculatedSubject.next({
            destination: { x: 0, y: 1 },
            path: path,
            valid: true,
        });

        tick();

        // Path should be highlighted
        expect(component.highlightedPath).toEqual(path);

        // When hovering again, it should use the cached path
        component.onTileHover(tile);

        // Should not request path again
        expect(lobbyServiceSpy.requestPath).toHaveBeenCalledTimes(1);

        // Path should still be highlighted
        expect(component.highlightedPath).toEqual(path);
    }));

    it('should clear path highlights on tile leave', () => {
        fixture.detectChanges();

        // Set a mock path
        component.highlightedPath = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ];

        component.onTileLeave();

        expect(component.highlightedPath.length).toBe(0);
    });

    it('should correctly identify tiles on highlighted path', () => {
        fixture.detectChanges();

        // Set a mock path
        component.highlightedPath = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ];

        expect(component.isOnHighlightedPath(0, 0)).toBeTrue();
        expect(component.isOnHighlightedPath(0, 1)).toBeTrue();
        expect(component.isOnHighlightedPath(1, 0)).toBeFalse();
    });

    it('should update available moves when turn starts', fakeAsync(() => {
        fixture.detectChanges();

        const newMoves: Coordinates[] = [
            { x: 1, y: 1 },
            { x: 1, y: 2 },
        ];

        turnStartedSubject.next({
            gameState: mockGameState,
            currentPlayer: 'player1',
            availableMoves: newMoves,
        });

        tick();

        expect(component.availableMoves).toEqual(newMoves);
        expect(component.highlightedPath.length).toBe(0); // Path should be cleared
    }));

    it('should clear path highlights when movement is processed', fakeAsync(() => {
        fixture.detectChanges();

        // Set a mock path
        component.highlightedPath = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ];

        movementProcessedSubject.next({
            gameState: mockGameState,
            playerMoved: 'player1',
            newPosition: { x: 0, y: 1 },
        });

        tick();

        expect(component.highlightedPath.length).toBe(0);
    }));

    it("should correctly determine if it is the current player's turn", () => {
        component.gameState = mockGameState;
        component.currentPlayerId = 'player1';
        fixture.detectChanges();

        // The private method isMyTurn() is tested indirectly through onTileClick
        const availableTile: Tile = {
            type: TileTypes.Grass,
            object: 0,
            x: 0,
            y: 1,
            id: '0-1',
        };

        const moveRequestSpy = spyOn(component.moveRequest, 'emit');

        component.onTileClick(availableTile);
        expect(moveRequestSpy).toHaveBeenCalled(); // Should emit because it's our turn

        // Change the current player
        component.gameState = {
            ...mockGameState,
            currentPlayer: 'player2',
        };

        moveRequestSpy.calls.reset();
        component.onTileClick(availableTile);
        expect(moveRequestSpy).not.toHaveBeenCalled(); // Should not emit because it's not our turn
    });

    it('should properly initialize the board with objects', () => {
        const boardWithObjects = [
            [1, 1 + OBJECT_MULTIPLIER * ObjectsTypes.BOOTS, 1],
            [1, 1, 1 + OBJECT_MULTIPLIER * ObjectsTypes.SWORD],
            [1, 1 + OBJECT_MULTIPLIER * ObjectsTypes.POTION, 1],
        ];

        component.gameState = {
            ...mockGameState,
            board: boardWithObjects,
        };

        fixture.detectChanges();

        expect(component.tiles[0][1].object).toBe(ObjectsTypes.BOOTS);
        expect(component.tiles[1][2].object).toBe(ObjectsTypes.SWORD);
        expect(component.tiles[2][1].object).toBe(ObjectsTypes.POTION);
    });
});
