import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountdownCombatComponent } from './countdown-combat.component';

describe('CountdownCombatComponent', () => {
    let component: CountdownCombatComponent;
    let fixture: ComponentFixture<CountdownCombatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CountdownCombatComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(CountdownCombatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
