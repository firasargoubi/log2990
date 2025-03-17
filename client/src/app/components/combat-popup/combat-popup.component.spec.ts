import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombatPopupComponent } from './combat-popup.component';

describe('CombatPopupComponent', () => {
  let component: CombatPopupComponent;
  let fixture: ComponentFixture<CombatPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombatPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
