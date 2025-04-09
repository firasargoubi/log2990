/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { GameState } from '@common/game-state';
import { GameType, ITEM_EFFECTS, ObjectsTypes, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { SinonSandbox, SinonStub } from 'sinon';
import { ItemService } from './item.service';
import { PathfindingService } from './pathfinding.service';

describe('ItemService - applyEffect()', () => {
    let itemService: ItemService;
    let player: Player;
    let pathFindingService: PathfindingService;
    beforeEach(() => {
        itemService = new ItemService(pathFindingService);

        player = {
            id: '1',
            name: 'Player',
            avatar: '🐱',
            isHost: false,
            life: 8,
            maxLife: 10,
            speed: 3,
            attack: 2,
            defense: 1,
            winCount: 0,
            pendingItem: 0,
            items: [],
        };
    });

    it('should apply BOOTS effect (+2 speed, -1 attack)', () => {
        itemService.applyAttributeEffects(player, ObjectsTypes.BOOTS);

        expect(player.speed).to.equal(5);
        expect(player.attack).to.equal(1);
        expect(player.defense).to.equal(1);
        expect(player.life).to.equal(8);
    });

    it('should apply SWORD effect (+1 attack, -1 defense)', () => {
        itemService.applyAttributeEffects(player, ObjectsTypes.SWORD);

        expect(player.attack).to.equal(3);
        expect(player.defense).to.equal(0);
        expect(player.speed).to.equal(3);
        expect(player.life).to.equal(8);
    });

    it('should not apply anything if item has no effect', () => {
        const originalPlayer = { ...player };

        itemService.applyAttributeEffects(player, ObjectsTypes.POTION);

        expect(player).to.deep.equal(originalPlayer);
    });

    it('should not exceed maxLife when healing', () => {
        player.life = 9;
        const healingItem = 999 as ObjectsTypes;
        ITEM_EFFECTS[healingItem] = { life: 5 };

        itemService.applyAttributeEffects(player, healingItem);

        expect(player.life).to.equal(10);
    });
});

describe('ItemService - dropItems', () => {
    let itemService: ItemService;
    let gameState: GameState;
    let player: Player;
    let sandbox: SinonSandbox;
    let pathFindingServiceStub: {
        findClosestAvailableSpot: SinonStub;
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        pathFindingServiceStub = {
            findClosestAvailableSpot: sandbox.stub().returns({ x: 1, y: 1 }),
        };

        itemService = new ItemService(pathFindingServiceStub as unknown as PathfindingService);

        player = {
            id: '1',
            name: 'Player',
            avatar: '🐱',
            isHost: false,
            life: 8,
            maxLife: 10,
            speed: 3,
            attack: 2,
            defense: 1,
            winCount: 0,
            pendingItem: 0,
            items: [ObjectsTypes.BOOTS, ObjectsTypes.SWORD],
        };

        gameState = {
            id: 'game1',
            currentPlayerActionPoints: 1,
            board: [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ],
            turnCounter: 1,
            players: [player],
            currentPlayer: '1',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [{ x: 0, y: 0 }],
            spawnPoints: [{ x: 1, y: 1 }],
            currentPlayerMovementPoints: 6,
            debug: false,
            gameMode: GameType.capture,
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should modify board tiles where items are dropped', () => {
        player.items = [ObjectsTypes.BOOTS];
        itemService.dropItems(0, gameState);

        expect(gameState.board[1][1]).to.equal(10);
    });

    it('should call findClosestAvailableSpot for each item', () => {
        itemService.dropItems(0, gameState);
        expect(pathFindingServiceStub.findClosestAvailableSpot.callCount).to.equal(2);
    });

    it('should handle empty inventory', () => {
        player.items = [];
        const originalBoard = JSON.parse(JSON.stringify(gameState.board));

        itemService.dropItems(0, gameState);

        expect(gameState.board).to.deep.equal(originalBoard);
    });

    it('should handle undefined player items', () => {
        (player as Player).items = undefined;
        expect(() => itemService.dropItems(0, gameState)).not.to.throw();
    });

    it('should not modify board if no available spot found', () => {
        pathFindingServiceStub.findClosestAvailableSpot.returns({ x: -1, y: -1 });
        const originalBoard = JSON.parse(JSON.stringify(gameState.board));

        itemService.dropItems(0, gameState);

        expect(gameState.board).to.deep.equal(originalBoard);
    });
});

describe('ItemService - applyPotionEffect & applyJuiceEffect', () => {
    let itemService: ItemService;
    let attacker: Player;
    let defender: Player;
    let sandbox: SinonSandbox;
    let pathFindingService: PathfindingService;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        pathFindingService = {} as PathfindingService;
        itemService = new ItemService(pathFindingService);
        attacker = {
            id: '1',
            name: 'Attacker',
            avatar: '🗡️',
            isHost: false,
            life: 5,
            maxLife: 10,
            speed: 3,
            attack: 2,
            defense: 1,
            winCount: 0,
            pendingItem: 0,
            items: [ObjectsTypes.POTION],
        };

        defender = {
            id: '2',
            name: 'Defender',
            avatar: '🛡️',
            isHost: false,
            life: 9,
            maxLife: 10,
            speed: 3,
            attack: 2,
            defense: 1,
            winCount: 0,
            pendingItem: 0,
            items: [ObjectsTypes.JUICE],
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should reduce defender life by 1 if conditions are met', () => {
        itemService.applyPotionEffect(attacker, defender);
        expect(defender.life).to.equal(8);
    });

    it('should not change defender life if life difference is less than 3', () => {
        defender.life = 7;
        itemService.applyPotionEffect(attacker, defender);
        expect(defender.life).to.equal(7);
    });

    it('should not change defender life if attacker does not have a potion', () => {
        attacker.items = [];
        itemService.applyPotionEffect(attacker, defender);
        expect(defender.life).to.equal(9);
    });

    it('should not throw error if attacker has undefined items', () => {
        attacker.items = undefined;
        expect(() => itemService.applyPotionEffect(attacker, defender)).not.to.throw();
        expect(defender.life).to.equal(9);
    });

    it('should not throw error if attacker or defender life is exactly 3 apart', () => {
        defender.life = 8;
        expect(() => itemService.applyPotionEffect(attacker, defender)).not.to.throw();
        expect(defender.life).to.equal(7);
    });

    it('should not apply effect if attacker and defender have the same life', () => {
        defender.life = 5;
        itemService.applyPotionEffect(attacker, defender);
        expect(defender.life).to.equal(5);
    });

    it('should not apply effect if attacker has more life than defender', () => {
        attacker.life = 10;
        defender.life = 7;
        itemService.applyPotionEffect(attacker, defender);
        expect(defender.life).to.equal(7);
    });

    it('should increase defender life by 3 if conditions are met', () => {
        defender.life = 1;
        itemService.applyJuiceEffect(defender);
        expect(defender.life).to.equal(4);
    });

    it('should not change defender life if life is other than 1', () => {
        defender.life = 2;
        itemService.applyJuiceEffect(defender);
        expect(defender.life).to.equal(2);
    });

    it('should not change defender life if defender does not have a potion', () => {
        defender.items = [];
        itemService.applyJuiceEffect(defender);
        expect(defender.life).to.equal(9);
    });

    it('should not throw error if defender has undefined items', () => {
        defender.items = undefined;
        expect(() => itemService.applyJuiceEffect(defender)).not.to.throw();
        expect(defender.life).to.equal(9);
    });
    describe('ItemService - removeAttributeEffects', () => {
        let player: Player;

        beforeEach(() => {
            player = {
                id: '1',
                name: 'Player',
                avatar: '🐱',
                isHost: false,
                life: 8,
                maxLife: 10,
                speed: 5,
                attack: 3,
                defense: 2,
                winCount: 0,
                pendingItem: 0,
                items: [],
            };
        });

        it('should remove BOOTS effect (-2 speed, +1 attack)', () => {
            itemService.removeAttributeEffects(player, ObjectsTypes.BOOTS);

            expect(player.speed).to.equal(3); // 5 - 2
            expect(player.attack).to.equal(4); // 3 - (-1)
        });

        it('should not decrease life below 0', () => {
            player.life = 1;
            const lifeItem = 999 as ObjectsTypes;
            ITEM_EFFECTS[lifeItem] = { life: 5 };

            itemService.removeAttributeEffects(player, lifeItem);
            expect(player.life).to.equal(0); // 1 - 5 → max(0, -4)
        });

        it('should do nothing if item has no effect', () => {
            const original = { ...player };
            itemService.removeAttributeEffects(player, ObjectsTypes.POTION);
            expect(player).to.deep.equal(original);
        });
    });
});

