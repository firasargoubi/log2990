import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ObjectsTypes } from '@app/interfaces/objectsTypes';

@Injectable({
    providedIn: 'root',
})
export class ObjectCounterService {
    randomCounter = new BehaviorSubject<number>(0); // Initialisé à 0
    spawnCounter = new BehaviorSubject<number>(0); // Initialisé à 0
    counterSubject = new BehaviorSubject<number>(0); // Initialisé à 0
    counter$ = this.counterSubject.asObservable();
    spawnCounter$ = this.spawnCounter.asObservable();
    randomCounter$ = this.randomCounter.asObservable(); // Observable pour écouter les changements

    decrementCounter(type: number) {
        if (this.counterSubject.value > 0) {
            if (type === ObjectsTypes.SPAWN) {
                this.spawnCounter.next(this.spawnCounter.value - 1);
            } else if (type === ObjectsTypes.RANDOM) {
                this.randomCounter.next(this.randomCounter.value - 1);
            } else {
                this.counterSubject.next(this.counterSubject.value - 1);
            }
        }
    }

    incrementCounter(type: number) {
        if (type === ObjectsTypes.SPAWN) {
            this.spawnCounter.next(this.spawnCounter.value + 1);
        } else if (type === ObjectsTypes.RANDOM) {
            this.randomCounter.next(this.randomCounter.value + 1);
        } else {
            this.counterSubject.next(this.counterSubject.value + 1);
        }
    }

    getCounter() {
        return this.counterSubject.value;
    }

    initializeCounter(value: number) {
        this.counterSubject.next(value);
        this.spawnCounter.next(value);
        this.randomCounter.next(value);
    }
}
