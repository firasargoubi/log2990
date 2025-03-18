/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-empty-function */
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { of, throwError } from 'rxjs';
import { ActionService } from './action.service';
import { ActionRequestContext, GameInteractionService } from './game-interaction.service';
import { LobbyService } from './lobby.service';
import { NotificationService } from './notification.service';

describe('GameInteractionService', () => {
    let service: GameInteractionService;
    let actionServiceSpy: jasmine.SpyObj<ActionService>;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;
    let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

    beforeEach(() => {
        actionServiceSpy = jasmine.createSpyObj('ActionService', ['getActionType', 'findOpponent']);
        lobbyServiceSpy = jasmine.createSpyObj('LobbyService', ['initializeBattle', 'onInteraction', 'executeAction']);
        notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showError', 'showInfo']);

        service = new GameInteractionService();
    });

    it('should not proceed if gameState or currentPlayer is missing or not matching', () => {
        const context: ActionRequestContext = {
            gameState: null,
            currentPlayer: undefined,
            tile: {
                type: 0,
                x: 0,
                y: 0,
                id: '',
                object: 0,
            },
            lobbyId: '1',
            handleAction: jasmine.createSpy(),
            updateBoard: jasmine.createSpy(),
            updateOpponent: jasmine.createSpy(),
            updateCombatState: jasmine.createSpy(),
            actionService: actionServiceSpy,
            lobbyService: lobbyServiceSpy,
            notificationService: notificationServiceSpy,
        };

        service.performActionRequest(context);
        expect(context.handleAction).not.toHaveBeenCalled();
    });

    it('should perform an action without battle', () => {
        const mockTile = {} as Tile;
        const mockGameState: GameState = {
            id: '1',
            board: [],
            turnCounter: 0,
            players: [],
            currentPlayer: 'p1',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 3,
            currentPlayerActionPoints: 1,
            debug: false,
        };
        const mockPlayer: Player = { id: 'p1', name: 'Test', life: 100, maxLife: 100, speed: 3 } as Player;

        actionServiceSpy.getActionType.and.returnValue('move');
        lobbyServiceSpy.executeAction.and.returnValue(
            of({
                newGameBoard: [
                    [1, 2],
                    [3, 4],
                ],
            }),
        );

        const updateBoardSpy = jasmine.createSpy('updateBoard');

        service.performActionRequest({
            gameState: mockGameState,
            currentPlayer: mockPlayer,
            tile: mockTile,
            lobbyId: '1',
            handleAction: () => {},
            updateBoard: updateBoardSpy,
            updateOpponent: () => {},
            updateCombatState: () => {},
            actionService: actionServiceSpy,
            lobbyService: lobbyServiceSpy,
            notificationService: notificationServiceSpy,
        });

        expect(actionServiceSpy.getActionType).toHaveBeenCalled();
        expect(updateBoardSpy).toHaveBeenCalled();
    });

    it('should handle battle action and set opponent', () => {
        const mockOpponent: Player = { id: 'op1', name: 'Opponent', life: 100, maxLife: 100, speed: 2 } as Player;
        const mockGameState: GameState = {
            id: '1',
            board: [],
            turnCounter: 0,
            players: [],
            currentPlayer: 'p1',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 3,
            currentPlayerActionPoints: 1,
            debug: false,
        };
        const mockPlayer: Player = { id: 'p1', name: 'Test', life: 100, maxLife: 100, speed: 3 } as Player;
        actionServiceSpy.getActionType.and.returnValue('battle');
        actionServiceSpy.findOpponent.and.returnValue(mockOpponent);
        lobbyServiceSpy.onInteraction.and.returnValue(of({ isInCombat: true }));
        lobbyServiceSpy.executeAction.and.returnValue(of({ newGameBoard: [] }));

        const updateOpponentSpy = jasmine.createSpy('updateOpponent');
        const updateCombatStateSpy = jasmine.createSpy('updateCombatState');

        service.performActionRequest({
            gameState: mockGameState,
            currentPlayer: mockPlayer,
            tile: {} as Tile,
            lobbyId: '1',
            handleAction: () => {},
            updateBoard: () => {},
            updateOpponent: updateOpponentSpy,
            updateCombatState: updateCombatStateSpy,
            actionService: actionServiceSpy,
            lobbyService: lobbyServiceSpy,
            notificationService: notificationServiceSpy,
        });

        expect(updateOpponentSpy).toHaveBeenCalledWith(mockOpponent);
        expect(updateCombatStateSpy).toHaveBeenCalledWith(true);
    });

    it('should show error on executeAction failure', () => {
        const mockGameState: GameState = {
            id: '1',
            board: [],
            turnCounter: 0,
            players: [],
            currentPlayer: 'p1',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
            spawnPoints: [],
            currentPlayerMovementPoints: 3,
            currentPlayerActionPoints: 1,
            debug: false,
        };
        const mockPlayer: Player = { id: 'p1', name: 'Test', life: 100, maxLife: 100, speed: 3 } as Player;
        actionServiceSpy.getActionType.and.returnValue('move');
        lobbyServiceSpy.executeAction.and.returnValue(throwError(() => new Error('error')));

        service.performActionRequest({
            gameState: mockGameState,
            currentPlayer: mockPlayer,
            tile: {} as Tile,
            lobbyId: '1',
            handleAction: () => {},
            updateBoard: () => {},
            updateOpponent: () => {},
            updateCombatState: () => {},
            actionService: actionServiceSpy,
            lobbyService: lobbyServiceSpy,
            notificationService: notificationServiceSpy,
        });

        expect(notificationServiceSpy.showError).toHaveBeenCalled();
    });

    it('handleAction should toggle state', () => {
        expect(service.handleAction(true)).toBeFalse();
        expect(service.handleAction(false)).toBeTrue();
    });
});
