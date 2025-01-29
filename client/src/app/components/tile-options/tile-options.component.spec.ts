import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileOptionsComponent } from './tile-options.component';

describe('TileOptionsComponent', () => {
    let component: TileOptionsComponent;
    let fixture: ComponentFixture<TileOptionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TileOptionsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TileOptionsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
