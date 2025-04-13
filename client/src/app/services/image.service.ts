import { Injectable } from '@angular/core';
import { ITEM_INFOS, UNKNOWN_ITEM } from '@app/consts/item-constants';
import { DEFAULT_TILE_IMAGE, TILE_IMAGES } from '@app/consts/tile-constants';
import { Tile } from '@common/tile';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    async captureComponent(componentElement: HTMLElement): Promise<string> {
        if (!componentElement) {
            return Promise.reject('Invalid HTML element');
        }

        const canvas = await html2canvas(componentElement, {
            logging: false,
            backgroundColor: null,
        });

        return canvas.toDataURL('image/png');
    }
    async captureBoardFromTiles(board: Tile[][]): Promise<string> {
        const container = this.createHiddenContainer();
        const boardElement = this.createBoardGrid(board);

        container.appendChild(boardElement);
        document.body.appendChild(container);

        try {
            return await this.captureComponent(boardElement);
        } finally {
            document.body.removeChild(container);
        }
    }

    private createHiddenContainer(): HTMLDivElement {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        return container;
    }

    private createBoardGrid(board: Tile[][]): HTMLDivElement {
        const boardElement = document.createElement('div');
        boardElement.style.display = 'grid';
        boardElement.style.gridTemplateColumns = `repeat(${board.length}, 1fr)`;
        boardElement.style.gridTemplateRows = `repeat(${board.length}, 1fr)`;
        boardElement.style.width = '650px';
        boardElement.style.height = '650px';
        boardElement.style.backgroundColor = '#ccc';

        for (const row of board) {
            for (const tile of row) {
                boardElement.appendChild(this.createTileElement(tile));
            }
        }

        return boardElement;
    }

    private createTileElement(tile: Tile): HTMLDivElement {
        const tileElement = document.createElement('div');
        tileElement.style.border = '1px solid #ddd';
        tileElement.style.backgroundImage = `url(${this.getTileBackgroundUrl(tile.type)})`;
        tileElement.style.backgroundSize = 'cover';
        tileElement.style.backgroundPosition = 'center';
        tileElement.style.position = 'relative';

        if (tile.object > 0) {
            tileElement.appendChild(this.createObjectImage(tile.object));
        }

        return tileElement;
    }

    private createObjectImage(objectType: number): HTMLImageElement {
        const objectImg = document.createElement('img');
        objectImg.src = this.getObjectImageUrl(objectType);
        objectImg.style.width = '30px';
        objectImg.style.height = '30px';
        objectImg.style.position = 'absolute';
        objectImg.style.top = '50%';
        objectImg.style.left = '50%';
        objectImg.style.transform = 'translate(-50%, -50%)';
        return objectImg;
    }

    private getTileBackgroundUrl(tileType: number): string {
        return TILE_IMAGES[tileType] ?? DEFAULT_TILE_IMAGE;
    }

    private getObjectImageUrl(objectType: number): string {
        return ITEM_INFOS[objectType]?.image ?? UNKNOWN_ITEM.image;
    }
}
