import { Injectable } from '@angular/core';

import { Coordinates } from '@app/interfaces/coordinates';

@Injectable({
    providedIn: 'root',
})
export class MouseService {
    startCoordinate: Coordinates = { x: 0, y: 0 };
    curCoordinates: Coordinates[] = [];
    mousePressed: boolean = false;

    onMouseDown(coordinate: Coordinates) {
        this.startCoordinate = coordinate;
        this.curCoordinates = [this.startCoordinate];
        this.mousePressed = true;
    }

    onMouseMove(coordinate: Coordinates) {
        if (!this.curCoordinates.includes(coordinate) && this.mousePressed) {
            this.curCoordinates = [...this.curCoordinates, coordinate];
        }
    }

    onMouseUp(): Coordinates[] {
        this.mousePressed = false;
        return this.curCoordinates;
    }
}
