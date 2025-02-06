import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ObjectCounterService {
    counterSubject = new BehaviorSubject<number>(4); // Initialisé à 4
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
}
