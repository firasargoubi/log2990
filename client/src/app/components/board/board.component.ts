import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TileComponent } from '@app/components/tile/tile.component';
import { Coordinates } from '@app/interfaces/coordinates';
import { Game } from '@app/interfaces/game.model';
import { MapSize } from '@app/interfaces/map-size';
import { Tile } from '@app/interfaces/tile';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { MouseService } from '@app/services/mouse.service';
import { SaveService } from '@app/services/save.service';
import { TileService } from '@app/services/tile.service';
import { OBJECT_MULTIPLIER } from '@app/Consts/app.constants';

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
    @ViewChildren(TileComponent) tileComponents!: QueryList<TileComponent>;
    board: Tile[][] = [];
    selectedTiles: Coordinates[] = [];
    objectHeld: boolean = false;
    mouseService = inject(MouseService);
    tileService = inject(TileService);
    saveService = inject(SaveService);
    errorService = inject(ErrorService);
    gameService = inject(GameService);

    constructor(private cdr: ChangeDetectorRef) {
        this.saveService.isSave$.pipe(takeUntilDestroyed()).subscribe((isActive: boolean) => {
            if (isActive) {
                this.reloadTiles();
                this.saveService.verifyBoard(this.board);
            }
        });
        this.tileService.resetTool();
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
        this.cdr.detectChanges();
    }

    initializeBoard(): void {
        this.board = [];
        if (this.game.id) {
            for (let i = 0; i < this.mapSize; i++) {
                const row: Tile[] = [];
                for (let j = 0; j < this.mapSize; j++) {
                    const tileType = this.game.board[i][j] % OBJECT_MULTIPLIER;
                    const objectType = Math.floor(this.game.board[i][j] / OBJECT_MULTIPLIER);
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
        this.objectHeld = false;
        this.tileService.getToolSaved();
    }

    onMouseOverBoard(tile: Tile) {
        this.mouseService.onMouseMove({ x: tile.x, y: tile.y });
        if (this.mouseService.mousePressed && !this.objectHeld) {
            this.modifyTile(tile);
        }
    }

    onMouseDownBoard(event: MouseEvent, tile: Tile) {
        this.mouseService.onMouseDown({ x: tile.x, y: tile.y });
        if (event.button === RIGHT_CLICK) {
            if (tile.object) {
                this.deleteObject(tile);
                return;
            } else {
                this.tileService.saveTool();
                this.tileService.deleteTool();
            }
        } else if (tile.object) {
            this.objectHeld = true;
            return;
        }
        this.modifyTile(tile);
    }

    deleteObject(tile: Tile) {
        tile.object = 0;
    }

    onMouseLeaveBoard() {
        this.mouseService.onMouseUp();
    }

    onObjectChanged(event: number, tile: Tile) {
        tile.object = event;
    }
    reloadTiles() {
        for (let i = 0; i < this.mapSize ** 2; i++) {
            const tileComponent = this.tileComponents.get(i);
            if (tileComponent) {
                tileComponent.refreshObject();
            }
        }
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
