import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TileComponent } from '@app/components/tile/tile.component';
import { Coordinates } from '@app/interfaces/coordinates';
import { Game } from '@app/interfaces/game.model';
import { Tile } from '@app/interfaces/tile';
import { BoardService } from '@app/services/board.service';
import { MouseService } from '@app/services/mouse.service';
import { SaveService } from '@app/services/save.service';
import { TileService } from '@app/services/tile.service';
import { GameSize, GameType, RIGHT_CLICK } from '@app/Consts/app.constants';

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
        mapSize: GameSize.Small,
        mode: GameType.Classic,
        previewImage: '',
        description: '',
        lastModified: new Date(),
        isVisible: true,
        board: [],
        objects: [],
    };
    @ViewChildren(TileComponent) tileComponents!: QueryList<TileComponent>;

    private mouseService = inject(MouseService);
    private tileService = inject(TileService);
    private saveService = inject(SaveService);
    private boardService = inject(BoardService);
    private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

    constructor() {
        this.saveService.isSave$.pipe(takeUntilDestroyed()).subscribe((isActive: boolean) => {
            if (isActive) {
                this.reloadTiles();
                this.saveService.verifyBoard(this.boardService.board);
            }
        });
        this.tileService.resetTool();
    }

    get mapSize(): number {
        return this.boardService.getMapSize(this.game.mapSize);
    }

    get tiles(): Tile[][] {
        return this.boardService.board;
    }

    ngOnInit() {
        this.initializeBoard();
        this.cdr.detectChanges();
    }

    initializeBoard(): void {
        this.boardService.initializeBoard(this.game, this.mapSize);
    }

    loadBoard(board: Tile[][]): void {
        this.boardService.loadBoard(board);
    }

    onMouseUpBoard(): void {
        this.mouseService.onMouseUp();
        this.boardService.objectHeld = false;
        this.tileService.getToolSaved();
    }

    onMouseOverBoard(tile: Tile) {
        this.mouseService.onMouseMove({ x: tile.x, y: tile.y });
        if (this.mouseService.mousePressed && !this.boardService.objectHeld) {
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
            this.boardService.objectHeld = true;
            return;
        }
        this.modifyTile(tile);
    }

    deleteObject(tile: Tile) {
        this.boardService.deleteObject(tile);
    }

    onMouseLeaveBoard() {
        this.mouseService.onMouseUp();
    }

    onObjectChanged(event: number, tile: Tile) {
        tile.object = event;
        this.boardService.notifyBoardChange();
    }

    reloadTiles() {
        for (let i = 0; i < this.mapSize ** 2; i++) {
            const tileComponent = this.tileComponents.get(i);
            if (tileComponent) {
                tileComponent.refreshObject();
            }
        }
    }

    modifyTile(tile: Coordinates): void {
        this.tileService.modifyTile(this.boardService.board[tile.x][tile.y]);
        this.boardService.notifyBoardChange();
    }

    onRightClickBoard(event: MouseEvent): void {
        event.preventDefault();
    }

    onClickTileTool(type: number) {
        this.tileService.copyTileTool(type);
    }
}
