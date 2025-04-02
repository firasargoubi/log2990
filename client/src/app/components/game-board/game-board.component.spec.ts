/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OBJECT_MULTIPLIER } from '@app/Consts/app-constants';
import { LobbyService } from '@app/services/lobby.service';
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
                winCount: 0,
                pendingItem: 0,
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
                winCount: 0,
                pendingItem: 0,
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
        gameMode: 'default', // Add a valid value for gameMode
    });

    beforeEach(async () => {
        turnStartedSubject = new Subject<any>();
        lobbyServiceSpy = jasmine.createSpyObj('LobbyService', ['onTurnStarted']);
        lobbyServiceSpy.onTurnStarted.and.returnValue(turnStartedSubject.asObservable());
        lobbyServiceSpy.requestTeleport = jasmine.createSpy('requestTeleport');

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
    });

    it('should return true for an available move', () => {
        component['availableMoves'] = [{ x: 0, y: 1 }];
        expect(component.isAvailableMove(0, 1)).toBeTrue();
        expect(component.isAvailableMove(1, 1)).toBeFalse();
    });

    it('should return true when position is on the highlighted path', () => {
        component['highlightedPath'] = [{ x: 1, y: 1 }];
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
        component['availableMoves'] = [{ x: 0, y: 1 }];
        component['highlightedPath'] = [
            { x: 0, y: 1 },
            { x: 0, y: 0 },
        ];
        component.currentPlayerId = 'player1';
        component.gameState.currentPlayer = 'player1';
        component.onTileClick({ x: 0, y: 1, type: 1, object: 0, id: '0-1' });
        expect(component.tileClicked.emit).toHaveBeenCalledWith(component['highlightedPath']);
    });

    it('should not emit tileClicked on onTileClick when it is not my turn', () => {
        spyOn(component.tileClicked, 'emit');
        component['availableMoves'] = [{ x: 0, y: 1 }];
        component['highlightedPath'] = [
            { x: 0, y: 1 },
            { x: 0, y: 0 },
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

        expect(component['highlightedPath']).toEqual([
            { x: 0, y: 1 },
            { x: 0, y: 0 },
        ]);
    });

    it('should clear highlightedPath on onTileHover when in action mode', () => {
        component.action = true;
        component['highlightedPath'] = [{ x: 1, y: 1 }];
        component.onTileHover({ x: 0, y: 1, type: 1, object: 0, id: '0-1' });
        expect(component['highlightedPath']).toEqual([]);
    });

    it('should clear highlightedPath on onTileLeave', () => {
        component['highlightedPath'] = [{ x: 1, y: 1 }];
        component.onTileLeave();
        expect(component['highlightedPath']).toEqual([]);
    });

    it('should correctly compute path in showPathToTile', () => {
        const testState = getDummyGameState();
        testState['availableMoves'] = [
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
            { x: 0, y: 1 },
            { x: 0, y: 0 },
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

    it('should clear path highlights with clearPathHighlights', () => {
        component['highlightedPath'] = [{ x: 1, y: 1 }];
        (component as any).clearPathHighlights();
        expect(component['highlightedPath']).toEqual([]);
    });

    it('should throw an error when gameState is undefined', () => {
        component.gameState = undefined as unknown as GameState;
        expect(() => (component as any).showPathToTile({ x: 0, y: 1 })).toThrow();
    });

    it('should return correct path even when playerPositions is empty', () => {
        const testState = getDummyGameState();
        testState.playerPositions = [];
        component.gameState = testState;
        const path = (component as any).showPathToTile({ x: 0, y: 1 });
        expect(path).toEqual([
            { x: 0, y: 1 },
            { x: 0, y: 0 },
        ]);
    });

    it('should return empty array when destination is not in available moves', () => {
        component.gameState['availableMoves'] = [{ x: 1, y: 0 }];
        const path = (component as any).showPathToTile({ x: 0, y: 1 });
        expect(path).toEqual([]);
    });

    it('should return null when gameState is undefined for getPlayerAtPosition', () => {
        component.gameState = undefined as unknown as GameState;
        const result = component.getPlayerAtPosition(0, 0);
        expect(result).toBeNull();
    });

    it('should return null when playerPositions is empty for getPlayerAtPosition', () => {
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
    it('should not emit any events on onTileClick when gameState.animation is true', () => {
        component.gameState.animation = true;
        spyOn(component.tileClicked, 'emit');
        spyOn(component.actionClicked, 'emit');
        const sampleTile = { x: 0, y: 1, type: 1, object: 0, id: '0-1' };

        component.onTileClick(sampleTile);

        expect(component.tileClicked.emit).not.toHaveBeenCalled();
        expect(component.actionClicked.emit).not.toHaveBeenCalled();
    });

    it('should not emit any events on onTileClick when inCombat is true', () => {
        component.inCombat = true;
        spyOn(component.tileClicked, 'emit');
        spyOn(component.actionClicked, 'emit');
        const sampleTile = { x: 0, y: 1, type: 1, object: 0, id: '0-1' };

        component.onTileClick(sampleTile);

        expect(component.tileClicked.emit).not.toHaveBeenCalled();
        expect(component.actionClicked.emit).not.toHaveBeenCalled();
    });

    it('should not update highlightedPath on onTileHover when gameState.animation is true', () => {
        component.gameState.animation = true;
        component['highlightedPath'] = [{ x: 5, y: 5 }];
        const initialPath = [...component['highlightedPath']];

        component.onTileHover({ x: 0, y: 1, type: 1, object: 0, id: '0-1' });

        expect(component['highlightedPath']).toEqual(initialPath);
    });

    it('should not update highlightedPath on onTileHover when inCombat is true', () => {
        component.inCombat = true;
        component['highlightedPath'] = [{ x: 5, y: 5 }];
        const initialPath = [...component['highlightedPath']];

        component.onTileHover({ x: 0, y: 1, type: 1, object: 0, id: '0-1' });

        expect(component['highlightedPath']).toEqual(initialPath);
    });
    it('should call lobbyService.requestTeleport and not emit infoSent on onTileRightClick when gameState.debug is true', () => {
        component.gameState.debug = true;
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault']);
        const sampleTile = { x: 1, y: 1, type: 1, object: 5, id: '1-1' };

        lobbyServiceSpy.requestTeleport = jasmine.createSpy('requestTeleport');
        spyOn(component.infoSent, 'emit');

        component.onTileRightClick(event, sampleTile);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(lobbyServiceSpy.requestTeleport).toHaveBeenCalledWith(component.lobbyId, { x: sampleTile.x, y: sampleTile.y });
        expect(component.infoSent.emit).not.toHaveBeenCalled();
    });

    it('should emit infoSent with generated tile info and not call requestTeleport on onTileRightClick when gameState.debug is false', () => {
        component.gameState.debug = false;
        const event = jasmine.createSpyObj('MouseEvent', ['preventDefault']);
        const sampleTile = { x: 0, y: 1, type: 2, object: 3, id: '0-1' };

        spyOn(component.infoSent, 'emit');
        lobbyServiceSpy.requestTeleport = jasmine.createSpy('requestTeleport');

        component.onTileRightClick(event, sampleTile);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(lobbyServiceSpy.requestTeleport).not.toHaveBeenCalled();
        const expectedInfo = (component as any).generateTileInfo(sampleTile);
        expect(component.infoSent.emit).toHaveBeenCalledWith(expectedInfo);
    });
    it('should generate tile info with player info when a player is present', () => {
        const sampleTile = { x: 0, y: 0, type: 0, object: 0, id: '0-0' };
        const info = (component as any).generateTileInfo(sampleTile);
        expect(info).toContain('Player: Player One');
        expect(info).toContain('Tile Type: 0');
    });

    it('should generate tile info without player info when no player is present', () => {
        const sampleTile = { x: 0, y: 1, type: 1, object: 0, id: '0-1' };
        const info = (component as any).generateTileInfo(sampleTile);
        expect(info).not.toContain('Player:');
        expect(info).toContain('Tile Type: 1');
    });

    it('should return empty array from showPathToTile if currentPlayer is not found (playerIndex === -1)', () => {
        component.currentPlayerId = 'nonexistent';
        const result = (component as any).showPathToTile({ x: 0, y: 1 });
        expect(result).toEqual([]);
    });
});