describe('ItemService - randomizeItem()', () => {
    let itemService: ItemService;

    beforeEach(() => {
        const dummyPathfinding = {} as PathfindingService;
        itemService = new ItemService(dummyPathfinding);
    });

    it('should replace RANDOM tiles with a random object type', () => {
        const gameState: GameState = {
            board: [[ObjectsTypes.RANDOM * TILE_DELIMITER + TileTypes.Grass], [0, 0]],
        } as any;

        itemService.randomizeItem(gameState);

        const newTile = gameState.board[0][0];
        const objectValue = Math.floor(newTile / TILE_DELIMITER);
        const tileType = newTile % TILE_DELIMITER;

        expect([ObjectsTypes.BOOTS, ObjectsTypes.SWORD, ObjectsTypes.POTION, ObjectsTypes.WAND, ObjectsTypes.JUICE, ObjectsTypes.CRYSTAL]).to.include(
            objectValue,
        );
        expect(tileType).to.equal(TileTypes.Grass);
    });

    it('should not modify non-RANDOM tiles', () => {
        const gameState: GameState = {
            board: [[ObjectsTypes.SPAWN * TILE_DELIMITER + TileTypes.Grass], [ObjectsTypes.BOOTS * TILE_DELIMITER + TileTypes.Wall]],
        } as any;

        itemService.randomizeItem(gameState);

        expect(gameState.board[0][0]).to.equal(ObjectsTypes.SPAWN * TILE_DELIMITER + TileTypes.Grass);
        expect(gameState.board[1][0]).to.equal(ObjectsTypes.BOOTS * TILE_DELIMITER + TileTypes.Wall);
    });

    it('should handle empty board without errors', () => {
        const gameState: GameState = { board: [] } as any;

        expect(() => itemService.randomizeItem(gameState)).to.not.throw();
        expect(gameState.board).to.deep.equal([]);
    });

    it('should exclude already present object types from randomization', () => {
        const gameState: GameState = {
            board: [[ObjectsTypes.BOOTS * TILE_DELIMITER + TileTypes.Grass], [ObjectsTypes.RANDOM * TILE_DELIMITER + TileTypes.Grass]],
        } as any;

        itemService.randomizeItem(gameState);

        const newTile = gameState.board[1][0];
        const objectValue = Math.floor(newTile / TILE_DELIMITER);

        expect(objectValue).to.not.equal(ObjectsTypes.BOOTS);
        expect([ObjectsTypes.SWORD, ObjectsTypes.POTION, ObjectsTypes.WAND, ObjectsTypes.JUICE, ObjectsTypes.CRYSTAL]).to.include(objectValue);
    });

    it('should preserve tile type when replacing RANDOM', () => {
        const gameState: GameState = {
            board: [[ObjectsTypes.RANDOM * TILE_DELIMITER + TileTypes.Wall]],
        } as any;

        itemService.randomizeItem(gameState);

        const newTile = gameState.board[0][0];
        const tileType = newTile % TILE_DELIMITER;

        expect(tileType).to.equal(TileTypes.Wall);
    });

    it('should throw an error if randomization fails for a tile', () => {
        const gameState = {
            board: [[ObjectsTypes.RANDOM * TILE_DELIMITER]],
        };

        const originalRandom = Math.random;
        Math.random = () => {
            throw new Error('Random error');
        };

        try {
            expect(() => itemService.randomizeItem(gameState as any)).to.throw('Failed to randomize tile at (0, 0): Error: Random error');
        } finally {
            Math.random = originalRandom;
        }
    });
});
