import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OBJECT_COUNT } from '@app/Consts/app.constants';

@Injectable({
    providedIn: 'root',
})
export class ObjectCounterService {
    counter$;
    spawnCounter$;

    private counterSubject = new BehaviorSubject<number>(0); // Initial value: 0
    private spawnCounterSubject = new BehaviorSubject<number>(0);

    constructor() {
        this.counter$ = this.counterSubject.asObservable();
        this.spawnCounter$ = this.spawnCounterSubject.asObservable();
    }

    initializeCounter(initialValue: number): void {
        this.counterSubject.next(initialValue);
        this.spawnCounterSubject.next(initialValue);
    }

    incrementCounter(type: number): void {
        if (type === OBJECT_COUNT.large) {
            this.spawnCounterSubject.next(this.spawnCounterSubject.value + 1);
        }
    }

    decrementCounter(type: number): void {
        if (type === OBJECT_COUNT.large && this.spawnCounterSubject.value > 0) {
            this.spawnCounterSubject.next(this.spawnCounterSubject.value - 1);
        }
    }
}
