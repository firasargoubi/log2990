import { TestBed } from '@angular/core/testing';
import { GameState } from '@common/game-state';
import { TileTypes } from '@common/game.interface';
import { Tile } from '@common/tile';
import { ActionService } from './action.service';
import { NotificationService } from './notification.service';

describe('ActionService', () => {
    let service: ActionService;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('NotificationService', ['showInfo']);

        TestBed.configureTestingModule({
            providers: [ActionService, { provide: NotificationService, useValue: spy }],
        });

        service = TestBed.inject(ActionService);
        notificationServiceSpy = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get current player coordinates', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const coordinates = service.getCurrentPlayerCoordinates('player1');
        expect(coordinates).toEqual({ x: 1, y: 2 });
    });

    it('should return undefined if player not found', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const coordinates = service.getCurrentPlayerCoordinates('player2');
        expect(coordinates).toBeUndefined();
    });

    it('should check if player is on tile', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const isOnTile = service.isPlayerOnTile(tile);
        expect(isOnTile).toBeTrue();
    });

    it('should check if tile is next to player', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const isNextToPlayer = service.isTileNextToPlayer(tile);
        expect(isNextToPlayer).toBeTrue();
    });

    it('should return undefined if no action points left', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 0,
        } as GameState;

        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const actionType = service.getActionType(tile, service.gameState);
        expect(actionType).toBeUndefined();
        expect(notificationServiceSpy.showInfo).toHaveBeenCalledWith("Vous ne pouvez plus effectuer d'action ce tour-ci!");
    });

    it('should return battle action type', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const actionType = service.getActionType(tile, service.gameState);
        expect(actionType).toBe('battle');
    });

    it('should return openDoor action type', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const actionType = service.getActionType(tile, service.gameState);
        expect(actionType).toBe('battle');
    });

    it('should return closeDoor action type', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const actionType = service.getActionType(tile, service.gameState);
        expect(actionType).toBe('battle');
    });

    it('should increment action counter', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        service.incrementActionCounter();
        expect(service.gameState.currentPlayerActionPoints).toBe(2);
    });
    it('should return false if gameState is not defined', () => {
        service.gameState = null;
        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const isNextToPlayer = service.isTileNextToPlayer(tile);
        expect(isNextToPlayer).toBeFalse();
    });

    it('should return false if current player coordinates are not found', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player2',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 2, y: 3, type: TileTypes.Grass, id: 'tile2', object: 0 };
        const isNextToPlayer = service.isTileNextToPlayer(tile);
        expect(isNextToPlayer).toBeFalse();
    });

    it('should return true if tile is next to player horizontally', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 2, y: 2, type: TileTypes.Grass, id: 'tile2', object: 0 };
        const isNextToPlayer = service.isTileNextToPlayer(tile);
        expect(isNextToPlayer).toBeTrue();
    });

    it('should return true if tile is next to player vertically', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 1, y: 3, type: TileTypes.Grass, id: 'tile2', object: 0 };
        const isNextToPlayer = service.isTileNextToPlayer(tile);
        expect(isNextToPlayer).toBeTrue();
    });

    it('should return true if tile is diagonally next to player', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 2, y: 3, type: TileTypes.Grass, id: 'tile2', object: 0 };
        const isNextToPlayer = service.isTileNextToPlayer(tile);
        expect(isNextToPlayer).toBeTrue();
    });

    it('should return false if tile is not next to player', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 3, y: 3, type: TileTypes.Grass, id: 'tile2', object: 0 };
        const isNextToPlayer = service.isTileNextToPlayer(tile);
        expect(isNextToPlayer).toBeFalse();
    });

    it('should return undefined if no opponent is on tile', () => {
        service.gameState = {
            players: [{ id: 'player1' }, { id: 'player2' }],
            playerPositions: [
                { x: 1, y: 2 },
                { x: 2, y: 3 },
            ],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 3, y: 3, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const opponent = service.findOpponent(tile);
        expect(opponent).toBeUndefined();
    });

    it('should return undefined if gameState is null', () => {
        service.gameState = null;

        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const opponent = service.findOpponent(tile);
        expect(opponent).toBeUndefined();
    });

    it('should return openDoor action type when standing next to a closed door', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 2, y: 2, type: TileTypes.DoorClosed, id: 'tile2', object: 0 };
        const actionType = service.getActionType(tile, service.gameState);
        expect(actionType).toBe('openDoor');
    });

    it('should return closeDoor action type when standing next to an open door', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 2, y: 2, type: TileTypes.DoorOpen, id: 'tile2', object: 0 };
        const actionType = service.getActionType(tile, service.gameState);
        expect(actionType).toBe('closeDoor');
    });

    it('should return undefined if tile is not next to player', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 4, y: 4, type: TileTypes.Grass, id: 'tile3', object: 0 };
        const actionType = service.getActionType(tile, service.gameState);
        expect(actionType).toBeUndefined();
    });

    it('should not decrement action points if no action is performed', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 4, y: 4, type: TileTypes.Grass, id: 'tile3', object: 0 };
        service.getActionType(tile, service.gameState);
        expect(service.gameState.currentPlayerActionPoints).toBe(1);
    });

    it('should return -1 if player is not found in gameState', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const playerIndex = service.gameState?.players.findIndex((p) => p.id === 'player2') ?? -1;
        expect(playerIndex).toBe(-1);
    });

    it('should return true if player coordinates match tile coordinates', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const coordinates = { x: 1, y: 2 };
        const tile: Tile = { x: 1, y: 2, type: TileTypes.Grass, id: 'tile1', object: 0 };
        const isSamePosition = coordinates?.x === tile.x && coordinates?.y === tile.y;
        expect(isSamePosition).toBeTrue();
    });

    it('should return false if player coordinates do not match tile coordinates', () => {
        service.gameState = {
            players: [{ id: 'player1' }],
            playerPositions: [{ x: 1, y: 2 }],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const coordinates = { x: 1, y: 2 };
        const tile: Tile = { x: 2, y: 3, type: TileTypes.Grass, id: 'tile2', object: 0 };
        const isSamePosition = coordinates?.x === tile.x && coordinates?.y === tile.y;
        expect(isSamePosition).toBeFalse();
    });

    it('should return undefined when gameState is null', () => {
        service.gameState = null;
        const coordinates = service.getCurrentPlayerCoordinates('player1');
        expect(coordinates).toBeUndefined();
    });

    it('should return undefined if no player is on the tile (y coordinate mismatch)', () => {
        service.gameState = {
            players: [{ id: 'player1' }, { id: 'player2' }],
            playerPositions: [
                { x: 1, y: 2 },
                { x: 2, y: 4 },
            ],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 2, y: 3, type: TileTypes.Grass, id: 'tile2', object: 0 };
        const opponent = service.findOpponent(tile);
        expect(opponent).toBeUndefined();
    });

    it('should return undefined if no player is on the tile (x coordinate mismatch)', () => {
        service.gameState = {
            players: [{ id: 'player1' }, { id: 'player2' }],
            playerPositions: [
                { x: 1, y: 2 },
                { x: 3, y: 3 },
            ],
            currentPlayer: 'player1',
            currentPlayerActionPoints: 1,
        } as GameState;

        const tile: Tile = { x: 2, y: 3, type: TileTypes.Grass, id: 'tile3', object: 0 };
        const opponent = service.findOpponent(tile);
        expect(opponent).toBeUndefined();
    });
});
