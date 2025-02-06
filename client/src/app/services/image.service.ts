import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    async captureComponent(componentElement: HTMLElement): Promise<string> {
        const canvas = await html2canvas(componentElement, { logging: false, backgroundColor: null });
        return canvas.toDataURL('image/png');
    }
}
