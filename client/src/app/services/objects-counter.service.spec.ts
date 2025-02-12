import { TestBed } from '@angular/core/testing';
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
        service.incrementCounter(6); // Type 6 pour spawn
        service.spawnCounter$.pipe(take(1)).subscribe((value) => {
            expect(value).toBe(1);
            done();
        });
    });

    it('should decrement spawn counter for type 6', (done) => {
        service.initializeCounter(2);
        service.decrementCounter(6); // Type 6 pour spawn
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
});
