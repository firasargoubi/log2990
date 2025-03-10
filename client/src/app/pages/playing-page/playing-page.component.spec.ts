import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayingPageComponent } from './playing-page.component';

describe('PlayingPageComponent', () => {
  let component: PlayingPageComponent;
  let fixture: ComponentFixture<PlayingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
