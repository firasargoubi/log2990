/* eslint-disable @typescript-eslint/no-magic-numbers */
import { GameState } from '@common/game-state';
import { ITEM_EFFECTS, ObjectsTypes } from '@common/game.interface';
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
        itemService.applyEffect(player, ObjectsTypes.BOOTS);

        expect(player.speed).to.equal(5);
        expect(player.attack).to.equal(1);
        expect(player.defense).to.equal(1);
        expect(player.life).to.equal(8);
    });

    it('should apply SWORD effect (+1 attack, -1 defense)', () => {
        itemService.applyEffect(player, ObjectsTypes.SWORD);

        expect(player.attack).to.equal(3);
        expect(player.defense).to.equal(0);
        expect(player.speed).to.equal(3);
        expect(player.life).to.equal(8);
    });

    it('should not apply anything if item has no effect', () => {
        const originalPlayer = { ...player };

        itemService.applyEffect(player, ObjectsTypes.POTION);

        expect(player).to.deep.equal(originalPlayer);
    });

    it('should not exceed maxLife when healing', () => {
        player.life = 9;
        const healingItem = 999 as ObjectsTypes;
        ITEM_EFFECTS[healingItem] = { life: 5 };

        itemService.applyEffect(player, healingItem);

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
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should drop all items from player inventory', () => {
        itemService.dropItems(0, gameState);
        expect(player.items.length).to.equal(0);
    });

    it('should modify board tiles where items are dropped', () => {
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
        pathFindingServiceStub.findClosestAvailableSpot.returns(undefined);
        const originalBoard = JSON.parse(JSON.stringify(gameState.board));

        itemService.dropItems(0, gameState);

        expect(gameState.board).to.deep.equal(originalBoard);
    });

    it('should remove only dropped items from inventory', () => {
        player.items = [ObjectsTypes.BOOTS, ObjectsTypes.POTION, ObjectsTypes.SWORD];

        itemService.dropItems(0, gameState);

        expect(player.items).to.deep.equal([ObjectsTypes.POTION]);
    });
});

describe('ItemService - applyPotionEffect & applyJuiceEffect', () => {
    let itemService: ItemService;
    let attacker: Player;
    let defender: Player;
    let sandbox: SinonSandbox;

    beforeEach(() => {
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

    it('should not reduce defender life below 0', () => {
        defender.life = 1;
        itemService.applyPotionEffect(attacker, defender);
        expect(defender.life).to.equal(0);
    });

    it('should not throw error if attacker has undefined items', () => {
        attacker.items = undefined;
        expect(() => itemService.applyPotionEffect(attacker, defender)).not.to.throw();
        expect(defender.life).to.equal(9);
    });

    it('should not throw error if attacker or defender life is exactly 3 apart', () => {
        defender.life = 8;
        expect(() => itemService.applyPotionEffect(attacker, defender)).not.to.throw();
        expect(defender.life).to.equal(8);
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
});
