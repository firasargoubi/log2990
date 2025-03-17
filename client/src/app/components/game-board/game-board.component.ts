import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameTileComponent } from '@app/components/game-tile/game-tile.component';
import { OBJECT_MULTIPLIER } from '@app/Consts/app.constants';
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
    @Output() tileClicked = new EventEmitter<Coordinates[]>();
    @Output() actionClicked = new EventEmitter<Tile>();

    tiles: Tile[][] = [];
    availableMoves: Coordinates[] = [];
    highlightedPath: Coordinates[] = [];

    private shortestMovesMap: Map<string, Coordinates> = new Map();

    constructor(private lobbyService: LobbyService) {}

    ngOnInit() {
        if (this.gameState) {
            this.initializeBoard();
            this.updateAvailableMoves();
        }

        this.lobbyService.onTurnStarted().subscribe((data) => {
            if (data.gameState) {
                this.availableMoves = data.gameState.availableMoves || [];

                this.clearPathHighlights();
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['gameState'] && this.gameState) {
            this.initializeBoard();
            this.updateAvailableMoves();
            this.clearPathHighlights();
        }
    }

    isAvailableMove(x: number, y: number): boolean {
        return this.availableMoves.some((move) => move.x === x && move.y === y);
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
        if (this.action) {
            this.actionClicked.emit(tile);
            return;
        }
        if (this.isMyTurn() && this.isAvailableMove(tile.x, tile.y)) {
            this.tileClicked.emit(this.highlightedPath);
        }
    }

    onTileHover(tile: Tile) {
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

    private showPathToTile(destination: Coordinates): Coordinates[] {
        if (!this.gameState) {
            return [];
        }

        const playerIndex = this.gameState.players.findIndex((p) => p.id === this.gameState.currentPlayer);
        if (playerIndex === -1) {
            return [];
        }

        const playerPosition = this.gameState.playerPositions[playerIndex];
        if (!playerPosition) {
            return [];
        }
        const isValidDestination = this.gameState.availableMoves.some((move) => move.x === destination.x && move.y === destination.y);

        if (!isValidDestination) {
            return [];
        }
        const path: Coordinates[] = [destination];

        this.transformShortestMovesToMap(this.gameState);

        let current = destination;

        while (current) {
            if (this.isAdjacent(current, playerPosition)) {
                path.unshift(playerPosition);
                break;
            }

            const nextStepKey = `${current.x},${current.y}`;
            const nextStep = this.shortestMovesMap.get(nextStepKey);

            if (!nextStep) {
                break;
            }

            path.unshift(nextStep);
            current = nextStep;
        }

        return path;
    }

    private isAdjacent(pos1: Coordinates, pos2: Coordinates): boolean {
        const xDiff = Math.abs(pos1.x - pos2.x);
        const yDiff = Math.abs(pos1.y - pos2.y);

        return (xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1);
    }

    private transformShortestMovesToMap(gameState: GameState): void {
        this.shortestMovesMap = new Map<string, Coordinates>();

        if (!gameState || !gameState.shortestMoves) {
            return;
        }
        gameState.shortestMoves.forEach((pair) => {
            if (pair && pair.length >= 2) {
                const destination = pair[0];
                const nextStep = pair[1];
                const key = `${destination.x},${destination.y}`;
                this.shortestMovesMap.set(key, nextStep);
            }
        });
        return;
    }

    private isMyTurn(): boolean {
        return this.gameState && this.currentPlayerId === this.gameState.currentPlayer;
    }

    private getMapSize(gameState: GameState): number {
        return gameState.board.length;
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
