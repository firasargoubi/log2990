import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameListComponent } from './game-list.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('GameListComponent', () => {
    let component: GameListComponent;
    let fixture: ComponentFixture<GameListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameListComponent],
            providers: [
                HttpClient,
                HttpHandler,
                {
                    provide: ActivatedRoute,
                    useValue: { data: of({ games: [] }) },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
