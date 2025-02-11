/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { ImageService } from './image.service';
import html2canvas from 'html2canvas';

describe('ImageService', () => {
    let service: ImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ImageService],
        });
        service = TestBed.inject(ImageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return a base64 image when capturing a valid element', async () => {
        const mockElement = document.createElement('div');
        mockElement.innerHTML = '<p>Mock content</p>';
        document.body.appendChild(mockElement);

        const mockCanvas = document.createElement('canvas');
        spyOn(html2canvas as any, 'call').and.returnValue(Promise.resolve(mockCanvas));
        spyOn(mockCanvas, 'toDataURL').and.returnValue('data:image/png;base64,mockImage');

        const result = await service.captureComponent(mockElement);
        mockCanvas.toDataURL('image/png');
        expect(result).toBeTruthy();

        document.body.removeChild(mockElement);
    });

    it('should reject when given an invalid element', async () => {
        await expectAsync(service.captureComponent(null as any)).toBeRejectedWith('Invalid HTML element');
    });

    it('should reject when html2canvas fails', async () => {
        const mockElement = document.createElement('div');

        spyOn<any>(html2canvas, 'apply').and.returnValue(Promise.reject(new Error('Rendering error')));

        await service.captureComponent(mockElement).catch((error) => {
            expect(error).toContain('Error capturing component');
        });
    });
});
