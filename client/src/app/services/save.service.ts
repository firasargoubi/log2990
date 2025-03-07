import { inject, Injectable } from '@angular/core';
import { OBJECT_COUNT, OBJECT_MULTIPLIER, ObjectsTypes } from '@app/Consts/app.constants';
import { Game } from '@common/game.interface';
import { SaveMessage } from '@app/interfaces/save-message';
import { Tile } from '@app/interfaces/tile';
import { TileTypes } from '@app/interfaces/tile-types';
import { Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GameService } from './game.service';

const WANTED_TILE_PERCENTAGE = 0.5;
const SMALL_MAP = 10;
const MEDIUM_MAP = 15;
const LARGE_MAP = 20;

@Injectable({
    providedIn: 'root',
})
export class SaveService {
    private board: Tile[][] = [];
    private countSeen: number = 0;

    currentStatus: Partial<SaveMessage>;
    private saveActive = new Subject<boolean>();
    private resetActive = new Subject<boolean>();
    private games: Game[] = [];

    isSave$ = this.saveActive.asObservable();
    isReset$ = this.resetActive.asObservable();
    private gameService = inject(GameService);

    /**
     * Get the total number of cells in the board
     */
    private get boardSize(): number {
        return this.board.length * this.board[0].length;
    }

    /**
     * Get the number of terrain tiles on the board
     */
    private get boardTerrainTiles(): number {
        let count = 0;
        for (const row of this.board) {
            for (const tile of row) {
                if (tile.type < TileTypes.Wall) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * Convert the board to a 2D array of integers
     */
    get intBoard(): number[][] {
        const board: number[][] = [];
        for (const row of this.board) {
            const newRow: number[] = [];
            for (const tile of row) {
                const objectValue = tile.object ? tile.object * OBJECT_MULTIPLIER : 0;
                newRow.push(tile.type + objectValue);
            }
            board.push(newRow);
        }
        return board;
    }

    /**
     * Update the list of games
     */
    updateGames(games: Game[]): void {
        this.games = games;
    }

    /**
     * Get a list of game names, excluding the one with the given ID
     */
    getGameNames(id: string): string[] {
        return this.games.filter((game) => game.id !== id).map((game) => game.name);
    }

    /**
     * Verify the board for valid configuration
     */
    verifyBoard(board: Tile[][]): void {
        this.board = board;
        this.currentStatus = {
            doors: this.verifyDoors(),
            minTerrain: this.verifyTilePercentage(),
            accessible: this.verifyAccessible(),
            allSpawnPoints: this.verifySpawnPoints(this.board.length),
        };
    }

    /**
     * Save a game to the server
     */
    saveGame(game: Game): void {
        const gameData: Game = {
            ...game,
            board: this.intBoard,
            lastModified: new Date(),
            isVisible: false,
        };

        if (!game.id) {
            this.gameService.createGame(gameData).subscribe();
        } else {
            this.gameService
                .updateGame(game.id, gameData)
                .pipe(
                    catchError(() => {
                        return this.gameService.createGame(gameData);
                    }),
                )
                .subscribe();
        }
    }

    /**
     * Verify that the board has the correct number of spawn points
     */
    verifySpawnPoints(size: number): boolean {
        let count = 0;
        for (const row of this.board) {
            for (const tile of row) {
                if (tile.object === ObjectsTypes.SPAWN) count++;
            }
        }
        switch (size) {
            case SMALL_MAP:
                return count === OBJECT_COUNT.small;
            case MEDIUM_MAP:
                return count === OBJECT_COUNT.medium;
            case LARGE_MAP:
                return count === OBJECT_COUNT.large;
            default:
                return count === OBJECT_COUNT.small;
        }
    }

    /**
     * Verify that doors are correctly placed
     */
    verifyDoors(): boolean {
        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {
                if (this.board[i][j].type === TileTypes.DoorClosed || this.board[i][j].type === TileTypes.DoorOpen) {
                    if (i === 0 || i === this.board.length - 1 || j === 0 || j === this.board.length - 1) {
                        return false;
                    } else if (!this.verifyConnectingDoors(i, j)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Verify that doors connect to walls correctly
     */
    verifyConnectingDoors(i: number, j: number): boolean {
        // Check for horizontal door (walls on sides, open spaces above and below)
        const isHorizontalDoor = this.isTileAccessible(i - 1, j) && this.isTileAccessible(i + 1, j) && this.isWall(i, j - 1) && this.isWall(i, j + 1);

        // Check for vertical door (walls above and below, open spaces on sides)
        const isVerticalDoor = this.isWall(i - 1, j) && this.isWall(i + 1, j) && this.isTileAccessible(i, j - 1) && this.isTileAccessible(i, j + 1);

        return isHorizontalDoor || isVerticalDoor;
    }

    /**
     * Verify that enough tiles are terrain
     */
    verifyTilePercentage(): boolean {
        return this.boardTerrainTiles / this.boardSize >= WANTED_TILE_PERCENTAGE;
    }

    /**
     * Verify that all tiles are accessible
     */
    verifyAccessible(): boolean {
        let i = 0;
        let j = 0;
        this.countSeen = 0;
        while (this.board[i][j].type === TileTypes.Wall) {
            j++;
            if (j === this.board.length) {
                j = 0;
                i++;
            }
            if (i === this.board.length) {
                return false;
            }
        }
        this.board[i][j].seen = true;
        this.countSeen++;
        this.verifyAccessibleDFS(i, j);
        this.resetSeen();
        return this.countSeen === this.boardTerrainTiles;
    }

    /**
     * Reset the seen status for all tiles
     */
    private resetSeen(): void {
        for (const row of this.board) {
            for (const tile of row) {
                tile.seen = false;
            }
        }
    }

    private isWall(i: number, j: number): boolean {
        return this.isInBounds(i, j) && this.board[i][j].type === TileTypes.Wall;
    }

    /**
     * Check if a tile is accessible (not a wall and not a door)
     */
    private isTileAccessible(i: number, j: number): boolean {
        return this.isInBounds(i, j) && this.board[i][j].type < TileTypes.DoorClosed;
    }

    /**
     * Check if coordinates are within board bounds
     */
    private isInBounds(i: number, j: number): boolean {
        return i >= 0 && i < this.board.length && j >= 0 && j < this.board[0].length;
    }

    /**
     * Check if a position is valid and not a wall
     */
    private isValid(i: number, j: number): boolean {
        return this.isInBounds(i, j) && this.board[i][j].type !== TileTypes.Wall;
    }

    /**
     * Depth-first search to verify all tiles are accessible
     */
    verifyAccessibleDFS(i: number, j: number): void {
        if (this.isValid(i - 1, j) && !this.board[i - 1][j].seen) {
            this.board[i - 1][j].seen = true;
            this.countSeen++;
            this.verifyAccessibleDFS(i - 1, j);
        }
        if (this.isValid(i + 1, j) && !this.board[i + 1][j].seen) {
            this.board[i + 1][j].seen = true;
            this.countSeen++;
            this.verifyAccessibleDFS(i + 1, j);
        }
        if (this.isValid(i, j - 1) && !this.board[i][j - 1].seen) {
            this.board[i][j - 1].seen = true;
            this.countSeen++;
            this.verifyAccessibleDFS(i, j - 1);
        }
        if (this.isValid(i, j + 1) && !this.board[i][j + 1].seen) {
            this.board[i][j + 1].seen = true;
            this.countSeen++;
            this.verifyAccessibleDFS(i, j + 1);
        }
    }
    /**
     * Notify components that the board should be verified
     */
    alertBoardForVerification(value: boolean) {
        this.saveActive.next(value);
    }

    /**
     * Notify components that the board should be reset
     */
    alertBoardForReset(value: boolean) {
        this.resetActive.next(value);
    }
}
