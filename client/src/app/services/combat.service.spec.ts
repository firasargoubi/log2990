import { TestBed } from '@angular/core/testing';
import { GameState } from '@common/game-state';
import { TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { CombatService } from './combat.service';

describe('CombatService', () => {
    const D4_MAX = 4;
    const D6_MAX = 6;
    let service: CombatService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(CombatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('rollDice', () => {
        it('should return a number between 1 and 4 when player has D4 bonus for attack', () => {
            const player: Player = {
                id: '1',
                name: 'Player1',
                avatar: 'avatar1',
                isHost: false,
                life: 100,
                maxLife: 100,
                speed: 10,
                attack: 10,
                defense: 10,
                bonus: { attack: 'D4' },
            };
            const result = service.rollDice(player, 'attack');
            expect(result).toBeLessThanOrEqual(D4_MAX);
            expect(result).toBeLessThanOrEqual(D4_MAX);
        });

        it('should return a number between 1 and 6 when player has no bonus for attack', () => {
            const player: Player = {
                id: '1',
                name: 'Player1',
                avatar: 'avatar1',
                isHost: false,
                life: 100,
                maxLife: 100,
                speed: 10,
                attack: 10,
                defense: 10,
                bonus: { attack: 'D4' },
            };
            const result = service.rollDice(player, 'attack');
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(D6_MAX);
        });

        it('should return a number between 1 and 4 when player has D4 bonus for defense', () => {
            const player: Player = {
                id: '1',
                name: 'Player1',
                avatar: 'avatar1',
                isHost: false,
                life: 100,
                maxLife: 100,
                speed: 10,
                attack: 10,
                defense: 10,
                bonus: { defense: 'D4' },
            };
            const result = service.rollDice(player, 'defense');
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(D4_MAX);
        });

        it('should return a number between 1 and 6 when player has no bonus for defense', () => {
            const player: Player = {
                id: '1',
                name: 'Player1',
                avatar: 'avatar1',
                isHost: false,
                life: 100,
                maxLife: 100,
                speed: 10,
                attack: 10,
                defense: 10,
                bonus: { attack: 'D4' },
            };
            const result = service.rollDice(player, 'defense');
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(D6_MAX);
        });
    });

    describe('isOnIce', () => {
        it('should return true if player is on ice', () => {
            const player: Player = {
                id: '1',
                name: 'Player1',
                avatar: 'avatar1',
                isHost: false,
                life: 100,
                maxLife: 100,
                speed: 10,
                attack: 10,
                defense: 10,
                bonus: { attack: 'D4' },
            };
            const gameState: GameState = {
                id: 'game1',
                turnCounter: 0,
                currentPlayer: '1',
                availableMoves: [],
                players: [
                    {
                        id: '1',
                        name: 'Player1',
                        avatar: 'avatar1',
                        isHost: false,
                        life: 100,
                        maxLife: 100,
                        speed: 10,
                        attack: 10,
                        defense: 10,
                        bonus: { attack: 'D4' },
                    },
                ],
                playerPositions: [{ x: 0, y: 0 }],
                board: [[TileTypes.Ice]],
                shortestMoves: [],
                spawnPoints: [],
                currentPlayerMovementPoints: 0,
                currentPlayerActionPoints: 0,
            };
            const result = service.isOnIce(player, gameState);
            expect(result).toBeTrue();
        });

        it('should return false if player is not on ice', () => {
            const player: Player = {
                id: '1',
                name: 'Player1',
                avatar: 'avatar1',
                isHost: false,
                life: 100,
                maxLife: 100,
                speed: 10,
                attack: 10,
                defense: 10,
                bonus: { attack: 'D4' },
            };
            const gameState: GameState = {
                id: 'game1',
                turnCounter: 0,
                currentPlayer: '1',
                availableMoves: [],
                players: [
                    {
                        id: '1',
                        name: 'Player1',
                        avatar: 'avatar1',
                        isHost: false,
                        life: 100,
                        maxLife: 100,
                        speed: 10,
                        attack: 10,
                        defense: 10,
                        bonus: { attack: 'D4' },
                    },
                ],
                playerPositions: [{ x: 0, y: 0 }],
                board: [[TileTypes.Grass]],
                shortestMoves: [],
                spawnPoints: [],
                currentPlayerMovementPoints: 0,
                currentPlayerActionPoints: 0,
            };
            const result = service.isOnIce(player, gameState);
            expect(result).toBeFalse();
        });
    });
});
