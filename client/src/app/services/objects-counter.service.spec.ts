/* eslint-disable @typescript-eslint/no-magic-numbers */
import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs/operators';
import { ObjectCounterService } from './objects-counter.service';
import { ObjectsTypes } from '@app/Consts/app.constants';

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

    it('should initialize counter with a given value', (done) => {
        service.initializeCounter(5);
        service.counter$.pipe(take(1)).subscribe((value) => {
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

    it('should increment spawn counter for type 6', (done) => {
        service.initializeCounter(0);
        service.incrementCounter(6);
        service.spawnCounter$.pipe(take(1)).subscribe((value) => {
            expect(value).toBe(1);
            done();
        });
    });

    it('should decrement spawn counter for type 6', (done) => {
        service.initializeCounter(2);
        service.decrementCounter(6);
        service.spawnCounter$.pipe(take(1)).subscribe((value) => {
            expect(value).toBe(1);
            done();
        });
    });

    it('should not decrement spawn counter below 0', (done) => {
        service.initializeCounter(0);
        service.decrementCounter(6);
        service.spawnCounter$.pipe(take(1)).subscribe((value) => {
            expect(value).toBe(0);
            done();
        });
    });

    it('should reset counter properly', (done) => {
        service.initializeCounter(5);
        service.initializeCounter(0);

        service.spawnCounter$.pipe(take(1)).subscribe((value) => {
            expect(value).toBe(0);
            done();
        });
    });

    it('should reset spawn counter properly', (done) => {
        service.initializeCounter(5);
        service.initializeCounter(0);

        service.spawnCounter$.pipe(take(1)).subscribe((value) => {
            expect(value).toBe(0);
            done();
        });
    });

    describe('Detailed Increment and Decrement Tests', () => {
        beforeEach(() => {
            service.initializeCounter(5);
        });

        it('should increment random counter for random type', (done) => {
            service.incrementCounter(ObjectsTypes.RANDOM);
            service.randomCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(6);
                done();
            });
        });

        it('should decrement random counter only when > 0', (done) => {
            service.initializeCounter(1);
            service.decrementCounter(ObjectsTypes.RANDOM);
            service.randomCounter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(0);
                service.decrementCounter(ObjectsTypes.RANDOM);
                service.randomCounter$.pipe(take(1)).subscribe((innerValue) => {
                    expect(innerValue).toBe(0);
                    done();
                });
            });
        });

        it('should increment regular counter for unknown types', (done) => {
            service.incrementCounter(999);
            service.counter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(6);
                done();
            });
        });

        it('should decrement regular counter only when > 0', (done) => {
            service.initializeCounter(1);
            service.decrementCounter(999);
            service.counter$.pipe(take(1)).subscribe((value) => {
                expect(value).toBe(0);
                service.decrementCounter(999);
                service.counter$.pipe(take(1)).subscribe((innerValue) => {
                    expect(innerValue).toBe(0);
                    done();
                });
            });
        });
    });

    describe('Getter Methods', () => {
        beforeEach(() => {
            service.initializeCounter(10);
        });

        it('should get the current spawn counter', () => {
            const spawnCounter = service.getSpawnCounter();
            expect(spawnCounter).toBe(10);
        });

        it('should get the current random counter', () => {
            const randomCounter = service.getRandomCounter();
            expect(randomCounter).toBe(10);
        });

        it('should get the current regular counter', () => {
            const regularCounter = service.getCounter();
            expect(regularCounter).toBe(10);
        });
    });
});
