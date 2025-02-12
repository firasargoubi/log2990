import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ObjectCounterService {
    private counterSubject = new BehaviorSubject<number>(0); // Initialisé à 0
    counter$ = this.counterSubject.asObservable();
    private spawnCounterSubject = new BehaviorSubject<number>(0);
    spawnCounter$ = this.spawnCounterSubject.asObservable();

    initializeCounter(initialValue: number): void {
        this.counterSubject.next(initialValue);
        this.spawnCounterSubject.next(initialValue);
    }

    incrementCounter(type: number): void {
        if (type === 6) {
            this.spawnCounterSubject.next(this.spawnCounterSubject.value + 1);
        }
    }

    decrementCounter(type: number): void {
        if (type === 6 && this.spawnCounterSubject.value > 0) {
            this.spawnCounterSubject.next(this.spawnCounterSubject.value - 1);
        }
    }
}
