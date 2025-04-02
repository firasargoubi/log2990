/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ITEM_EFFECTS, ObjectsTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { ItemService } from './item.service';

describe('ItemService', () => {
    let itemService: ItemService;
    let player: Player;

    beforeEach(() => {
        itemService = new ItemService();

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
