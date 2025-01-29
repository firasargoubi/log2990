import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Tile } from '@app/interfaces/tile';
import {TileTypes} from '@app/interfaces/tileTypes';


export interface SaveMessage {
    doors: boolean;
    accessible: boolean;
    minTerrain: boolean;
    allSpawnPoints: boolean;
    allItemsPlaced: boolean;
    ctfPlaced: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class SaveService {
    board: Tile[][] = [];
    private saveActive = new Subject<boolean>();
    isActive$ = this.saveActive.asObservable();

    saveBoard(board: Tile[][]): boolean {
        return this.verifyDoors(board);
    }

    verifyDoors(board: Tile[][]): boolean {
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j].type >= TileTypes.DoorClosed) {
                    if (i === 0 || i === board.length - 1 || j === 0 || j === board.length - 1) {
                        return false;
                    } else if (!this.verifyConnectingDoors(board, i, j)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    verifyConnectingDoors(board: Tile[][], i: number, j: number): boolean {
        return (
            (board[i - 1][j].type < TileTypes.Wall &&
                board[i + 1][j].type < TileTypes.Wall &&
                board[i][j - 1].type === TileTypes.Wall &&
                board[i][j + 1].type === TileTypes.Wall) ||
            (board[i - 1][j].type === TileTypes.Wall &&
                board[i + 1][j].type === TileTypes.Wall &&
                board[i][j - 1].type < TileTypes.Wall &&
                board[i][j + 1].type < TileTypes.Wall)
        );
    }

    setActive(value: boolean) {
        this.saveActive.next(value);
    }
}
