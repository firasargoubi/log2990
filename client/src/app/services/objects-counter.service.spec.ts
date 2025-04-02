/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { ObjectsTypes } from '@common/game.interface';
import { take } from 'rxjs/operators';
import { ObjectCounterService } from './objects-counter.service';

describe('ObjectCounterService', () => {
    let service: ObjectCounterService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ObjectCounterService],
        });
        service = TestBed.inject(ObjectCounterService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize item counter with a given value', (done) => {
        service.initializeCounter(5);
        service.itemCounter$.pipe(take(1)).subscribe((value) => {
            expect(value).toBe(5);
            done();
        });
    });

    it('should initialize spawn counter with a given value', (done) => {
        service.initializeCounter(3);
        service.spawnCounter$.pipe(take(1)).subscribe((value) => {
            expect(value).toBe(3);
            done();
        });
    });

    it('should initialize flagPlaced to false', (done) => {
        service.initializeCounter(0);
        service.flagPlaced$.pipe(take(1)).subscribe((value) => {
            expect(value).toBeFalse();
            done();
        });
    });

    it('should reset all counters and state properly', (done) => {
        service.initializeCounter(5);
        service.incrementCounter(ObjectsTypes.SPAWN);
        service.decrementCounter(ObjectsTypes.FLAG);
        service.decrementCounter(999);
        service.initializeCounter(0);

        service.itemCounter$.pipe(take(1)).subscribe((itemValue) => {
            expect(itemValue).toBe(0);
            service.spawnCounter$.pipe(take(1)).subscribe((spawnValue) => {
                expect(spawnValue).toBe(0);
                service.flagPlaced$.pipe(take(1)).subscribe((flagValue) => {
                    expect(flagValue).toBeFalse();
                    expect(service.isItemPlaced(999)).toBeFalse();
                    done();
                });
            });
        });
    });

    describe('incrementCounter', () => {
        beforeEach(() => {
            service.initializeCounter(0);
        });

        it('should increment spawn counter for SPAWN type', (done) => {
            service.incrementCounter(ObjectsTypes.SPAWN);
            service.spawnCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(1);
                done();
            });
        });

        it('should set flagPlaced to false for FLAG type', (done) => {
            service.decrementCounter(ObjectsTypes.FLAG);
            service.incrementCounter(ObjectsTypes.FLAG);
            service.flagPlaced$.pipe(take(1)).subscribe((value) => {
                expect(value).toBeFalse();
                done();
            });
        });

        it('should increment item counter for RANDOM type', (done) => {
            service.incrementCounter(ObjectsTypes.RANDOM);
            service.itemCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(1);
                done();
            });
        });

        it('should remove unique item and increment item counter for other types', (done) => {
            service.initializeCounter(1);
            service.decrementCounter(999);
            expect(service.isItemPlaced(999)).toBeTrue();
            service.incrementCounter(999);
            expect(service.isItemPlaced(999)).toBeFalse();
            service.itemCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(1);
                done();
            });
        });
    });

    describe('decrementCounter', () => {
        beforeEach(() => {
            service.initializeCounter(2);
        });

        it('should decrement spawn counter for SPAWN type if > 0', (done) => {
            service.decrementCounter(ObjectsTypes.SPAWN);
            service.spawnCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(1);
                done();
            });
        });

        it('should not decrement spawn counter below 0', (done) => {
            service.initializeCounter(0);
            service.decrementCounter(ObjectsTypes.SPAWN);
            service.spawnCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(0);
                done();
            });
        });

        it('should set flagPlaced to true for FLAG type', (done) => {
            service.decrementCounter(ObjectsTypes.FLAG);
            service.flagPlaced$.pipe(take(1)).subscribe((value) => {
                expect(value).toBeTrue();
                done();
            });
        });

        it('should decrement item counter for RANDOM type if > 0', (done) => {
            service.decrementCounter(ObjectsTypes.RANDOM);
            service.itemCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(1);
                done();
            });
        });

        it('should not decrement item counter below 0 for RANDOM type', (done) => {
            service.initializeCounter(0);
            service.decrementCounter(ObjectsTypes.RANDOM);
            service.itemCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(0);
                done();
            });
        });

        it('should add unique item and decrement item counter for other types if > 0', (done) => {
            service.decrementCounter(999);
            expect(service.isItemPlaced(999)).toBeTrue();
            service.itemCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(1);
                done();
            });
        });

        it('should not decrement item counter or add unique item if <= 0', (done) => {
            service.initializeCounter(0);
            service.decrementCounter(999);
            expect(service.isItemPlaced(999)).toBeFalse();
            service.itemCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(0);
                done();
            });
        });
    });

    describe('isItemPlaced', () => {
        beforeEach(() => {
            service.initializeCounter(0);
        });

        it('should return true for SPAWN when spawnCounter <= 0', () => {
            expect(service.isItemPlaced(ObjectsTypes.SPAWN)).toBeTrue();
            service.incrementCounter(ObjectsTypes.SPAWN);
            expect(service.isItemPlaced(ObjectsTypes.SPAWN)).toBeFalse();
        });

        it('should return flagPlaced value for FLAG type', () => {
            expect(service.isItemPlaced(ObjectsTypes.FLAG)).toBeFalse();
            service.decrementCounter(ObjectsTypes.FLAG);
            expect(service.isItemPlaced(ObjectsTypes.FLAG)).toBeTrue();
        });

        it('should return true for RANDOM when itemCounter <= 0', () => {
            expect(service.isItemPlaced(ObjectsTypes.RANDOM)).toBeTrue();
            service.incrementCounter(ObjectsTypes.RANDOM);
            expect(service.isItemPlaced(ObjectsTypes.RANDOM)).toBeFalse();
        });

        it('should return true if type is considered placed for other types', () => {
            service.initializeCounter(1);
            expect(service.isItemPlaced(999)).toBeFalse();
            service.decrementCounter(999);
            expect(service.isItemPlaced(999)).toBeTrue();
            service.incrementCounter(999);
            expect(service.isItemPlaced(999)).toBeFalse();
        });
    });

    describe('Getter Methods', () => {
        beforeEach(() => {
            service.initializeCounter(10);
        });

        it('should get the current spawn counter', () => {
            expect(service.getSpawnCounter()).toBe(10);
        });

        it('should get the current item counter', () => {
            expect(service.getItemCounter()).toBe(10);
        });
    });
});
