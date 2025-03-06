import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ObjectsTypes } from '@app/Consts/app.constants';

@Injectable({
    providedIn: 'root',
})
export class ObjectCounterService {
    private counterSubject = new BehaviorSubject<number>(0);
    private spawnCounterSubject = new BehaviorSubject<number>(0);
    private randomCounterSubject = new BehaviorSubject<number>(0);

    /** Observable for regular object counter */
    counter$: Observable<number> = this.counterSubject.asObservable();

    /** Observable for spawn point counter */
    spawnCounter$: Observable<number> = this.spawnCounterSubject.asObservable();

    /** Observable for random object counter */
    randomCounter$: Observable<number> = this.randomCounterSubject.asObservable();

    /**
     * Initialize all counters with the specified value
     * @param initialValue Initial counter value
     */
    initializeCounter(initialValue: number): void {
        this.counterSubject.next(initialValue);
        this.spawnCounterSubject.next(initialValue);
        this.randomCounterSubject.next(initialValue);
    }

    /**
     * Increment the appropriate counter based on object type
     * @param type Object type to increment counter for
     */
    incrementCounter(type: number): void {
        switch (type) {
            case ObjectsTypes.SPAWN:
                this.spawnCounterSubject.next(this.spawnCounterSubject.value + 1);
                break;
            case ObjectsTypes.RANDOM:
                this.randomCounterSubject.next(this.randomCounterSubject.value + 1);
                break;
            default:
                this.counterSubject.next(this.counterSubject.value + 1);
                break;
        }
    }

    /**
     * Decrement the appropriate counter based on object type
     * @param type Object type to decrement counter for
     */
    decrementCounter(type: number): void {
        switch (type) {
            case ObjectsTypes.SPAWN:
                if (this.spawnCounterSubject.value > 0) {
                    this.spawnCounterSubject.next(this.spawnCounterSubject.value - 1);
                }
                break;
            case ObjectsTypes.RANDOM:
                if (this.randomCounterSubject.value > 0) {
                    this.randomCounterSubject.next(this.randomCounterSubject.value - 1);
                }
                break;
            default:
                if (this.counterSubject.value > 0) {
                    this.counterSubject.next(this.counterSubject.value - 1);
                }
                break;
        }
    }

    /**
     * Get the current value of the spawn counter
     */
    getSpawnCounter(): number {
        return this.spawnCounterSubject.value;
    }

    /**
     * Get the current value of the random counter
     */
    getRandomCounter(): number {
        return this.randomCounterSubject.value;
    }

    /**
     * Get the current value of the regular counter
     */
    getCounter(): number {
        return this.counterSubject.value;
    }
}
