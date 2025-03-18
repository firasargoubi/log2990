/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { Game } from '@common/game.interface';
import { Tile } from '@common/tile';
import { MapSize, OBJECT_MULTIPLIER } from '@app/Consts/app.constants';
import { Coordinates } from '@app/interfaces/coordinates';
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

    get board(): Tile[][] {
        return this.boardSubject.value;
    }
    get selectedTiles(): Coordinates[] {
        return this.selectedTilesSubject.value;
    }
    get objectHeld(): boolean {
        return this.objectsHeldSubject.value;
    }

    set board(value: Tile[][]) {
        this.boardSubject.next(value);
    }

    set objectHeld(value: boolean) {
        this.objectsHeldSubject.next(value);
    }

    set selectedTiles(value: Coordinates[]) {
        this.selectedTilesSubject.next(value);
    }

    initializeBoard(game: Game, mapSize: number): void {
        const board: Tile[][] = [];

        if (game.id && game.board && game.board.length > 0) {
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

    loadBoard(board: Tile[][]): void {
        this.board = board;
    }

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

    deleteObject(tile: Tile): void {
        tile.object = 0;
        this.notifyBoardChange();
    }

    notifyBoardChange(): void {
        this.boardSubject.next([...this.board]);
    }

    updateTile(x: number, y: number, updates: Partial<Tile>): void {
        const newBoard = [...this.board];
        const tile = newBoard[x][y];

        newBoard[x][y] = {
            ...tile,
            ...updates,
        };

        this.board = newBoard;
    }

    getTile(x: number, y: number): Tile | undefined {
        if (x >= 0 && y >= 0 && x < this.board.length && y < this.board[0].length) {
            return this.board[x][y];
        }
        return undefined;
    }
}
