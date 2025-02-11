import { TestBed } from '@angular/core/testing';

import { ObjectManagementService } from './object-management.service';

describe('ObjectManagementService', () => {
  let service: ObjectManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjectManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
