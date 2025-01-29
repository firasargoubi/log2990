import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TileComponent } from '@app/components/tile/tile.component';
import { Coordinates } from '@app/interfaces/coordinates';
import { Tile } from '@app/interfaces/tile';
import { MouseService } from '@app/services/mouse.service';
import { SaveService } from '@app/services/save.service';
import { TileService } from '@app/services/tile.service';

const RIGHT_CLICK = 2;
@Component({
    selector: 'app-board',
    imports: [TileComponent, CommonModule, FormsModule],
    templateUrl: './board.component.html',
    styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit {
    @Input() size: number;
    @Input() id: number = 0;
    board: Tile[][] = [];
    selectedTiles: Coordinates[] = [];
    toolSaved: number = -1;
    mouseService = inject(MouseService);
    tileService = inject(TileService);
    saveService = inject(SaveService);

    constructor() {
        this.saveService.isActive$.pipe(takeUntilDestroyed()).subscribe((isActive: boolean) => {
            if (isActive) {
                if (this.saveService.saveBoard(this.board)) {
                    //  TODO: Add success message
                } else {
                    //  TODO: Add error message
                }
            }
        });
    }

    get tiles(): Tile[][] {
        return this.board;
    }

    ngOnInit() {
        this.initializeBoard();
    }

    initializeBoard(): void {
        this.board = [];
        for (let i = 0; i < this.size; i++) {
            const row: Tile[] = [];
            for (let j = 0; j < this.size; j++) {
                row.push({ type: -1, x: i, y: j, id: `${i}-${j}` });
            }
            this.board.push(row);
        }
    }

    loadBoard(board: Tile[][]): void {
        this.board = board;
    }

    onMouseUpBoard(): void {
        this.mouseService.onMouseUp();
        if (this.toolSaved !== -1) {
            this.tileService.currentTool = this.toolSaved;
            this.toolSaved = -1;
        }
    }

    onMouseOverBoard(tile: Tile) {
        this.mouseService.onMouseMove({ x: tile.x, y: tile.y });
        if (this.mouseService.mousePressed) {
            this.modifyTile(tile);
        }
    }

    onMouseDownBoard(event: MouseEvent, tile: Tile) {
        this.mouseService.onMouseDown({ x: tile.x, y: tile.y });
        if (event.button === RIGHT_CLICK) {
            this.toolSaved = this.tileService.currentTool;
            this.tileService.currentTool = -1;
        }
        this.modifyTile(tile);
    }

    onMouseLeaveBoard() {
        this.mouseService.onMouseLeave();
    }

    modifyTile(coordinate: Coordinates): void {
        this.tileService.modifyTile(this.board[coordinate.x][coordinate.y]);
    }

    onRightClickBoard(event: MouseEvent): void {
        event.preventDefault();
    }

    onClickTileTool(type: number) {
        this.tileService.copyTileTool(type);
    }
}
