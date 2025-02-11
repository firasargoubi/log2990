import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TileComponent } from '@app/components/tile/tile.component';
import { Coordinates } from '@app/interfaces/coordinates';
import { Game } from '@app/interfaces/game.model';
import { MapSize } from '@app/interfaces/mapsize';
import { Tile } from '@app/interfaces/tile';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
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
    @Input() game: Game = {
        id: '',
        name: '',
        mapSize: 'small',
        mode: 'normal',
        previewImage: '',
        description: '',
        lastModified: new Date(),
        isVisible: true,
        board: [],
        objects: [],
    };
    board: Tile[][] = [];
    selectedTiles: Coordinates[] = [];
    mouseService = inject(MouseService);
    tileService = inject(TileService);
    saveService = inject(SaveService);
    errorService = inject(ErrorService);
    gameService = inject(GameService);

    constructor() {
        this.saveService.isSave$.pipe(takeUntilDestroyed()).subscribe((isActive: boolean) => {
            if (isActive) {
                this.saveService.verifyBoard(this.board);
            }
        });
        this.saveService.isReset$.pipe(takeUntilDestroyed()).subscribe((isActive: boolean) => {
            if (isActive) {
                this.initializeBoard();
            }
        });
        this.tileService.currentTool = 0;
    }

    get mapSize(): number {
        switch (this.game.mapSize) {
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

    get tiles(): Tile[][] {
        return this.board;
    }

    ngOnInit() {
        this.initializeBoard();
    }

    initializeBoard(): void {
        this.board = [];
        if (this.game.id) {
            for (let i = 0; i < this.mapSize; i++) {
                const row: Tile[] = [];
                for (let j = 0; j < this.mapSize; j++) {
                    const tileType = this.game.board[i][j] % 10;
                    const objectType = Math.floor(this.game.board[i][j] / 10);
                    row.push({ type: tileType, object: objectType, x: i, y: j, id: `${i}-${j}` });
                }
                this.board.push(row);
            }
        } else {
            for (let i = 0; i < this.mapSize; i++) {
                const row: Tile[] = [];
                for (let j = 0; j < this.mapSize; j++) {
                    row.push({ type: 0, object: 0, x: i, y: j, id: `${i}-${j}` });
                }
                this.board.push(row);
            }
        }
    }

    loadBoard(board: Tile[][]): void {
        this.board = board;
    }

    onMouseUpBoard(): void {
        this.mouseService.onMouseUp();
        if (this.tileService.toolSaved !== 0) {
            this.tileService.currentTool = this.tileService.toolSaved;
            this.tileService.toolSaved = 0;
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
            this.tileService.toolSaved = this.tileService.currentTool;
            this.tileService.currentTool = 0;
        } else if (tile.object) {
            this.tileService.toolSaved = this.tileService.currentTool;
            this.tileService.currentTool = -1;
        }
        this.modifyTile(tile);
    }

    onMouseLeaveBoard() {
        this.mouseService.onMouseLeave();
    }

    onObjectChanged(event: number, tile: Tile) {
        tile.object = event;
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
