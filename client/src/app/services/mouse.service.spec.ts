import { TestBed } from '@angular/core/testing';
import { MouseService } from './mouse.service';

import { Coordinates } from '@app/interfaces/coordinates';

describe('MouseService', () => {
    let service: MouseService;
    let startPosition: Coordinates;
    let secondPosition: Coordinates;
    let curPositions: Coordinates[];
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [MouseService] });
        service = TestBed.inject(MouseService);
        startPosition = { x: 1, y: 2 };
        secondPosition = { x: 2, y: 2 };
        curPositions = [startPosition, secondPosition];
    });

    it('onMouseDown should read mouse pointer position and set mouse to pressed', () => {
        service.onMouseDown(startPosition);

        expect(service.startCoordinate.x).toBe(startPosition.x);
        expect(service.startCoordinate.y).toBe(startPosition.y);
        expect(service.mousePressed).toBeTrue();
    });

    it('onMouseMove should have a value to the current positions if mouse was pressed', () => {
        service.onMouseDown(startPosition);
        service.onMouseMove(secondPosition);

        expect(service.curCoordinates.length).toBe(curPositions.length);
        expect(service.curCoordinates).toEqual(curPositions);
    });

    it('onMouseMove should not have a value if the mouse was not pressed', () => {
        service.onMouseMove(secondPosition);

        expect(service.curCoordinates.length).toBeFalsy();
    });

    it('onMouseUp should return the current positions', () => {
        service.onMouseDown(startPosition);
        service.onMouseMove(secondPosition);
        const positions: Coordinates[] = service.onMouseUp();

        expect(positions.length).toBe(curPositions.length);
        expect(positions).toEqual(curPositions);
    });
});
