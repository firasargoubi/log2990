/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';
import { SocketTestHelper } from './lobby-test-helper';
import { LobbyService } from './lobby.service';
import { Player } from '@common/player';
import { Game, TileTypes } from '@common/game.interface';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Coordinates } from '@common/coordinates';
import { Tile } from '@common/tile';

describe('LobbyService', () => {
    let service: LobbyService;
    let socketHelper: SocketTestHelper;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        socketHelper = new SocketTestHelper();
        service = TestBed.inject(LobbyService);
        service['socket'] = socketHelper as unknown as Socket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get socket id', () => {
        expect(service.getSocketId()).toBe('test-socket-id');
    });

    it('should set and get current player', () => {
        const player: Player = { name: 'TestPlayer', id: '123' } as Player;
        service.setCurrentPlayer(player);
        expect(service.getCurrentPlayer()).toEqual(player);
    });

    it('should disconnect socket', () => {
        const spy = spyOn(service['socket'], 'disconnect');
        service.disconnect();
        expect(spy).toHaveBeenCalled();
    });

    it('should reconnect when socket is not connected', () => {
        socketHelper.connected = false;
        const spy = spyOn(service['socket'], 'connect');
        service.reconnect();
        expect(spy).toHaveBeenCalled();
    });

    it('should not reconnect when socket is already connected', () => {
        socketHelper.connected = true;
        const spy = spyOn(service['socket'], 'connect');
        service.reconnect();
        expect(spy).not.toHaveBeenCalled();
    });

    it('should emit createLobby with game data', () => {
        const game: Game = { id: 'game1', name: 'TestGame' } as Game;
        const spy = spyOn(service['socket'], 'emit');
        service.createLobby(game);
        expect(spy).toHaveBeenCalledWith('createLobby', game);
    });

    it('should listen for lobbyCreated event', () => {
        const mockLobby: GameLobby = { id: 'lobby1', players: [], isLocked: false, maxPlayers: 1, gameId: '1234' } as GameLobby;
        const data = { lobby: mockLobby };
        let result: any;

        service.onLobbyCreated().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('lobbyCreated', data);
        expect(result).toEqual(data);
    });

    it('should emit joinLobby with lobbyId and player', () => {
        const lobbyId = 'lobby123';
        const player: Player = { name: 'TestPlayer', id: '123' } as Player;
        const spy = spyOn(service['socket'], 'emit');
        service.joinLobby(lobbyId, player);
        expect(spy).toHaveBeenCalledWith('joinLobby', { lobbyId, player });
    });

    it('should emit leaveLobby with lobbyId and playerName', () => {
        const lobbyId = 'lobby123';
        const playerName = 'TestPlayer';
        const spy = spyOn(service['socket'], 'emit');
        service.leaveLobby(lobbyId, playerName);
        expect(spy).toHaveBeenCalledWith('leaveLobby', { lobbyId, playerName });
    });

    it('should emit leaveGame with lobbyId and playerName', () => {
        const lobbyId = 'lobby123';
        const playerName = 'TestPlayer';
        const spy = spyOn(service['socket'], 'emit');
        service.leaveGame(lobbyId, playerName);
        expect(spy).toHaveBeenCalledWith('leaveGame', lobbyId, playerName);
    });

    it('should emit lockLobby with lobbyId', () => {
        const lobbyId = 'lobby123';
        const spy = spyOn(service['socket'], 'emit');
        service.lockLobby(lobbyId);
        expect(spy).toHaveBeenCalledWith('lockLobby', lobbyId);
    });

    it('should emit disconnectFromRoom with lobbyId', () => {
        const lobbyId = 'lobby123';
        const spy = spyOn(service['socket'], 'emit');
        service.disconnectFromRoom(lobbyId);
        expect(spy).toHaveBeenCalledWith('disconnectFromRoom', lobbyId);
    });

    it('should emit updatePlayers with lobbyId and players', () => {
        const lobbyId = 'lobby123';
        const players: Player[] = [{ name: 'Player1', id: '1' } as Player, { name: 'Player2', id: '2' } as Player];
        const spy = spyOn(service['socket'], 'emit');
        service.updatePlayers(lobbyId, players);
        expect(spy).toHaveBeenCalledWith('updatePlayers', lobbyId, players);
    });

    it('should listen for lobbyLocked event', () => {
        const data = { lobbyId: 'lobby123' };
        let result: any;

        service.onLobbyLocked().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('lobbyLocked', data);
        expect(result).toEqual(data);
    });

    it('should emit requestStart with lobbyId', () => {
        const lobbyId = 'lobby123';
        const spy = spyOn(service['socket'], 'emit');
        service.requestStartGame(lobbyId);
        expect(spy).toHaveBeenCalledWith('requestStart', lobbyId);
    });

    it('should listen for gameStarted event', () => {
        const mockGameState: GameState = {} as GameState;
        const data = { gameState: mockGameState };
        let result: any;

        service.onGameStarted().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('gameStarted', data);
        expect(result).toEqual(data);
    });

    it('should listen for turnStarted event', () => {
        const mockGameState: GameState = {} as GameState;
        const data = {
            gameState: mockGameState,
            currentPlayer: 'player1',
            availableMoves: [{ x: 1, y: 1 }],
        };
        let result: any;

        service.onTurnStarted().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('turnStarted', data);
        expect(result).toEqual(data);
    });

    it('should emit requestMovement with lobbyId and coordinates', () => {
        const lobbyId = 'lobby123';
        const coordinates: Coordinates[] = [{ x: 1, y: 1 }];
        const spy = spyOn(service['socket'], 'emit');
        service.requestMovement(lobbyId, coordinates);
        expect(spy).toHaveBeenCalledWith('requestMovement', { lobbyId, coordinates });
    });

    it('should emit requestTeleport with lobbyId and coordinates', () => {
        const lobbyId = 'lobby123';
        const coordinates: Coordinates = { x: 1, y: 1 };
        const spy = spyOn(service['socket'], 'emit');
        service.requestTeleport(lobbyId, coordinates);
        expect(spy).toHaveBeenCalledWith('teleport', { lobbyId, coordinates });
    });

    it('should handle movementProcessed event and initialize availableMoves if missing', () => {
        const mockGameState: GameState = {} as GameState;
        const data = {
            gameState: mockGameState,
            playerMoved: 'player1',
            newPosition: { x: 2, y: 2 },
        };
        let result: any;

        service.onMovementProcessed().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('movementProcessed', data);
        expect(result.gameState.availableMoves).toEqual([]);
        expect(result.playerMoved).toEqual('player1');
        expect(result.newPosition).toEqual({ x: 2, y: 2 });
    });

    it('should emit requestEndTurn with lobbyId', () => {
        const lobbyId = 'lobby123';
        const spy = spyOn(service['socket'], 'emit');
        service.requestEndTurn(lobbyId);
        expect(spy).toHaveBeenCalledWith('endTurn', { lobbyId });
    });

    it('should listen for boardChanged event', () => {
        const mockGameState: GameState = {} as GameState;
        const data = { gameState: mockGameState };
        let result: any;

        service.onBoardChanged().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('boardModified', data);
        expect(result).toEqual(data);
    });

    it('should listen for error event', () => {
        const errorMessage = 'Test error';
        let result: any;

        service.onError().subscribe((error) => {
            result = error;
        });

        socketHelper.peerSideEmit('error', errorMessage);
        expect(result).toEqual(errorMessage);
    });

    it('should emit setDebug with lobbyId and debug flag', () => {
        const lobbyId = 'lobby123';
        const debug = true;
        const spy = spyOn(service['socket'], 'emit');
        service.setDebug(lobbyId, debug);
        expect(spy).toHaveBeenCalledWith('setDebug', { lobbyId, debug });
    });

    it('should emit handleDefeat with player and lobbyId', () => {
        const lobbyId = 'lobby123';
        const player: Player = { name: 'TestPlayer', id: '123' } as Player;
        const spy = spyOn(service['socket'], 'emit');
        service.handleDefeat(player, lobbyId);
        expect(spy).toHaveBeenCalledWith('playerDefeated', { player, lobbyId });
    });

    it('should emit attack with lobbyId, attacker and defender', () => {
        const lobbyId = 'lobby123';
        const attacker: Player = { name: 'Attacker', id: '1' } as Player;
        const defender: Player = { name: 'Defender', id: '2' } as Player;
        const spy = spyOn(service['socket'], 'emit');
        service.attack(lobbyId, attacker, defender);
        expect(spy).toHaveBeenCalledWith('attack', { lobbyId, attacker, defender });
    });

    it('should emit flee with lobbyId and player', () => {
        const lobbyId = 'lobby123';
        const player: Player = { name: 'TestPlayer', id: '123' } as Player;
        const spy = spyOn(service['socket'], 'emit');
        service.flee(lobbyId, player);
        expect(spy).toHaveBeenCalledWith('flee', { lobbyId, player });
    });

    it('should listen for attackResult event', () => {
        const player1: Player = { name: 'Player1', id: '1' } as Player;
        const player2: Player = { name: 'Player2', id: '2' } as Player;
        const data = {
            attackDice: 6,
            defenseDice: 6,
            attackRoll: 4,
            defenseRoll: 2,
            attackerHP: 10,
            defenderHP: 8,
            damage: 2,
            attacker: player1,
            defender: player2,
        };
        let result: any;

        service.onAttackResult().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('attackResult', data);
        expect(result).toEqual(data);
    });

    it('should emit startCombat with lobbyId, currentPlayer and opponent', () => {
        const lobbyId = 'lobby123';
        const currentPlayer: Player = { name: 'Player1', id: '1' } as Player;
        const opponent: Player = { name: 'Player2', id: '2' } as Player;
        const spy = spyOn(service['socket'], 'emit');
        service.startCombat(lobbyId, currentPlayer, opponent);
        expect(spy).toHaveBeenCalledWith('startBattle', { lobbyId, currentPlayer, opponent });
    });

    it('should listen for startCombat event', () => {
        const player: Player = { name: 'Player1', id: '1' } as Player;
        const data = { firstPlayer: player };
        let result: any;

        service.onStartCombat().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('startCombat', data);
        expect(result).toEqual(data);
    });

    it('should listen for combatEnded event', () => {
        const player: Player = { name: 'Player1', id: '1' } as Player;
        const data = { loser: player };
        let result: any;

        service.onCombatEnded().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('combatEnded', data);
        expect(result).toEqual(data);
    });

    it('should listen for gameOver event', () => {
        const data = { winner: 'Player1' };
        let result: any;

        service.onGameOver().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('gameOver', data);
        expect(result).toEqual(data);
    });

    it('should listen for fleeSuccess event', () => {
        const player: Player = { name: 'Player1', id: '1' } as Player;
        const data = { fleeingPlayer: player };
        let result: any;

        service.onFleeSuccess().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('fleeSuccess', data);
        expect(result).toEqual(data);
    });

    it('should listen for fleeFailure event', () => {
        const player: Player = { name: 'Player1', id: '1' } as Player;
        const data = { fleeingPlayer: player };
        let result: any;

        service.onFleeFailure().subscribe((response) => {
            result = response;
        });

        socketHelper.peerSideEmit('fleeFailure', data);
        expect(result).toEqual(data);
    });

    it('should emit openDoor with lobbyId and tile', () => {
        const lobbyId = 'lobby123';
        const tile: Tile = { id: 'abc', x: 1, y: 1, type: TileTypes.DoorClosed, object: 0 } as Tile;
        const spy = spyOn(service['socket'], 'emit');
        service.openDoor(lobbyId, tile);
        expect(spy).toHaveBeenCalledWith('openDoor', { lobbyId, tile });
    });

    it('should emit closeDoor with lobbyId and tile', () => {
        const lobbyId = 'lobby123';
        const tile: Tile = { id: 'abc', x: 1, y: 1, type: TileTypes.DoorOpen, object: 0 } as Tile;
        const spy = spyOn(service['socket'], 'emit');
        service.closeDoor(lobbyId, tile);
        expect(spy).toHaveBeenCalledWith('closeDoor', { lobbyId, tile });
    });
});
