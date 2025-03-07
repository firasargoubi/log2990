import { Injectable } from '@angular/core';
import { Game } from '@common/game.interface';
import { Tile } from '@app/interfaces/tile';
import { MapSize } from '@app/interfaces/map-size';
import { Coordinates } from '@app/interfaces/coordinates';
import { OBJECT_MULTIPLIER } from '@app/Consts/app.constants';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BoardService {
    private boardSubject = new BehaviorSubject<Tile[][]>([]);
    private objectsHeldSubject = new BehaviorSubject<boolean>(false);
    private selectedTilesSubject = new BehaviorSubject<Coordinates[]>([]);

    board$ = this.boardSubject.asObservable();
    objectHeld$ = this.objectsHeldSubject.asObservable();
    selectedTiles$ = this.selectedTilesSubject.asObservable();

    /**
     * Get the current board
     */
    get board(): Tile[][] {
        return this.boardSubject.value;
    }

    /**
     * Set the board and notify subscribers
     */
    set board(value: Tile[][]) {
        this.boardSubject.next(value);
    }

    /**
     * Get current object held state
     */
    get objectHeld(): boolean {
        return this.objectsHeldSubject.value;
    }

    /**
     * Set object held state and notify subscribers
     */
    set objectHeld(value: boolean) {
        this.objectsHeldSubject.next(value);
    }

    /**
     * Get selected tiles
     */
    get selectedTiles(): Coordinates[] {
        return this.selectedTilesSubject.value;
    }

    /**
     * Set selected tiles and notify subscribers
     */
    set selectedTiles(value: Coordinates[]) {
        this.selectedTilesSubject.next(value);
    }

    /**
     * Initialize the board based on game data or create an empty board
     * @param game The game data to initialize from
     * @param mapSize The size of the map
     */
    initializeBoard(game: Game, mapSize: number): void {
        const board: Tile[][] = [];

        if (game.id && game.board && game.board.length > 0) {
            // Initialize from existing game
            for (let i = 0; i < mapSize; i++) {
                const row: Tile[] = [];
                for (let j = 0; j < mapSize; j++) {
                    const tileType = game.board[i][j] % OBJECT_MULTIPLIER;
                    const objectType = Math.floor(game.board[i][j] / OBJECT_MULTIPLIER);
                    row.push({ type: tileType, object: objectType, x: i, y: j, id: `${i}-${j}` });
                }
                board.push(row);
            }
        } else {
            // Initialize empty board
            for (let i = 0; i < mapSize; i++) {
                const row: Tile[] = [];
                for (let j = 0; j < mapSize; j++) {
                    row.push({ type: 0, object: 0, x: i, y: j, id: `${i}-${j}` });
                }
                board.push(row);
            }
        }

        this.board = board;
    }

    /**
     * Load a pre-existing board
     * @param board The board to load
     */
    loadBoard(board: Tile[][]): void {
        this.board = board;
    }

    /**
     * Get the appropriate map size for the given string size
     * @param size The size string (small, medium, large)
     * @returns The numeric map size
     */
    getMapSize(size: string): number {
        switch (size) {
            case 'small':
                return MapSize.SMALL;
            case 'medium':
                return MapSize.MEDIUM;
            case 'large':
                return MapSize.LARGE;
            default:
                return MapSize.SMALL;
        }
    }

    /**
     * Delete an object from a tile
     * @param tile The tile to remove the object from
     */
    deleteObject(tile: Tile): void {
        tile.object = 0;
        this.notifyBoardChange();
    }

    /**
     * Notify subscribers that the board has changed
     */
    notifyBoardChange(): void {
        this.boardSubject.next([...this.board]);
    }

    /**
     * Update a specific tile
     * @param x The x coordinate of the tile
     * @param y The y coordinate of the tile
     * @param updates Updates to apply to the tile
     */
    updateTile(x: number, y: number, updates: Partial<Tile>): void {
        const newBoard = [...this.board];
        const tile = newBoard[x][y];

        newBoard[x][y] = {
            ...tile,
            ...updates,
        };

        this.board = newBoard;
    }

    /**
     * Get a specific tile
     * @param x The x coordinate of the tile
     * @param y The y coordinate of the tile
     * @returns The tile at the specified coordinates
     */
    getTile(x: number, y: number): Tile | undefined {
        if (x >= 0 && y >= 0 && x < this.board.length && y < this.board[0].length) {
            return this.board[x][y];
        }
        return undefined;
    }
}
