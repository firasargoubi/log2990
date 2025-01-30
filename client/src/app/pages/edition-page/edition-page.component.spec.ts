import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditionPageComponent } from './edition-page.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('EditionPageComponent', () => {
    let component: EditionPageComponent;
    let fixture: ComponentFixture<EditionPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditionPageComponent],
            providers: [
                HttpClient,
                HttpHandler,
                {
                    provide: ActivatedRoute,
                    useValue: { params: of({ id: '123' }) }, // Mocking route params
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditionPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
