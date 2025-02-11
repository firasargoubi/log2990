import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectsComponent } from './objects.component';

describe('ObjectsComponent', () => {
    let component: ObjectsComponent;
    let fixture: ComponentFixture<ObjectsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ObjectsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ObjectsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render object list', () => {
        component.objects = [{ name: 'Object 1' }, { name: 'Object 2' }];
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const objectElements = compiled.querySelectorAll('.object-name');
        expect(objectElements.length).toBe(2);
        expect(objectElements[0].textContent).toContain('Object 1');
        expect(objectElements[1].textContent).toContain('Object 2');
    });
});
