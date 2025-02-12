import { TestBed } from '@angular/core/testing';
import { ErrorService } from './error.service';

describe('ErrorService', () => {
    let service: ErrorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ErrorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit message and newline when addMessage is called', (done) => {
        const expectedMessages: string[] = ['Test Message', '\n'];
        const receivedMessages: string[] = [];

        service.message$.subscribe((msg) => {
            receivedMessages.push(msg);
            if (receivedMessages.length === expectedMessages.length) {
                expect(receivedMessages).toEqual(expectedMessages);
                done();
            }
        });

        service.addMessage('Test Message');
    });
});
