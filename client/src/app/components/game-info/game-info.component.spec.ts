import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
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
                maxLife: 100,
                speed: 10,
                attack: 5,
                defense: 3,
                winCount: 0,
                pendingItem: 0,
                loseCount: 0,
            },
        ];
        component.deletedPlayers = deletedPlayers;
        expect(component.getPlayersDeleted()).toEqual(deletedPlayers);
    });
    it('should return an empty array when no deleted players are provided', () => {
        component.deletedPlayers = [];
        expect(component.getPlayersDeleted()).toEqual([]);
    });
    it('should return "Red" if the player is in team1', () => {
        const player: Player = {
            id: '1',
            name: 'Player One',
            avatar: 'avatar1.png',
            isHost: false,
            life: 100,
            maxLife: 100,
            speed: 10,
            attack: 5,
            defense: 3,
            winCount: 0,
            pendingItem: 0,
            loseCount: 0,
        };
        component.gameState = {
            id: 'game1',
            board: [],
            turnCounter: 0,
            players: [],
            teams: {
                team1: [player],
                team2: [],
            },
            status: 'ongoing',
            winner: null,
            currentPlayer: '',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            gameSettings: {},
            gameHistory: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 0,
            currentPlayerActionPoints: 0,
            debug: false,
            gameMode: 'default',
            startDate: new Date(),
        } as GameState;
        expect(component.getTeam(player)).toBe('Red');
    });

    it('should return "Blue" if the player is in team2', () => {
        const player: Player = {
            id: '2',
            name: 'Player Two',
            avatar: 'avatar2.png',
            isHost: false,
            life: 90,
            maxLife: 90,
            speed: 8,
            attack: 6,
            defense: 4,
            winCount: 0,
            pendingItem: 0,
            loseCount: 0,
        };
        component.gameState = {
            id: 'game1',
            board: [],
            turnCounter: 0,
            players: [],
            teams: {
                team1: [],
                team2: [],
            },
            status: 'ongoing',
            winner: null,
            currentPlayer: '',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            gameSettings: {},
            gameHistory: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 0,
            currentPlayerActionPoints: 0,
            debug: false,
            gameMode: 'default',
            startDate: new Date(),
        } as GameState;
        expect(component.getTeam(player)).toBe('Blue');
    });

    it('should return an empty string if gameState or teams are undefined', () => {
        const player: Player = {
            id: '4',
            name: 'Player Four',
            avatar: 'avatar4.png',
            isHost: false,
            life: 70,
            maxLife: 70,
            speed: 6,
            attack: 3,
            defense: 1,
            winCount: 0,
            pendingItem: 0,
            loseCount: 0,
        };
        component.gameState = undefined;
        expect(component.getTeam(player)).toBe('');
    });
});
