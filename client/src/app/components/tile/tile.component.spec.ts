import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileComponent } from './tile.component';

describe('TileComponent', () => {
    let component: TileComponent;
    let fixture: ComponentFixture<TileComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TileComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TileComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have the correct CSS class', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.expected-class')).toBeTruthy();
    });

    it('should handle click events correctly', () => {
        spyOn(component, 'onClick');
        const compiled = fixture.nativeElement;
        const button = compiled.querySelector('button');
        button.click();
        expect(component.onClick).toHaveBeenCalled();
    });

    it('should update the title correctly', () => {
        component.title = 'New Title';
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('h1').textContent).toContain('New Title');
    });

    it('should initialize with the correct default values', () => {
        expect(component.title).toBe('Default Title');
        expect(component.someProperty).toBe('Default Value');
    });

    it('should emit an event correctly', () => {
        spyOn(component.someEvent, 'emit');
        component.triggerEvent();
        expect(component.someEvent.emit).toHaveBeenCalledWith('expectedValue');
    });
});
