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
    private flagPlacedSubject = new BehaviorSubject<boolean>(false);
    private uniqueItemsPlaced: Set<number> = new Set();

    itemCounter$: Observable<number> = this.itemCounterSubject.asObservable();
    spawnCounter$: Observable<number> = this.spawnCounterSubject.asObservable();
    flagPlaced$: Observable<boolean> = this.flagPlacedSubject.asObservable();

    initializeCounter(initialValue: number): void {
        this.itemCounterSubject.next(initialValue);
        this.spawnCounterSubject.next(initialValue);
        this.flagPlacedSubject.next(false);
        this.uniqueItemsPlaced.clear();
    }

    incrementCounter(type: number): void {
        switch (type) {
            case ObjectsTypes.SPAWN:
                this.spawnCounterSubject.next(this.spawnCounterSubject.value + 1);
                break;
            case ObjectsTypes.FLAG:
                this.flagPlacedSubject.next(false);
                break;
            case ObjectsTypes.RANDOM:
                this.itemCounterSubject.next(this.itemCounterSubject.value + 1);
                break;
            default:
                this.uniqueItemsPlaced.delete(type);
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
                this.flagPlacedSubject.next(true);
                break;
            case ObjectsTypes.RANDOM:
                if (this.itemCounterSubject.value > 0) {
                    this.itemCounterSubject.next(this.itemCounterSubject.value - 1);
                }
                break;
            default:
                if (this.itemCounterSubject.value > 0) {
                    this.uniqueItemsPlaced.add(type);
                    this.itemCounterSubject.next(this.itemCounterSubject.value - 1);
                }
                break;
        }
    }

    isItemPlaced(type: number): boolean {
        if (type === ObjectsTypes.SPAWN) {
            return this.spawnCounterSubject.value <= 0;
        }
        if (type === ObjectsTypes.FLAG) {
            return this.flagPlacedSubject.value;
        }
        if (type === ObjectsTypes.RANDOM) {
            return this.itemCounterSubject.value <= 0;
        }
        return this.uniqueItemsPlaced.has(type);
    }

    getSpawnCounter(): number {
        return this.spawnCounterSubject.value;
    }

    getItemCounter(): number {
        return this.itemCounterSubject.value;
    }
}
