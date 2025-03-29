import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GAME_IMAGES } from '@app/Consts/app.constants';
import { ObjectsTypes, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';

@Component({
    selector: 'app-game-tile',
    standalone: true,
    imports: [CommonModule],
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
        if (!this.tile) return GAME_IMAGES.default;

        switch (this.tile.type) {
            case TileTypes.Grass:
                return GAME_IMAGES.grass;
            case TileTypes.Water:
                return GAME_IMAGES.water;
            case TileTypes.Ice:
                return GAME_IMAGES.ice;
            case TileTypes.DoorClosed:
                return GAME_IMAGES.doorClosed;
            case TileTypes.DoorOpen:
                return GAME_IMAGES.doorOpen;
            case TileTypes.Wall:
                return GAME_IMAGES.wall;
            default:
                return GAME_IMAGES.default;
        }
    }

    getObjectImage(): string | null {
        if (!this.tile || !this.tile.object) return null;

        switch (this.tile.object) {
            case ObjectsTypes.BOOTS:
                return GAME_IMAGES.boots;
            case ObjectsTypes.SWORD:
                return GAME_IMAGES.sword;
            case ObjectsTypes.POTION:
                return GAME_IMAGES.potion;
            case ObjectsTypes.WAND:
                return GAME_IMAGES.wand;
            case ObjectsTypes.CRYSTAL:
                return GAME_IMAGES.crystalBall;
            case ObjectsTypes.JUICE:
                return GAME_IMAGES.berryJuice;
            case ObjectsTypes.SPAWN:
                return GAME_IMAGES.vortex;
            case ObjectsTypes.RANDOM:
                return GAME_IMAGES.gnome;
            case ObjectsTypes.FLAG:
                return GAME_IMAGES.flag;
            default:
                return 'flop';
        }
    }

    onClick(): void {
        this.tileClick.emit(this.tile);
    }
}
