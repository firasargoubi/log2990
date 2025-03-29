import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VirtualPlayerDialogComponent } from './virtual-player-dialog.component';

describe('VirtualPlayerDialogComponent', () => {
    let component: VirtualPlayerDialogComponent;
    let fixture: ComponentFixture<VirtualPlayerDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [VirtualPlayerDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(VirtualPlayerDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
