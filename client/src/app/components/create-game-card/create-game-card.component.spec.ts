import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGameCardComponent } from './create-game-card.component';

describe('CreateGameCardComponent', () => {
  let component: CreateGameCardComponent;
  let fixture: ComponentFixture<CreateGameCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGameCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGameCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
