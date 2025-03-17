import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombatNotificationComponent } from './combat-notification.component';

describe('CombatNotificationComponent', () => {
  let component: CombatNotificationComponent;
  let fixture: ComponentFixture<CombatNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatNotificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombatNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
