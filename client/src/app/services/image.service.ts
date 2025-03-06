import { Injectable } from '@angular/core';
import { Tile } from '@app/interfaces/tile';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    /**
     * Captures a component's visual representation as a base64 encoded image
     * @param componentElement The HTML element to capture
     * @returns A promise resolving to the base64 encoded PNG image
     */
    async captureComponent(componentElement: HTMLElement): Promise<string> {
        if (!componentElement) {
            return Promise.reject('Invalid HTML element');
        }

        try {
            const canvas = await html2canvas(componentElement, {
                logging: false,
                backgroundColor: null,
            });

            return canvas.toDataURL('image/png');
        } catch (error) {
            return Promise.reject('Error capturing component: ' + error);
        }
    }

    /**
     * Creates a visual representation of a board from tile data
     * @param board The tile data to render
     * @returns A promise resolving to the base64 encoded PNG image
     */
    async captureBoardFromTiles(board: Tile[][]): Promise<string> {
        // Create a temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        container.style.left = '-9999px';

        // Create a board element
        const boardElement = document.createElement('div');
        boardElement.style.display = 'grid';
        boardElement.style.gridTemplateColumns = `repeat(${board.length}, 1fr)`;
        boardElement.style.gridTemplateRows = `repeat(${board.length}, 1fr)`;
        boardElement.style.width = '650px';
        boardElement.style.height = '650px';
        boardElement.style.backgroundColor = '#ccc';

        // Add each tile to the board
        for (const row of board) {
            for (const tile of row) {
                const tileElement = document.createElement('div');
                tileElement.style.border = '1px solid #ddd';

                // Set background based on tile type
                tileElement.style.backgroundImage = `url(${this.getTileBackgroundUrl(tile.type)})`;
                tileElement.style.backgroundSize = 'cover';
                tileElement.style.backgroundPosition = 'center';

                // Add object image if present
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
            // Clean up
            document.body.removeChild(container);
            return image;
        } catch (error) {
            // Clean up on error
            document.body.removeChild(container);
            throw error;
        }
    }

    private getTileBackgroundUrl(tileType: number): string {
        switch (tileType) {
            case 1:
                return 'assets/tiles/grass.png';
            case 2:
                return 'assets/tiles/water.png';
            case 3:
                return 'assets/tiles/ice2.png';
            case 4:
                return 'assets/tiles/door_c.png';
            case 5:
                return 'assets/tiles/door_o.png';
            case 6:
                return 'assets/tiles/wall.png';
            default:
                return 'assets/tiles/grass.png';
        }
    }

    private getObjectImageUrl(objectType: number): string {
        switch (objectType) {
            case 1:
                return 'assets/objects/boots.png';
            case 2:
                return 'assets/objects/sword.png';
            case 3:
                return 'assets/objects/potion.png';
            case 4:
                return 'assets/objects/wand.png';
            case 5:
                return 'assets/objects/crystal_ball.png';
            case 6:
                return 'assets/objects/berry-juice.png';
            case 7:
                return 'assets/objects/vortex.png';
            case 8:
                return 'assets/objects/gnome.png';
            default:
                return 'assets/objects/undefined.png';
        }
    }
}
