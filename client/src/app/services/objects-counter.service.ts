/* eslint-disable @typescript-eslint/member-ordering */
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

    counter$: Observable<number> = this.counterSubject.asObservable();
    spawnCounter$: Observable<number> = this.spawnCounterSubject.asObservable();
    randomCounter$: Observable<number> = this.randomCounterSubject.asObservable();

    initializeCounter(initialValue: number): void {
        this.counterSubject.next(initialValue);
        this.spawnCounterSubject.next(initialValue);
        this.randomCounterSubject.next(initialValue);
    }

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

    getSpawnCounter(): number {
        return this.spawnCounterSubject.value;
    }

    getRandomCounter(): number {
        return this.randomCounterSubject.value;
    }

    getCounter(): number {
        return this.counterSubject.value;
    }
}
