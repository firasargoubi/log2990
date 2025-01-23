import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TileComponent } from '@app/components/tile/tile.component';
import { Coordinates } from '@app/interfaces/coordinates';
import { Tile } from '@app/interfaces/tile';
import { MouseService } from '@app/services/mouse.service';
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
    board: Tile[] = [];
    selectedTiles: Coordinates[] = [];
    mouseService = inject(MouseService);
    tileService = inject(TileService);

    get tiles(): Tile[] {
        return this.board;
    }

    ngOnInit(): void {
        //  TODO : Ajouter appel au serveur avec service
        this.initializeBoard();
    }

    initializeBoard(): void {
        this.board = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.board.push({ type: -1, x: i, y: j, id: `${i}-${j}` });
            }
        }
    }

    loadBoard(board: Tile[]): void {
        this.board = board;
    }

    onMouseUpBoard(): void {
        this.mouseService.onMouseUp();
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
            this.tileService.currentTool = -1;
        }
        this.modifyTile(tile);
    }

    modifyTile(coordinate: Coordinates): void {
        for (const tile of this.board) {
            if (coordinate.x === tile.x && coordinate.y === tile.y) {
                tile.type = this.tileService.currentTool;
            }
        }
    }

    onRightClickBoard(event: MouseEvent): void {
        event.preventDefault();
    }

    onClickTileTool(type: number) {
        this.tileService.copyTileTool(type);
    }
}
