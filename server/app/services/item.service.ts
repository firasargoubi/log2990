import { ITEM_EFFECTS, ObjectsTypes } from '@common/game.interface';
import { Player } from '@common/player';

export class ItemService {
    applyEffect(player: Player, item: ObjectsTypes): void {
        const effect = ITEM_EFFECTS[item];
        if (!effect) return;

        if (effect.attack !== undefined) player.attack = Math.max(0, player.attack + effect.attack);
        if (effect.defense !== undefined) player.defense = Math.max(0, player.defense + effect.defense);
        if (effect.speed !== undefined) player.speed = Math.max(0, player.speed + effect.speed);
        if (effect.life !== undefined) player.life = Math.min(player.maxLife, player.life + effect.life);
    }
}
