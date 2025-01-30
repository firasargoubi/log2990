import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameCreationCardComponent } from './game-creation-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

describe('GameCardComponent', () => {
    let component: GameCreationCardComponent;
    let fixture: ComponentFixture<GameCreationCardComponent>;

    const mockGame = {
        id: 1,
        name: 'Test Game',
        mapSize: 'Large',
        mode: 'Survival',
        previewImage: 'https://via.placeholder.com/150',
        description: 'A test game description',
        lastModified: new Date(),
        isVisible: true,
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MatCardModule, MatTooltipModule, MatButtonModule, MatSlideToggleModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameCreationCardComponent);
        component = fixture.componentInstance;
        component.game = { ...mockGame }; // Provide input data
        fixture.detectChanges(); // Trigger change detection
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
