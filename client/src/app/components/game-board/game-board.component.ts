import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameTileComponent } from '@app/components/game-tile/game-tile.component';
import { OBJECT_MULTIPLIER } from '@app/consts/app-constants';
import { LobbyService } from '@app/services/lobby.service';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';

@Component({
    selector: 'app-game-board',
    standalone: true,
    imports: [CommonModule, GameTileComponent],
    templateUrl: './game-board.component.html',
    styleUrls: ['./game-board.component.scss'],
})
export class GameBoardComponent implements OnInit, OnChanges {
    @Input() gameState!: GameState;
    @Input() currentPlayerId: string = '';
    @Input() lobbyId: string = '';
    @Input() action: boolean = false;
    @Input() inCombat: boolean = false;
    @Output() tileClicked = new EventEmitter<Coordinates[]>();
    @Output() actionClicked = new EventEmitter<Tile>();
    @Output() infoSent = new EventEmitter<string>();

    tiles: Tile[][] = [];
    availableMoves: Coordinates[] = [];
    private highlightedPath: Coordinates[] = [];

    constructor(private lobbyService: LobbyService) {}

    ngOnInit() {
        if (this.gameState) {
            this.initializeBoard();
            this.clearPathHighlights();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['gameState'] && this.gameState) {
            this.initializeBoard();
            this.clearPathHighlights();
        }
    }

    isAvailableMove(x: number, y: number): boolean {
        return this.gameState.availableMoves.some((move) => move.x === x && move.y === y);
    }

    isOnHighlightedPath(x: number, y: number): boolean {
        return this.highlightedPath.some((coord) => coord.x === x && coord.y === y);
    }

    getPlayerAtPosition(x: number, y: number): { player: Player; isCurrentPlayer: boolean; isLocalPlayer: boolean } | null {
        if (!this.gameState || !this.gameState.playerPositions) return null;

        for (const [playerIndex, position] of this.gameState.playerPositions.entries()) {
            if (position.x === x && position.y === y) {
                const player = this.gameState.players[playerIndex];
                if (player) {
                    return {
                        player,
                        isCurrentPlayer: player.id === this.gameState.currentPlayer,
                        isLocalPlayer: player.id === this.currentPlayerId,
                    };
                }
            }
        }
        return null;
    }
    onTileClick(tile: Tile) {
        if (this.gameState.animation) {
            return;
        }
        if (this.inCombat) {
            return;
        }
        if (this.action) {
            this.actionClicked.emit(tile);
            return;
        }
        if (this.isMyTurn() && this.isAvailableMove(tile.x, tile.y)) {
            this.tileClicked.emit(this.highlightedPath);
        }
    }

    onTileRightClick(event: MouseEvent, tile: Tile) {
        event.preventDefault();
        if (this.gameState.debug && this.gameState.currentPlayer === this.currentPlayerId) {
            this.lobbyService.requestTeleport(this.lobbyId, { x: tile.x, y: tile.y });
        } else {
            this.infoSent.emit(this.generateTileInfo(tile));
        }
    }

    onTileHover(tile: Tile) {
        if (this.gameState.animation) {
            return;
        }
        if (this.inCombat) {
            return;
        }
        if (this.action) {
            this.highlightedPath = [];
            return;
        }
        if (this.isMyTurn() && this.isAvailableMove(tile.x, tile.y)) {
            this.highlightedPath = this.showPathToTile({ x: tile.x, y: tile.y });
        }
    }

    onTileLeave() {
        this.highlightedPath = [];
    }

    private generateTileInfo(tile: Tile): string {
        let details = '';
        const player = this.getPlayerAtPosition(tile.x, tile.y);
        if (player) {
            details += `Player: ${player.player.name}\n`;
        }
        const item = tile.object;
        if (item) {
            details += `Item: ${item}\n`;
        }
        details += `Tile Type: ${tile.type}\n`;
        return details;
    }

    private showPathToTile(destination: Coordinates): Coordinates[] {
        const playerIndex = this.gameState.players.findIndex((p) => p.id === this.currentPlayerId);
        if (playerIndex === -1) return [];

        const tileIndex = this.gameState.availableMoves.findIndex((move) => move.x === destination.x && move.y === destination.y);
        if (tileIndex === -1) return [];

        return this.gameState.shortestMoves[tileIndex];
    }

    private isMyTurn(): boolean {
        return this.gameState && this.currentPlayerId === this.gameState.currentPlayer;
    }

    private getMapSize(gameState: GameState): number {
        return gameState.board.length;
    }

    private clearPathHighlights() {
        this.highlightedPath = [];
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
}
