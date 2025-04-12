/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Navigation, Router } from '@angular/router';
import { PageUrl } from '@app/Consts/route-constants';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { StatsPageComponent } from './stats-page.component';

describe('StatsPageComponent', () => {
    let component: StatsPageComponent;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['getCurrentNavigation', 'navigate']);
        component = new StatsPageComponent(routerSpy);
    });

    it('should initialize with default values when no state is provided', () => {
        routerSpy.getCurrentNavigation.and.returnValue(null);

        component = new StatsPageComponent(routerSpy);

        expect(component.winnersNames).toEqual(['Unknown']);
        expect(component.lobbyId).toBe('');
        expect(component.timeSeconds).toBe(0);
        expect(component.timeMinutes).toBe(0);
        expect(component.timeHours).toBe(0);
        expect(component.coveredTilePercentage).toBe(0);
    });

    it('should initialize with provided state', () => {
        const mockState = {
            winner: 'Player1, Player2',
            lobbyId: '123',
            gameState: {
                board: [
                    [0, 0],
                    [0, 0],
                ],
                visitedTiles: [1, 2],
                startDate: '2023-01-01T00:00:00Z',
                endDate: '2023-01-01T01:00:00Z',
                players: [
                    { name: 'Player1', avatar: 'avatar1' },
                    { name: 'Player2', avatar: 'avatar2' },
                ],
            },
            currentPlayer: { name: 'Player1' } as Player,
        };

        routerSpy.getCurrentNavigation.and.returnValue({ extras: { state: mockState } } as unknown as Navigation);

        component = new StatsPageComponent(routerSpy);

        expect(component.lobbyId).toBe('123');
        expect(component.winnersNames).toEqual(['Player1', 'Player2']);
        expect(component.winnersAvatars).toEqual(['avatar1', 'avatar2']);
        expect(component.coveredTilePercentage).toBe(50);
        expect(component.timeHours).toBe(1);
        expect(component.timeMinutes).toBe(0);
        expect(component.timeSeconds).toBe(0);
    });

    it('should format duration correctly', () => {
        component.timeHours = 1;
        component.timeMinutes = 2;
        component.timeSeconds = 3;

        expect(component.formattedDuration).toBe('01:02:03');
    });

    it('should navigate to home on return()', () => {
        component.return();

        expect(routerSpy.navigate).toHaveBeenCalledWith([PageUrl.Home], { replaceUrl: true });
    });

    it('should track by name', () => {
        const name = 'Player1';
        expect(component.trackByName(0, name)).toBe(name);
    });

    it('should floor a number', () => {
        expect(component.floor(4.7)).toBe(4);
    });

    it('should sort table by column', () => {
        const mockPlayers = [{ name: 'PlayerB', fightCount: 2 } as Player, { name: 'PlayerA', fightCount: 5 } as Player];
        component.gameState = { players: mockPlayers } as GameState;

        component.sortTable('name');
        expect(component.gameState.players[0].name).toBe('PlayerA');

        component.sortTable('name');
        expect(component.gameState.players[0].name).toBe('PlayerB');

        component.sortTable('fightCount');
        expect(component.gameState.players[0].fightCount).toBe(2);
    });

    it('should return correct value for a column', () => {
        const player = { name: 'Player1', fightCount: 3 } as Player;

        expect(component['getValue'](player, 'name')).toBe('player1');
        expect(component['getValue'](player, 'fightCount')).toBe(3);
    });

    it('should parse date correctly', () => {
        const date = new Date();
        expect(component['parseDate'](date)).toBe(date);

        const dateString = '2023-01-01T00:00:00Z';
        expect(component['parseDate'](dateString)).toEqual(new Date(dateString));
    });
    it('should return correct value for various columns', () => {
        const player: Player = {
            name: 'Player1',
            fightCount: 5,
            fleeCount: 2,
            winCount: 3,
            loseCount: 1,
            damageReceived: 100,
            damageDealt: 150,
            itemsPicked: [2],
            visitedTiles: [
                { x: 1, y: 1 },
                { x: 2, y: 2 },
                { x: 3, y: 3 },
            ],
            pendingItem: 0,
            id: 'player1-id',
            avatar: 'default-avatar',
            isHost: false,
            life: 100,
            maxLife: 100,
            speed: 10,
            attack: 15,
            defense: 5,
        };

        expect(component['getValue'](player, 'name')).toBe('player1');
        expect(component['getValue'](player, 'fightCount')).toBe(5);
        expect(component['getValue'](player, 'fleeCount')).toBe(2);
        expect(component['getValue'](player, 'winCount')).toBe(3);
        expect(component['getValue'](player, 'loseCount')).toBe(1);
        expect(component['getValue'](player, 'damageReceived')).toBe(100);
        expect(component['getValue'](player, 'damageDealt')).toBe(150);
        expect(component['getValue'](player, 'itemsPicked')).toBe(player.itemsPicked?.length ?? 0);
        expect(component['getValue'](player, 'tilesVisited')).toBe(player.visitedTiles?.length ?? 0);
    });

    it('should return 0 for undefined or unknown columns', () => {
        const player: Player = {
            name: 'Player1',
            fightCount: 0,
            fleeCount: 0,
            winCount: 0,
            loseCount: 0,
            damageReceived: 0,
            damageDealt: 0,
            itemsPicked: [],
            visitedTiles: [],
            pendingItem: 0,
            id: 'default-id',
            avatar: 'default-avatar',
            isHost: false,
            life: 100,
            maxLife: 100,
            speed: 10,
            attack: 10,
            defense: 10,
        };

        expect(component['getValue'](player, 'fightCount')).toBe(0);
        expect(component['getValue'](player, 'unknownColumn')).toBe(0);
    });
    it('should sort table by different columns in ascending and descending order', () => {
        const mockPlayers = [
            { name: 'PlayerA', winCount: 2, damageDealt: 100 } as Player,
            { name: 'PlayerB', winCount: 5, damageDealt: 50 } as Player,
        ];
        component.gameState = { players: [...mockPlayers] } as GameState;

        // Sort by winCount ascending
        component.sortTable('winCount');
        expect(component.sortDirection).toBe('asc');
        expect(component.sortColumn).toBe('winCount');
        expect(component.gameState.players[0].name).toBe('PlayerA');
        expect(component.gameState.players[1].name).toBe('PlayerB');

        // Sort by winCount descending
        component.sortTable('winCount');
        expect(component.sortDirection).toBe('desc');
        expect(component.sortColumn).toBe('winCount');
        expect(component.gameState.players[0].name).toBe('PlayerB');
        expect(component.gameState.players[1].name).toBe('PlayerA');

        // Sort by damageDealt ascending (new column)
        component.sortTable('damageDealt');
        expect(component.sortDirection).toBe('asc');
        expect(component.sortColumn).toBe('damageDealt');
        expect(component.gameState.players[0].name).toBe('PlayerB');
        expect(component.gameState.players[1].name).toBe('PlayerA');
    });

    it('should handle sorting with undefined values', () => {
        const mockPlayers = [
            { name: 'PlayerA', fleeCount: undefined, itemsPicked: undefined } as unknown as Player,
            { name: 'PlayerB', fleeCount: 3, itemsPicked: [1, 2] } as Player,
        ];
        component.gameState = { players: [...mockPlayers] } as GameState;

        // Sort by fleeCount
        component.sortTable('fleeCount');
        expect(component.gameState.players[0].name).toBe('PlayerA');
        expect(component.gameState.players[1].name).toBe('PlayerB');

        // Sort by itemsPicked (length)
        component.sortTable('itemsPicked');
        expect(component.gameState.players[0].name).toBe('PlayerA');
        expect(component.gameState.players[1].name).toBe('PlayerB');
    });

    it('should handle empty player array when sorting', () => {
        component.gameState = { players: [] } as Partial<GameState> as GameState;

        expect(() => component.sortTable('name')).not.toThrow();
        expect(component.sortDirection).toBe('asc');
        expect(component.sortColumn).toBe('name');
    });

    it('should sort by tilesVisited property', () => {
        const mockPlayers = [
            {
                name: 'PlayerA',
                visitedTiles: [
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ],
            } as Player,
            {
                name: 'PlayerB',
                visitedTiles: [
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                    { x: 3, y: 3 },
                ],
            } as Player,
        ];
        component.gameState = { players: [...mockPlayers] } as GameState;

        component.sortTable('tilesVisited');
        expect(component.gameState.players[0].name).toBe('PlayerA');
        expect(component.gameState.players[1].name).toBe('PlayerB');

        component.sortTable('tilesVisited');
        expect(component.gameState.players[0].name).toBe('PlayerB');
        expect(component.gameState.players[1].name).toBe('PlayerA');
    });
});
