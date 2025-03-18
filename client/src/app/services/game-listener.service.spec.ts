import { Router } from '@angular/router';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Player } from '@common/player';
import { of } from 'rxjs';
import { GameListenerContext, GameListenerService } from './game-listener.service';
import { LobbyService } from './lobby.service';

describe('GameListenerService', () => {
    let service: GameListenerService;
    let lobbyServiceSpy: jasmine.SpyObj<LobbyService>;
    let routerSpy: jasmine.SpyObj<Router>;

    const mockGameState: GameState = {
        id: '1',
        board: [[0]],
        players: [],
        currentPlayer: 'player1',
        turnCounter: 0,
        availableMoves: [],
        shortestMoves: [],
        playerPositions: [],
        spawnPoints: [],
        currentPlayerMovementPoints: 3,
        currentPlayerActionPoints: 1,
    };

    const mockLobby: GameLobby = {
        id: '1',
        players: [],
        gameId: '1',
        isLocked: false,
        maxPlayers: 0,
    };

    const mockPlayer: Player = { id: 'player1', name: 'John' } as Player;

    let context: GameListenerContext;

    beforeEach(() => {
        lobbyServiceSpy = jasmine.createSpyObj('LobbyService', [
            'onGameStarted',
            'onTurnStarted',
            'onTurnEnded',
            'onMovementProcessed',
            'onError',
            'onLobbyUpdated',
            'onBoardChanged',
            'onFleeSuccess',
            'onAttackEnd',
            'disconnectFromRoom',
            'getCurrentPlayer',
            'updatePlayers',
            'updateCombatStatus',
        ]);

        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        service = new GameListenerService(lobbyServiceSpy, routerSpy);

        context = {
            lobbyId: '1',
            currentPlayer: mockPlayer,
            gameState: mockGameState,
            lobby: mockLobby,
            updateState: jasmine.createSpy('updateState'),
            updateLobby: jasmine.createSpy('updateLobby'),
            setCurrentPlayer: jasmine.createSpy('setCurrentPlayer'),
            onPlayerRemoved: jasmine.createSpy('onPlayerRemoved'),
            onPlayerTurn: jasmine.createSpy('onPlayerTurn'),
            onCombatStateChange: jasmine.createSpy('onCombatStateChange'),
            showInfo: jasmine.createSpy('showInfo'),
            showError: jasmine.createSpy('showError'),
            showSuccess: jasmine.createSpy('showSuccess'),
        };
    });

    it('should handle game start and set current player', () => {
        lobbyServiceSpy.onGameStarted.and.returnValue(of({ gameState: mockGameState }));
        lobbyServiceSpy.getCurrentPlayer.and.returnValue(mockPlayer);

        const subs = service.setupListeners(context);
        expect(context.updateState).toHaveBeenCalledWith(mockGameState);
        expect(context.setCurrentPlayer).toHaveBeenCalledWith(mockPlayer);
        subs.forEach((sub) => sub.unsubscribe());
    });

    it('should handle turn started and call onPlayerTurn', () => {
        lobbyServiceSpy.onGameStarted.and.returnValue(of({ gameState: mockGameState }));
        lobbyServiceSpy.getCurrentPlayer.and.returnValue(mockPlayer);

        const subs = service.setupListeners(context);
        expect(context.updateState).toHaveBeenCalledWith(mockGameState);
        expect(context.setCurrentPlayer).toHaveBeenCalledWith(mockPlayer);
        expect(context.onPlayerTurn).toHaveBeenCalledWith('player1');
        subs.forEach((sub) => sub.unsubscribe());
    });

    it('should handle error event', () => {
        lobbyServiceSpy.onError.and.returnValue(of('Error occurred'));

        service.setupListeners(context);
        expect(context.showError).toHaveBeenCalledWith('Error occurred');
    });

    it('should handle lobby updated and player still present', () => {
        const updatedLobby = { ...mockLobby, players: [mockPlayer] };
        lobbyServiceSpy.onLobbyUpdated.and.returnValue(of({ lobby: updatedLobby }));

        service.setupListeners(context);
        expect(context.updateLobby).toHaveBeenCalledWith(updatedLobby);
        expect(lobbyServiceSpy.updatePlayers).toHaveBeenCalledWith('1', updatedLobby.players);
    });

    it('should handle lobby updated and player removed', () => {
        const updatedLobby = { ...mockLobby, players: [] };
        lobbyServiceSpy.onLobbyUpdated.and.returnValue(of({ lobby: updatedLobby }));

        service.setupListeners(context);
        expect(context.updateLobby).toHaveBeenCalledWith(updatedLobby);
        expect(context.onPlayerRemoved).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
    });

    it('should handle flee success', () => {
        lobbyServiceSpy.onFleeSuccess.and.returnValue(of({ fleeingPlayer: mockPlayer }));

        service.setupListeners(context);
        expect(context.onCombatStateChange).toHaveBeenCalledWith(false);
        expect(lobbyServiceSpy.updateCombatStatus).toHaveBeenCalledWith(false);
        expect(context.showInfo).toHaveBeenCalledWith('Vous avez fui le combat.');
    });

    it('should handle attack end', () => {
        lobbyServiceSpy.onAttackEnd.and.returnValue(of({ isInCombat: false }));

        service.setupListeners(context);
        expect(context.onCombatStateChange).toHaveBeenCalledWith(false);
        expect(lobbyServiceSpy.updateCombatStatus).toHaveBeenCalledWith(false);
        expect(context.showInfo).toHaveBeenCalledWith(`${mockPlayer.name} a fini son combat.`);
    });
});
