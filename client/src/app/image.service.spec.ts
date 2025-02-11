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
        const mockCanvas = document.createElement('canvas');
        spyOn(mockCanvas, 'toDataURL').and.returnValue('data:image/png;base64,mockImage');

        // Correctly mock html2canvas as a function
        spyOn<any>(html2canvas, 'apply').and.returnValue(Promise.resolve(mockCanvas));

        const result = await service.captureComponent(mockElement);
        expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/png');
        expect(result).toBe('data:image/png;base64,mockImage');
    });

    it('should reject when given an invalid element', async () => {
        await service.captureComponent(null as unknown as HTMLElement).catch((error) => {
            expect(error).toBe('Invalid HTML element');
        });
    });

    it('should reject when html2canvas fails', async () => {
        const mockElement = document.createElement('div');

        spyOn<any>(html2canvas, 'apply').and.returnValue(Promise.reject(new Error('Rendering error')));

        await service.captureComponent(mockElement).catch((error) => {
            expect(error).toContain('Error capturing component');
        });
    });
});
