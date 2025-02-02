import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCreationComponent } from './modal-creation.component';

describe('ModalCreationComponent', () => {
  let component: ModalCreationComponent;
  let fixture: ComponentFixture<ModalCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
