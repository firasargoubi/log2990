import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Tile } from '@app/interfaces/tile';
import { Player } from '@common/player';
import { GAME_IMAGES } from '@app/Consts/app.constants';
import { TileTypes } from '@common/game.interface';

@Component({
    selector: 'app-game-tile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-tile.component.html',
    styleUrls: ['./game-tile.component.scss'],
})
export class GameTileComponent implements OnChanges {
    @Input() tile!: Tile;
    @Input() isAvailableMove: boolean = false;
    @Input() player: { player: Player; isCurrentPlayer: boolean; isLocalPlayer: boolean } | null = null;
    @Input() isPathHighlighted: boolean = false;
    @Output() tileClick = new EventEmitter<Tile>();

    ngOnChanges(changes: SimpleChanges): void {
        // React to input changes if needed
    }

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
            case 0:
                return null;
            case 1:
                return GAME_IMAGES.boots;
            case 2:
                return GAME_IMAGES.sword;
            case 3:
                return GAME_IMAGES.potion;
            case 4:
                return GAME_IMAGES.wand;
            case 5:
                return GAME_IMAGES.crystalBall;
            case 6:
                return GAME_IMAGES.berryJuice;
            case 7:
                return GAME_IMAGES.vortex;
            case 8:
                return GAME_IMAGES.gnome;
            default:
                return GAME_IMAGES.undefined;
        }
    }

    onClick(): void {
        this.tileClick.emit(this.tile);
    }
}
