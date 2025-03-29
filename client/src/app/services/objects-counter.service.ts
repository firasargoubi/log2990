/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { ObjectsTypes } from '@common/game.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ObjectCounterService {
    private itemCounterSubject = new BehaviorSubject<number>(0);
    private spawnCounterSubject = new BehaviorSubject<number>(0);

    itemCounter$: Observable<number> = this.itemCounterSubject.asObservable();
    spawnCounter$: Observable<number> = this.spawnCounterSubject.asObservable();

    initializeCounter(initialValue: number): void {
        this.itemCounterSubject.next(initialValue);
        this.spawnCounterSubject.next(initialValue);
    }

    incrementCounter(type: number): void {
        switch (type) {
            case ObjectsTypes.SPAWN:
                this.spawnCounterSubject.next(this.spawnCounterSubject.value + 1);
                break;
            case ObjectsTypes.FLAG:
                break;
            default:
                this.itemCounterSubject.next(this.itemCounterSubject.value + 1);
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
            case ObjectsTypes.FLAG:
                break;
            default:
                if (this.itemCounterSubject.value > 0) {
                    this.itemCounterSubject.next(this.itemCounterSubject.value - 1);
                }
                break;
        }
    }

    getSpawnCounter(): number {
        return this.spawnCounterSubject.value;
    }

    getCounter(): number {
        return this.itemCounterSubject.value;
    }
}
