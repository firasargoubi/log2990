/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { StatsPageComponent } from './stats-page.component';

describe('StatsPageComponent', () => {
    let component: StatsPageComponent;
    let fixture: ComponentFixture<StatsPageComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockGameState: GameState;
    let mockPlayers: Player[];

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);

        mockPlayers = [
            {
                name: 'Player 1',
                avatar: '🐱',
                life: 10,
                attack: 5,
                defense: 3,
                speed: 2,
                winCount: 1,
                pendingItem: 0,
                id: '1',
                isHost: true,
                maxLife: 10,
                loseCount: 2,
                fleeCount: 3,
                damageReceived: 15,
                damageDealt: 20,
                itemsPicked: [],
                tileVisited: [],
            },
            {
                name: 'Player 2',
                avatar: '🐶',
                life: 8,
                attack: 4,
                defense: 2,
                speed: 3,
                winCount: 0,
                pendingItem: 0,
                id: '2',
                isHost: false,
                maxLife: 8,
                loseCount: 1,
                fleeCount: 1,
                damageReceived: 10,
                damageDealt: 15,
                itemsPicked: [],
                tileVisited: [],
            },
        ];

        mockGameState = {
            players: mockPlayers,
            currentPlayer: 'Player 1',
            board: [],
            gameMode: 'classic',
            playerPositions: [],
            spawnPoints: [],
            currentPlayerActionPoints: 1,
            debug: false,
            id: 'game-123',
            turnCounter: 42,
            availableMoves: [],
            shortestMoves: [],
            currentPlayerMovementPoints: 1,
        };

        await TestBed.configureTestingModule({
            imports: [StatsPageComponent],
            providers: [{ provide: Router, useValue: mockRouter }],
        }).compileComponents();

        fixture = TestBed.createComponent(StatsPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initialization', () => {
        it('should handle single winner from navigation state', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1',
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);

            fixture.detectChanges();
            expect(component.winnersNames).toEqual(['Player 1']);
            expect(component.winnersAvatars).toEqual(['🐱']);
            expect(component.gameState).toEqual(mockGameState);
        });

        it('should handle multiple winners from navigation state', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1, Player 2',
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);

            fixture.detectChanges();
            expect(component.winnersNames).toEqual(['Player 1', 'Player 2']);
            expect(component.winnersAvatars).toEqual(['🐱', '🐶']);
        });

        it('should handle array of winners from navigation state', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: ['Player 1', 'Player 2'],
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);

            fixture.detectChanges();
            expect(component.winnersNames).toEqual(['Player 1', 'Player 2']);
            expect(component.winnersAvatars).toEqual(['🐱', '🐶']);
        });

        it('should handle missing navigation state', () => {
            mockRouter.getCurrentNavigation.and.returnValue(null);
            fixture.detectChanges();
            expect(component.winnersNames).toEqual(['Unknown']);
            expect(component.winnersAvatars).toEqual([]);
            expect(component.gameState).toBeUndefined();
        });

        it('should handle undefined gameState', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1',
                        lobbyId: 'test-lobby',
                        gameState: undefined,
                    },
                },
            } as any);

            fixture.detectChanges();
            expect(component.winnersNames).toEqual(['Player 1']);
            expect(component.winnersAvatars).toEqual([]);
            expect(component.gameState).toBeUndefined();
        });

        it('should handle winner not in players list', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 3',
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);

            fixture.detectChanges();
            expect(component.winnersNames).toEqual(['Player 3']);
            expect(component.winnersAvatars).toEqual(['Unknown']);
        });

        it('should handle empty winner string', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: '',
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);

            fixture.detectChanges();
            expect(component.winnersNames).toEqual(['']);
            expect(component.winnersAvatars).toEqual(['Unknown']);
        });
    });

    describe('return()', () => {
        it('should navigate to home page', () => {
            component.return();
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
        });
    });

    describe('trackByName()', () => {
        it('should return the name for tracking', () => {
            const name = 'Test Player';
            expect(component.trackByName(0, name)).toBe(name);
        });
    });

    describe('Template', () => {
        it('should display winner information with valid data', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1',
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const winnerItems = compiled.querySelectorAll('.winner-item');
            expect(winnerItems.length).toBe(1);
            expect(winnerItems[0].querySelector('.winner-name').textContent).toContain('Player 1');
            expect(winnerItems[0].querySelector('.avatar-image').src).toContain('🐱');
        });

        it('should display Unknown winner when no navigation', () => {
            mockRouter.getCurrentNavigation.and.returnValue(null);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const winnerItems = compiled.querySelectorAll('.winner-item');
            expect(winnerItems.length).toBe(1);
            expect(winnerItems[0].querySelector('.winner-name').textContent).toContain('Unknown');
            expect(winnerItems[0].querySelector('.avatar-image').src).toContain('');
        });

        it('should display player statistics table', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1',
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const rows = compiled.querySelectorAll('.stats-table tbody tr');
            expect(rows.length).toBe(2);

            const player1Row = rows[0];
            expect(player1Row.cells[0].textContent).toContain('Player 1');
            expect(player1Row.cells[1].textContent).toContain('3 combats');
            expect(player1Row.cells[2].textContent).toContain('3 évasions');
            expect(player1Row.cells[3].textContent).toContain('1 victoires');
            expect(player1Row.cells[4].textContent).toContain('2 défaites');
            expect(player1Row.cells[5].textContent).toContain('15 PV');
            expect(player1Row.cells[6].textContent).toContain('20 PV');
            expect(player1Row.cells[7].textContent).toContain('4 objets');
            expect(player1Row.cells[8].textContent).toContain('75%');
        });

        it('should handle undefined stats with defaults', () => {
            const minimalPlayer: Player = {
                name: 'Player 3',
                avatar: '🐰',
                life: 5,
                attack: 1,
                defense: 1,
                speed: 1,
                winCount: 0,
                pendingItem: 0,
                id: '3',
                isHost: false,
                maxLife: 5,
                loseCount: 0,
                fleeCount: 0,
                damageReceived: 0,
                damageDealt: 0,
            };
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 3',
                        lobbyId: 'test-lobby',
                        gameState: { ...mockGameState, players: [minimalPlayer] },
                    },
                },
            } as any);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const rows = compiled.querySelectorAll('.stats-table tbody tr');
            expect(rows[0].cells[7].textContent).toContain('0 objets'); // itemsPicked undefined
            expect(rows[0].cells[8].textContent).toContain('0%'); // tileVisited undefined
        });

        it('should display game statistics', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1',
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const statItems = compiled.querySelectorAll('.game-stats-list .stat-item');
            expect(statItems.length).toBe(5);
            expect(statItems[0].querySelector('.stat-value').textContent).toContain('01:45:30');
            expect(statItems[1].querySelector('.stat-value').textContent).toContain('42');
            expect(statItems[2].querySelector('.stat-value').textContent).toContain('✓');
            expect(statItems[3].querySelector('.stat-value').textContent).toContain('✓');
            expect(statItems[4].querySelector('.stat-value').textContent).toContain('✗');
        });

        it('should have a functional return button', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1',
                        lobbyId: 'test-lobby',
                        gameState: mockGameState,
                    },
                },
            } as any);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const button = compiled.querySelector('.quit-button button');
            button.click();
            expect(mockRouter.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
        });

        it('should handle empty players array', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1',
                        lobbyId: 'test-lobby',
                        gameState: { ...mockGameState, players: [] },
                    },
                },
            } as any);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const rows = compiled.querySelectorAll('.stats-table tbody tr');
            expect(rows.length).toBe(0);
        });

        it('should handle undefined gameState in template', () => {
            mockRouter.getCurrentNavigation.and.returnValue({
                extras: {
                    state: {
                        winner: 'Player 1',
                        lobbyId: 'test-lobby',
                        gameState: undefined,
                    },
                },
            } as any);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const rows = compiled.querySelectorAll('.stats-table tbody tr');
            expect(rows.length).toBe(0);
        });
    });
});
