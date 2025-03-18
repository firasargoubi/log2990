/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OBJECT_MULTIPLIER } from '@app/Consts/app.constants';
import { LobbyService } from '@app/services/lobby.service';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { Subject } from 'rxjs';
import { GameBoardComponent } from './game-board.component';

describe('GameBoardComponent', () => {
    let component: GameBoardComponent;
    let fixture: ComponentFixture<GameBoardComponent>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;
    let turnStartedSubject: Subject<any>;

    const getDummyGameState = (): GameState => ({
        board: [
            [0, 1],
            [2, 3],
        ],
        players: [
            {
                id: 'player1',
                name: 'Player One',
                avatar: '',
                isHost: false,
                life: 0,
                speed: 0,
                attack: 0,
                defense: 0,
                maxLife: 0,
            },
            {
                id: 'player2',
                name: 'Player Two',
                avatar: '',
                isHost: false,
                life: 0,
                speed: 0,
                attack: 0,
                defense: 0,
                maxLife: 0,
            },
        ],
        playerPositions: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ],
        currentPlayer: 'player1',
        availableMoves: [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
        ],
        shortestMoves: [
            [
                { x: 0, y: 1 },
                { x: 0, y: 0 },
            ],
        ],
        id: '',
        turnCounter: 0,
        spawnPoints: [],
        currentPlayerMovementPoints: 0,
        currentPlayerActionPoints: 0,
        debug: false,
    });

    beforeEach(async () => {
        turnStartedSubject = new Subject<any>();
        lobbyServiceSpy = jasmine.createSpyObj('LobbyService', ['onTurnStarted']);
        lobbyServiceSpy.onTurnStarted.and.returnValue(turnStartedSubject.asObservable());

        await TestBed.configureTestingModule({
            imports: [GameBoardComponent],
            providers: [{ provide: LobbyService, useValue: lobbyServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameBoardComponent);
        component = fixture.componentInstance;
        component.currentPlayerId = 'player1';
        component.gameState = getDummyGameState();
        component.lobbyId = 'lobby1';
    });

    it('should initialize board and available moves on ngOnInit', () => {
        fixture.detectChanges();
        expect(component.tiles.length).toEqual(getDummyGameState().board.length);
        expect(component.availableMoves).toEqual(getDummyGameState().availableMoves);
    });

    it('should update available moves and clear path on lobbyService turn started event', () => {
        fixture.detectChanges();
        component.highlightedPath = [{ x: 1, y: 1 }];
        turnStartedSubject.next({ gameState: { availableMoves: [{ x: 0, y: 1 }] } });
        expect(component.availableMoves).toEqual([{ x: 0, y: 1 }]);
        expect(component.highlightedPath).toEqual([]);
    });

    it('should reinitialize board on ngOnChanges when gameState changes', () => {
        const newGameState = {
            ...getDummyGameState(),
            board: [
                [3, 2],
                [1, 0],
            ],
        };
        component.gameState = newGameState;
        component.ngOnChanges({
            gameState: new SimpleChange(getDummyGameState(), newGameState, false),
        });
        expect(component.tiles[0][0].type).toEqual(newGameState.board[0][0] % OBJECT_MULTIPLIER);
        expect(component.availableMoves).toEqual(newGameState.availableMoves);
        expect(component.highlightedPath).toEqual([]);
    });

    it('should return true for an available move', () => {
        component.availableMoves = [{ x: 0, y: 1 }];
        expect(component.isAvailableMove(0, 1)).toBeTrue();
        expect(component.isAvailableMove(1, 1)).toBeFalse();
    });

    it('should return true when position is on the highlighted path', () => {
        component.highlightedPath = [{ x: 1, y: 1 }];
        expect(component.isOnHighlightedPath(1, 1)).toBeTrue();
        expect(component.isOnHighlightedPath(0, 0)).toBeFalse();
    });

    it('should return player info at a given position', () => {
        const info = component.getPlayerAtPosition(0, 0);
        expect(info).not.toBeNull();
        expect(info?.player.id).toEqual('player1');
        expect(info?.isCurrentPlayer).toBeTrue();
        expect(info?.isLocalPlayer).toBeTrue();
    });

    it('should return null if no player is at the given position', () => {
        const info = component.getPlayerAtPosition(1, 0);
        expect(info).toBeNull();
    });

    it('should emit tileClicked on onTileClick when it is my turn and the tile is available', () => {
        spyOn(component.tileClicked, 'emit');
        component.availableMoves = [{ x: 0, y: 1 }];
        component.highlightedPath = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ];
        component.currentPlayerId = 'player1';
        component.gameState.currentPlayer = 'player1';
        component.onTileClick({ x: 0, y: 1, type: 1, object: 0, id: '0-1' });
        expect(component.tileClicked.emit).toHaveBeenCalledWith(component.highlightedPath);
    });

    it('should not emit tileClicked on onTileClick when it is not my turn', () => {
        spyOn(component.tileClicked, 'emit');
        component.availableMoves = [{ x: 0, y: 1 }];
        component.highlightedPath = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ];
        component.currentPlayerId = 'player2';
        component.gameState.currentPlayer = 'player1';
        component.onTileClick({ x: 0, y: 1, type: 1, object: 0, id: '0-1' });
        expect(component.tileClicked.emit).not.toHaveBeenCalled();
    });

    it('should update highlightedPath on onTileHover when not in action mode and move is available', () => {
        component.action = false;
        component.currentPlayerId = 'player1';

        const newGameState = {
            ...getDummyGameState(),
            availableMoves: [
                { x: 0, y: 1 },
                { x: 1, y: 0 },
            ],
            shortestMoves: [
                [
                    { x: 0, y: 1 },
                    { x: 0, y: 0 },
                ],
            ],
        };

        component.gameState = newGameState;
        component.ngOnChanges({
            gameState: new SimpleChange(getDummyGameState(), newGameState, false),
        });

        component.onTileHover({ x: 0, y: 1, type: 1, object: 0, id: '0-1' });

        expect(component.highlightedPath).toEqual([
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ]);
    });

    it('should clear highlightedPath on onTileHover when in action mode', () => {
        component.action = true;
        component.highlightedPath = [{ x: 1, y: 1 }];
        component.onTileHover({ x: 0, y: 1, type: 1, object: 0, id: '0-1' });
        expect(component.highlightedPath).toEqual([]);
    });

    it('should clear highlightedPath on onTileLeave', () => {
        component.highlightedPath = [{ x: 1, y: 1 }];
        component.onTileLeave();
        expect(component.highlightedPath).toEqual([]);
    });

    it('should correctly compute path in showPathToTile', () => {
        const testState = getDummyGameState();
        testState.availableMoves = [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
        ];
        testState.shortestMoves = [
            [
                { x: 0, y: 1 },
                { x: 0, y: 0 },
            ],
        ];
        component.gameState = testState;
        const path = (component as any).showPathToTile({ x: 0, y: 1 });
        expect(path).toEqual([
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ]);
    });

    it('should correctly determine if it is my turn', () => {
        component.gameState = getDummyGameState();
        component.currentPlayerId = 'player1';
        expect((component as any).isMyTurn()).toBeTrue();
        component.currentPlayerId = 'player2';
        expect((component as any).isMyTurn()).toBeFalse();
    });

    it('should initialize board correctly based on the gameState board', () => {
        (component as any).initializeBoard();
        expect(component.tiles.length).toEqual(getDummyGameState().board.length);
        expect(component.tiles[0].length).toEqual(getDummyGameState().board[0].length);
        const tile = component.tiles[0][1];
        expect(tile.x).toEqual(0);
        expect(tile.y).toEqual(1);
        expect(tile.id).toEqual('0-1');
        expect(tile.type).toEqual(getDummyGameState().board[0][1] % OBJECT_MULTIPLIER);
        expect(tile.object).toEqual(Math.floor(getDummyGameState().board[0][1] / OBJECT_MULTIPLIER));
    });

    it('should update available moves correctly with updateAvailableMoves', () => {
        component.gameState.availableMoves = [{ x: 1, y: 1 }];
        (component as any).updateAvailableMoves();
        expect(component.availableMoves).toEqual([{ x: 1, y: 1 }]);
    });

    it('should clear path highlights with clearPathHighlights', () => {
        component.highlightedPath = [{ x: 1, y: 1 }];
        (component as any).clearPathHighlights();
        expect(component.highlightedPath).toEqual([]);
    });

    it('should return empty array when gameState is undefined', () => {
        component.gameState = undefined as unknown as GameState;
        const path = (component as any).showPathToTile({ x: 0, y: 1 });
        expect(path).toEqual([]);
    });

    it('should return empty array when current player is not found', () => {
        component.gameState.currentPlayer = 'invalid-player-id';
        const path = (component as any).showPathToTile({ x: 0, y: 1 });
        expect(path).toEqual([]);
    });

    it('should return empty array when player position is undefined', () => {
        component.gameState.playerPositions = [];
        const path = (component as any).showPathToTile({ x: 0, y: 1 });
        expect(path).toEqual([]);
    });

    it('should return empty array when destination is not in available moves', () => {
        component.gameState.availableMoves = [{ x: 1, y: 0 }];
        const path = (component as any).showPathToTile({ x: 0, y: 1 });
        expect(path).toEqual([]);
    });

    it('should handle undefined availableMoves in turn started event', () => {
        fixture.detectChanges();
        component.highlightedPath = [{ x: 1, y: 1 }];

        turnStartedSubject.next({
            gameState: {
                availableMoves: undefined,
            },
        });

        expect(component.availableMoves).toEqual([]);
        expect(component.highlightedPath).toEqual([]);
    });

    it('should detect horizontal adjacency (yDiff === 0)', () => {
        const pos1: Coordinates = { x: 0, y: 0 };
        const pos2: Coordinates = { x: 1, y: 0 };
        expect((component as any).isAdjacent(pos1, pos2)).toBeTrue();
    });

    it('should detect vertical adjacency (xDiff === 0)', () => {
        const pos1: Coordinates = { x: 0, y: 0 };
        const pos2: Coordinates = { x: 0, y: 1 };
        expect((component as any).isAdjacent(pos1, pos2)).toBeTrue();
    });

    it('should reject diagonal non-adjacency', () => {
        const pos1: Coordinates = { x: 0, y: 0 };
        const pos2: Coordinates = { x: 1, y: 1 };
        expect((component as any).isAdjacent(pos1, pos2)).toBeFalse();
    });

    it('should return null when gameState is undefined', () => {
        component.gameState = undefined as unknown as GameState;
        const result = component.getPlayerAtPosition(0, 0);
        expect(result).toBeNull();
    });

    it('should return null when playerPositions is empty', () => {
        const testState = getDummyGameState();
        testState.playerPositions = [];
        component.gameState = testState;
        const result = component.getPlayerAtPosition(0, 0);
        expect(result).toBeNull();
    });

    it('should emit actionClicked and exit early when action is true in onTileClick', () => {
        spyOn(component.actionClicked, 'emit');
        spyOn(component.tileClicked, 'emit');

        component.action = true;

        const sampleTile = { x: 0, y: 1, type: 1, object: 0, id: '0-1' };

        component.onTileClick(sampleTile);

        expect(component.actionClicked.emit).toHaveBeenCalledWith(sampleTile);
        expect(component.tileClicked.emit).not.toHaveBeenCalled();
    });
});
