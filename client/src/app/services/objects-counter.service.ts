import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ObjectCounterService {
    randomCounter = new BehaviorSubject<number>(0); // Initialisé à 0
    spawnCounter = new BehaviorSubject<number>(0); // Initialisé à 0
    counterSubject = new BehaviorSubject<number>(0); // Initialisé à 0
    counter$ = this.counterSubject.asObservable(); // Observable pour écouter les changements

    decrementCounter() {
        if (this.counterSubject.value > 0) {
            this.counterSubject.next(this.counterSubject.value - 1);
        }
    }

    incrementCounter() {
        this.counterSubject.next(this.counterSubject.value + 1);
    }

    getCounter() {
        return this.counterSubject.value;
    }

    initializeCounter(value: number) {
        this.counterSubject.next(value);
    }
}
