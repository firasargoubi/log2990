import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TileComponent } from '@app/components/tile/tile.component';
import { Tile } from '@app/interfaces/tile';

@Component({
    selector: 'app-board',
    imports: [TileComponent, CommonModule, FormsModule],
    templateUrl: './board.component.html',
    styleUrl: './board.component.scss',
})
export class BoardComponent implements OnInit {
    @Input() size: number;
    board: Tile[] = [];
    mouseStatus: boolean = false;
    mouseState: number = -1;
    tool: number = -1;
    // TODO : Ajouter 2 composantes outils pour la gestion des ajouts de case et objets (logique et verification)
    // TODO : Ajouter la recherche du plateau dans la base de donnees

    get tiles(): Tile[] {
        return this.board;
    }

    ngOnInit(): void {
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

    mouseOff(): void {
        this.mouseStatus = false;
        this.mouseState = -1;
    }

    mouseOn(event: MouseEvent): void {
        this.mouseStatus = true;
        this.mouseState = event.button;
    }

    modifyTile(event: MouseEvent, tile: Tile, isStart: boolean = false): void {
        if (this.mouseStatus || isStart) {
            if (this.mouseState === 0) {
                tile.type = this.tool;
            } else if (this.mouseState === 2) {
                tile.type = -1;
            }
        }
    }

    copyTileType(type: number): void {
        this.tool = type;
    }

    preventContextMenu(event: MouseEvent): void {
        event.preventDefault();
    }
}
