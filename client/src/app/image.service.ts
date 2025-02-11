import { Injectable } from '@angular/core';
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
                useCORS: true,
                allowTaint: true,
            });

            return canvas.toDataURL('image/png');
        } catch (error) {
            return Promise.reject('Error capturing component: ' + error);
        }
    }
}
