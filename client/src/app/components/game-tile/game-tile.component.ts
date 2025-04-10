import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/consts/item-constants';
import { DEFAULT_TILE_IMAGE, TILE_IMAGES } from '@app/consts/tile-constants';
import { Player } from '@common/player';
import { Tile } from '@common/tile';

@Component({
    selector: 'app-game-tile',
    standalone: true,
    imports: [CommonModule, MatTooltipModule],
    templateUrl: './game-tile.component.html',
    styleUrls: ['./game-tile.component.scss'],
})
export class GameTileComponent {
    @Input() tile!: Tile;
    @Input() isAvailableMove: boolean = false;
    @Input() player: { player: Player; isCurrentPlayer: boolean; isLocalPlayer: boolean } | null = null;
    @Input() isPathHighlighted: boolean = false;
    @Output() tileClick = new EventEmitter<Tile>();

    getTileImage(): string {
        return this.tile ? TILE_IMAGES[this.tile.type] ?? DEFAULT_TILE_IMAGE : DEFAULT_TILE_IMAGE;
    }

    getObjectImage(): string | null {
        if (!this.tile || !this.tile.object) return null;

        return this.tile?.object != null ? ITEM_INFOS[this.tile.object]?.image ?? UNKNOWN_ITEM.image : null;
    }

    getObjectDescription() {
        return ITEM_INFOS[this.tile.object]?.description ?? UNKNOWN_ITEM.description;
    }

    onClick(): void {
        this.tileClick.emit(this.tile);
    }
}
