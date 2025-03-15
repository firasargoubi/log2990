import { TestBed } from '@angular/core/testing';
import { TileTypes } from '@app/interfaces/tile-types';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { ActionService } from './action.service';
import { MouseService } from './mouse.service';

describe('ActionService', () => {
    let service: ActionService;
    let mockMouseService: jasmine.SpyObj<MouseService>;

    beforeEach(() => {
        mockMouseService = jasmine.createSpyObj('MouseService', ['']);
        TestBed.configureTestingModule({
            providers: [ActionService, { provide: MouseService, useValue: mockMouseService }],
        });
        service = TestBed.inject(ActionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getCurrentPlayerCoordinates', () => {
        it('should return player coordinates if gameState is defined', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            service.gameState = gameState;
            expect(service.getCurrentPlayerCoordinates(player)).toEqual({ x: 1, y: 1 });
        });

        it('should return undefined if gameState is not defined', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            expect(service.getCurrentPlayerCoordinates(player)).toBeUndefined();
        });
    });

    describe('isPlayerOnTile', () => {
        it('should return true if player is on the tile', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const tile: Tile = { id: 'tile1', x: 1, y: 1, type: TileTypes.Grass, object: 0 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            service.gameState = gameState;
            expect(service.isPlayerOnTile(tile)).toBeTrue();
        });

        it('should return false if player is not on the tile', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.Grass, object: 0 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            service.gameState = gameState;
            expect(service.isPlayerOnTile(tile)).toBeFalse();
        });
    });

    describe('isTileNextToPlayer', () => {
        it('should return true if tile is next to the player', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.Grass, object: 0 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            service.gameState = gameState;
            expect(service.isTileNextToPlayer(tile)).toBeTrue();
        });

        it('should return false if tile is not next to the player', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const tile: Tile = { id: 'tile2', x: 3, y: 3, type: TileTypes.Grass, object: 0 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            service.gameState = gameState;
            expect(service.isTileNextToPlayer(tile)).toBeFalse();
        });
    });

    describe('getActionType', () => {
        it('should return "openDoor" if tile is next to player and tile type is DoorClosed', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.DoorClosed, object: 0 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            expect(service.getActionType(tile, gameState)).toBe('openDoor');
        });

        it('should return "closeDoor" if tile is next to player and tile type is DoorOpen', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.DoorOpen, object: 0 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            expect(service.getActionType(tile, gameState)).toBe('closeDoor');
        });

        it('should return "battle" if tile is next to player and player is on the tile', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const tile: Tile = { id: 'tile1', x: 1, y: 1, type: TileTypes.Water, object: 0 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            expect(service.getActionType(tile, gameState)).toBe('battle');
        });

        it('should return undefined if tile is not next to player', () => {
            const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
            const tile: Tile = { id: 'tile2', x: 3, y: 3, type: TileTypes.Grass, object: 0 };
            const gameState: GameState = {
                id: 'game1',
                board: [],
                gameBoard: [],
                turnCounter: 0,
                players: [player],
                currentPlayer: '1',
                availableMoves: [],
                playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                currentPlayerMovementPoints: 0,
            };
            expect(service.getActionType(tile, gameState)).toBeUndefined();
        });

        describe('isTileNextToPlayer', () => {
            it('should return true if tile is next to the player', () => {
                const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
                const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.Grass, object: 0 };
                const gameState: GameState = {
                    id: 'game1',
                    board: [],
                    gameBoard: [],
                    turnCounter: 0,
                    players: [player],
                    currentPlayer: '1',
                    availableMoves: [],
                    playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                    currentPlayerMovementPoints: 0,
                };
                service.gameState = gameState;
                expect(service.isTileNextToPlayer(tile)).toBeTrue();
            });

            it('should return false if tile is not next to the player', () => {
                const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
                const tile: Tile = { id: 'tile2', x: 3, y: 3, type: TileTypes.Grass, object: 0 };
                const gameState: GameState = {
                    id: 'game1',
                    board: [],
                    gameBoard: [],
                    turnCounter: 0,
                    players: [player],
                    currentPlayer: '1',
                    availableMoves: [],
                    playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                    currentPlayerMovementPoints: 0,
                };
                service.gameState = gameState;
                expect(service.isTileNextToPlayer(tile)).toBeFalse();
            });

            it('should return false if gameState is not defined', () => {
                const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.Grass, object: 0 };
                service.gameState = null;
                expect(service.isTileNextToPlayer(tile)).toBeFalse();
            });

            it('should return false if currentPlayer is not found', () => {
                const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
                const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.Grass, object: 0 };
                const gameState: GameState = {
                    id: 'game1',
                    board: [],
                    gameBoard: [],
                    turnCounter: 0,
                    players: [player],
                    currentPlayer: '2',
                    availableMoves: [],
                    playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                    currentPlayerMovementPoints: 0,
                };
                service.gameState = gameState;
                expect(service.isTileNextToPlayer(tile)).toBeFalse();
            });

            it('should return false if currentPlayerCoordinates are not found', () => {
                const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
                const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.Grass, object: 0 };
                const gameState: GameState = {
                    id: 'game1',
                    board: [],
                    gameBoard: [],
                    turnCounter: 0,
                    players: [player],
                    currentPlayer: '1',
                    availableMoves: [],
                    playerPositions: new Map(),
                    currentPlayerMovementPoints: 0,
                };
                service.gameState = gameState;
                expect(service.isTileNextToPlayer(tile)).toBeFalse();
            });
            it('should return undefined if tile is not next to player', () => {
                const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
                const tile: Tile = { id: 'tile2', x: 3, y: 3, type: TileTypes.Grass, object: 0 };
                const gameState: GameState = {
                    id: 'game1',
                    board: [],
                    gameBoard: [],
                    turnCounter: 0,
                    players: [player],
                    currentPlayer: '1',
                    availableMoves: [],
                    playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                    currentPlayerMovementPoints: 0,
                };
                expect(service.getActionType(tile, gameState)).toBeUndefined();
            });

            it('should return undefined if tile type is not DoorClosed or DoorOpen and player is not on the tile', () => {
                const player: Player = { id: '1', name: 'Player 1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 50, defense: 30 };
                const tile: Tile = { id: 'tile1', x: 2, y: 2, type: TileTypes.Grass, object: 0 };
                const gameState: GameState = {
                    id: 'game1',
                    board: [],
                    gameBoard: [],
                    turnCounter: 0,
                    players: [player],
                    currentPlayer: '1',
                    availableMoves: [],
                    playerPositions: new Map([['1', { x: 1, y: 1 }]]),
                    currentPlayerMovementPoints: 0,
                };
                expect(service.getActionType(tile, gameState)).toBeUndefined();
            });
        });
    });
});
