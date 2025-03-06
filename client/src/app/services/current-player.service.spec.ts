import { TestBed } from '@angular/core/testing';

import { CurrentPlayerService } from './current-player.service';

describe('CurrentPlayerService', () => {
    let service: CurrentPlayerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CurrentPlayerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
