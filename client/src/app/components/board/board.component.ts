import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TileComponent } from '@app/components/tile/tile.component';
import { RIGHT_CLICK } from '@app/consts/app-constants';
import { Coordinates } from '@app/interfaces/coordinates';
import { BoardService } from '@app/services/board.service';
import { MouseService } from '@app/services/mouse.service';
import { SaveService } from '@app/services/save.service';
import { TileService } from '@app/services/tile.service';
import { Game, GameSize, GameType } from '@common/game.interface';
import { Tile } from '@common/tile';

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
        mapSize: GameSize.small,
        mode: GameType.Classic,
        previewImage: '',
        description: '',
        lastModified: new Date(),
        isVisible: true,
        board: [],
        objects: [],
    };
    // @ViewChildren(TileComponent) tileComponents!: QueryList<TileComponent>;

    private mouseService = inject(MouseService);
    private tileService = inject(TileService);
    private saveService = inject(SaveService);
    private boardService = inject(BoardService);
    private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

    constructor() {
        this.saveService.isSave$.pipe(takeUntilDestroyed()).subscribe((isActive: boolean) => {
            if (isActive) {
                this.boardService.notifyBoardUpdate();
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
