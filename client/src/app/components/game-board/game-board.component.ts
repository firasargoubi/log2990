import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { OBJECT_MULTIPLIER } from '@app/Consts/app.constants';
import { GameTileComponent } from '../game-tile/game-tile.component';
import { LobbyService } from '@app/services/lobby.service';

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
    @Output() moveRequest = new EventEmitter<Coordinates>();

    tiles: Tile[][] = [];
    availableMoves: Coordinates[] = [];
    highlightedPath: Coordinates[] = [];
    private pathCache = new Map<string, Coordinates[]>();

    constructor(private lobbyService: LobbyService) {}

    ngOnInit() {
        if (this.gameState) {
            this.initializeBoard();
            this.updateAvailableMoves();
        }

        this.lobbyService.onPathCalculated().subscribe((data) => {
            if (data.valid && data.path) {
                const cacheKey = `${data.destination.x},${data.destination.y}`;
                this.pathCache.set(cacheKey, data.path);
                this.highlightedPath = data.path;
            }
        });

        this.lobbyService.onTurnStarted().subscribe((data) => {
            if (data.gameState) {
                this.availableMoves = data.availableMoves || [];

                this.clearPathHighlights();
            }
        });

        this.lobbyService.onMovementProcessed().subscribe(() => {
            this.clearPathHighlights();
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['gameState'] && this.gameState) {
            this.initializeBoard();
            this.updateAvailableMoves();
            this.clearPathHighlights();
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

    private updateAvailableMoves() {
        if (this.gameState && this.gameState.availableMoves) {
            this.availableMoves = this.gameState.availableMoves || [];
        } else {
            this.availableMoves = [];
        }
    }

    private clearPathHighlights() {
        this.highlightedPath = [];
        this.pathCache.clear();
    }

    isAvailableMove(x: number, y: number): boolean {
        return this.availableMoves.some((move) => move.x === x && move.y === y);
    }

    isOnHighlightedPath(x: number, y: number): boolean {
        return this.highlightedPath.some((coord) => coord.x === x && coord.y === y);
    }

    getPlayerAtPosition(x: number, y: number): { player: Player; isCurrentPlayer: boolean; isLocalPlayer: boolean } | null {
        if (!this.gameState || !this.gameState.playerPositions) return null;

        for (const [playerId, position] of this.gameState.playerPositions.entries()) {
            if (position.x === x && position.y === y) {
                const player = this.gameState.players.find((p) => p.id === playerId);
                if (player) {
                    return {
                        player,
                        isCurrentPlayer: playerId === this.gameState.currentPlayer,
                        isLocalPlayer: playerId === this.currentPlayerId,
                    };
                }
            }
        }
        return null;
    }

    onTileClick(tile: Tile) {
        if (this.isMyTurn() && this.isAvailableMove(tile.x, tile.y)) {
            this.moveRequest.emit({ x: tile.x, y: tile.y });
        }
    }

    onTileHover(tile: Tile) {
        if (this.isMyTurn() && this.isAvailableMove(tile.x, tile.y)) {
            this.showPathToTile(tile);
        }
    }

    onTileLeave() {
        this.highlightedPath = [];
    }

    private showPathToTile(tile: Tile): void {
        const cacheKey = `${tile.x},${tile.y}`;

        if (this.pathCache.has(cacheKey)) {
            this.highlightedPath = this.pathCache.get(cacheKey)!;
            return;
        }

        this.lobbyService.requestPath(this.lobbyId, { x: tile.x, y: tile.y });
    }

    private isMyTurn(): boolean {
        return this.gameState && this.currentPlayerId === this.gameState.currentPlayer;
    }

    private getMapSize(gameState: GameState): number {
        return gameState.board.length;
    }
}
