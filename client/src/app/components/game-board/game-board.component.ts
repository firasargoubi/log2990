import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import { Coordinates } from '@common/coordinates';
import { TileTypes } from '@common/game.interface';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { GAME_IMAGES, OBJECT_MULTIPLIER } from '@app/Consts/app.constants';

@Component({
    selector: 'app-game-board',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './game-board.component.html',
    styleUrl: './game-board.component.scss',
})
export class GameBoardComponent implements OnInit, OnChanges {
    @Input() gameState!: GameState;
    @Input() currentPlayerId: string = '';
    @Output() moveRequest = new EventEmitter<Coordinates>();

    tiles: Tile[][] = [];
    players: Map<string, PlayerDisplay> = new Map();
    availableMoves: Coordinates[] = [];

    // Cache for player display info
    playerDisplays: Map<string, PlayerDisplay> = new Map();

    ngOnInit() {
        if (this.gameState) {
            this.initializeBoard();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['gameState'] && this.gameState) {
            this.initializeBoard();
            this.updatePlayers();
            this.highlightAvailableMoves();
        }
    }

    private initializeBoard() {
        const mapSize = this.getMapSize(this.gameState);
        this.tiles = [];

        for (let i = 0; i < mapSize; i++) {
            const row: Tile[] = [];
            for (let j = 0; j < mapSize; j++) {
                const value = this.gameState.board[i][j];
                const tileType = value % OBJECT_MULTIPLIER;
                const objectType = Math.floor(value / OBJECT_MULTIPLIER);

                row.push({
                    type: tileType,
                    object: objectType,
                    x: i,
                    y: j,
                    id: `${i}-${j}`,
                });
            }
            this.tiles.push(row);
        }
    }

    private updatePlayers() {
        this.playerDisplays.clear();

        for (const player of this.gameState.players) {
            const position = this.gameState.playerPositions.get(player.id);

            if (position) {
                this.playerDisplays.set(player.id, {
                    player,
                    position,
                    isCurrentPlayer: player.id === this.gameState.currentPlayer,
                    isLocalPlayer: player.id === this.currentPlayerId,
                });
            }
        }
    }

    private highlightAvailableMoves() {
        this.availableMoves = this.gameState.availableMoves || [];
    }

    // Helper methods for display
    getTileImage(tile: Tile): string {
        switch (tile.type) {
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

    getObjectImage(tile: Tile): string | null {
        if (!tile.object) return null;

        switch (tile.object) {
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
            default:
                return GAME_IMAGES.undefined;
        }
    }

    isAvailableMove(x: number, y: number): boolean {
        return this.availableMoves.some((move) => move.x === x && move.y === y);
    }

    getPlayerAtPosition(x: number, y: number): PlayerDisplay | null {
        for (const [_, playerDisplay] of this.playerDisplays) {
            if (playerDisplay.position.x === x && playerDisplay.position.y === y) {
                return playerDisplay;
            }
        }
        return null;
    }

    onTileClick(x: number, y: number) {
        // Only handle clicks if this is the current player's turn
        if (this.currentPlayerId === this.gameState.currentPlayer && this.isAvailableMove(x, y)) {
            // Emit move event to parent component
            this.moveRequest.emit({ x, y });
        }
    }

    private getMapSize(gameState: GameState): number {
        return gameState.board.length;
    }
}

interface PlayerDisplay {
    player: Player;
    position: Coordinates;
    isCurrentPlayer: boolean;
    isLocalPlayer: boolean;
}
