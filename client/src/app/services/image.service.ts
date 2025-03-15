import { Injectable } from '@angular/core';
import { ObjectsTypes, TileTypes } from '@app/Consts/app.constants';
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

        try {
            const canvas = await html2canvas(componentElement, {
                logging: false,
                backgroundColor: null,
            });

            const image = canvas.toDataURL('image/png');
            return this.compressImage(image);
        } catch (error) {
            return Promise.reject('Error capturing component: ' + error);
        }
    }

    async captureBoardFromTiles(board: Tile[][]): Promise<string> {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';

        const boardElement = document.createElement('div');
        boardElement.style.display = 'grid';
        boardElement.style.gridTemplateColumns = `repeat(${board.length}, 1fr)`;
        boardElement.style.gridTemplateRows = `repeat(${board.length}, 1fr)`;
        boardElement.style.width = '650px';
        boardElement.style.height = '650px';
        boardElement.style.backgroundColor = '#ccc';

        for (const row of board) {
            for (const tile of row) {
                const tileElement = document.createElement('div');
                tileElement.style.border = '1px solid #ddd';

                tileElement.style.backgroundImage = `url(${this.getTileBackgroundUrl(tile.type)})`;
                tileElement.style.backgroundSize = 'cover';
                tileElement.style.backgroundPosition = 'center';

                if (tile.object > 0) {
                    const objectImg = document.createElement('img');
                    objectImg.src = this.getObjectImageUrl(tile.object);
                    objectImg.style.width = '30px';
                    objectImg.style.height = '30px';
                    objectImg.style.position = 'absolute';
                    objectImg.style.top = '50%';
                    objectImg.style.left = '50%';
                    objectImg.style.transform = 'translate(-50%, -50%)';
                    tileElement.appendChild(objectImg);
                }

                boardElement.appendChild(tileElement);
            }
        }

        container.appendChild(boardElement);
        document.body.appendChild(container);

        try {
            const image = await this.captureComponent(boardElement);
            document.body.removeChild(container);
            return this.compressImage(image);
        } catch (error) {
            document.body.removeChild(container);
            throw error;
        }
    }

    private getTileBackgroundUrl(tileType: number): string {
        switch (tileType) {
            case TileTypes.Grass:
                return 'assets/tiles/grass.png';
            case TileTypes.Water:
                return 'assets/tiles/water.png';
            case TileTypes.Ice:
                return 'assets/tiles/ice2.png';
            case TileTypes.DoorClosed:
                return 'assets/tiles/door_c.png';
            case TileTypes.DoorOpen:
                return 'assets/tiles/door_o.png';
            case TileTypes.Wall:
                return 'assets/tiles/wall.png';
            default:
                return 'assets/tiles/grass.png';
        }
    }

    private getObjectImageUrl(objectType: number): string {
        switch (objectType) {
            case ObjectsTypes.BOOTS:
                return 'assets/objects/boots.png';
            case ObjectsTypes.SWORD:
                return 'assets/objects/sword.png';
            case ObjectsTypes.POTION:
                return 'assets/objects/potion.png';
            case ObjectsTypes.WAND:
                return 'assets/objects/wand.png';
            case ObjectsTypes.CRYSTAL:
                return 'assets/objects/crystal_ball.png';
            case ObjectsTypes.JUICE:
                return 'assets/objects/berry-juice.png';
            case ObjectsTypes.SPAWN:
                return 'assets/objects/vortex.png';
            case ObjectsTypes.RANDOM:
                return 'assets/objects/gnome.png';
            default:
                return 'assets/objects/undefined.png';
        }
    }

    private async compressImage(imageSrc: string, quality: number = 0.7, maxWidth: number = 500, maxHeight: number = 500): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const scaleFactor = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * scaleFactor);
                    height = Math.round(height * scaleFactor);
                }

                canvas.width = width;
                canvas.height = height;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } else {
                    reject('Impossible de compresser l’image');
                }
            };

            img.onerror = (error) => reject(error);
        });
    }
}
