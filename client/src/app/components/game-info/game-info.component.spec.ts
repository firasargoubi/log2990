import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameInfoComponent } from './game-info.component';

describe('GameInfoComponent', () => {
    let component: GameInfoComponent;
    let fixture: ComponentFixture<GameInfoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GameInfoComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(GameInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should return the array of deleted players when provided', () => {
        const deletedPlayers = [
            {
                id: '1',
                name: 'Player One',
                avatar: 'avatar1.png',
                isHost: false,
                life: 100,
                speed: 10,
                attack: 5,
                defense: 3,
            },
        ];
        component.deletedPlayers = deletedPlayers;
        expect(component.getPlayersDeleted()).toEqual(deletedPlayers);
    });
    it('should return an empty array when no deleted players are provided', () => {
        component.deletedPlayers = [];
        expect(component.getPlayersDeleted()).toEqual([]);
    });
});
