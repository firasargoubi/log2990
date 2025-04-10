/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { TestBed } from '@angular/core/testing';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { Tile } from '@common/tile';
import { take } from 'rxjs/operators';
import { LobbyService } from './lobby.service';

describe('LobbyService', () => {
    let service: LobbyService;
    let socketMock: any;

    beforeEach(() => {
        socketMock = {
            id: 'socket-id-123',
            connected: true,
            emit: jasmine.createSpy('emit'),
            on: jasmine.createSpy('on'),
            disconnect: jasmine.createSpy('disconnect'),
            connect: jasmine.createSpy('connect'),
        };

        (window as any).io = jasmine.createSpy('io').and.returnValue(socketMock);

        TestBed.configureTestingModule({
            providers: [LobbyService],
        });

        service = TestBed.inject(LobbyService);
        (service as any).socket = socketMock;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Player management', () => {
        it('should set and get current player', () => {
            const testPlayer: Player = {
                id: 'player1',
                name: 'Player One',
                isHost: true,
            } as Player;

            service.setCurrentPlayer(testPlayer);

            expect(service.getCurrentPlayer()).toEqual(testPlayer);
        });

        it('should return socket id', () => {
            expect(service.getSocketId()).toEqual('socket-id-123');
        });

        it('should handle socket id when undefined', () => {
            socketMock.id = undefined;
            expect(service.getSocketId()).toEqual('');
        });
    });

    describe('Socket connection management', () => {
        it('should disconnect socket', () => {
            service.disconnect();
            expect(socketMock.disconnect).toHaveBeenCalled();
        });

        it('should reconnect when socket is disconnected', () => {
            socketMock.connected = false;
            service.reconnect();
            expect(socketMock.connect).toHaveBeenCalled();
        });

        it('should not reconnect when socket is already connected', () => {
            socketMock.connected = true;
            service.reconnect();
            expect(socketMock.connect).not.toHaveBeenCalled();
        });
    });

    describe('Lobby management', () => {
        it('should create lobby', () => {
            const testGame: Game = { id: 'game1', name: 'Test Game' } as Game;
            service.createLobby(testGame);
            expect(socketMock.emit).toHaveBeenCalledWith('createLobby', testGame);
        });

        it('should join lobby', () => {
            const testPlayer: Player = { id: 'player1', name: 'Test Player' } as Player;
            service.joinLobby('lobby1', testPlayer);
            expect(socketMock.emit).toHaveBeenCalledWith('joinLobby', { lobbyId: 'lobby1', player: testPlayer });
        });

        it('should leave lobby', () => {
            service.leaveLobby('lobby1', 'Test Player');
            expect(socketMock.emit).toHaveBeenCalledWith('leaveLobby', { lobbyId: 'lobby1', playerName: 'Test Player' });
        });

        it('should leave game', () => {
            service.leaveGame('lobby1', 'Test Player');
            expect(socketMock.emit).toHaveBeenCalledWith('leaveGame', 'lobby1', 'Test Player');
        });

        it('should lock lobby', () => {
            service.lockLobby('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('lockLobby', 'lobby1');
        });

        it('should disconnect from room', () => {
            service.disconnectFromRoom('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('disconnectFromRoom', 'lobby1');
        });

        it('should update players', () => {
            const players: Player[] = [{ id: 'player1', name: 'Player 1' } as Player];
            service.updatePlayers('lobby1', players);
            expect(socketMock.emit).toHaveBeenCalledWith('updatePlayers', 'lobby1', players);
        });

        it('should get lobby', (done) => {
            const testLobby: GameLobby = { id: 'lobby1' } as GameLobby;

            socketMock.emit.and.callFake((event: string, lobbyId: string, callback: Function) => {
                if (event === 'getLobby') {
                    callback(testLobby);
                }
            });

            service
                .getLobby('lobby1')
                .pipe(take(1))
                .subscribe((lobby) => {
                    expect(lobby).toEqual(testLobby);
                    done();
                });

            expect(socketMock.emit).toHaveBeenCalledWith('getLobby', 'lobby1', jasmine.any(Function));
        });

        it('should get game ID', (done) => {
            socketMock.emit.and.callFake((event: string, lobbyId: string, callback: Function) => {
                if (event === 'getGameId') {
                    callback('game1');
                }
            });

            service
                .getGameId('lobby1')
                .pipe(take(1))
                .subscribe((gameId) => {
                    expect(gameId).toEqual('game1');
                    done();
                });

            expect(socketMock.emit).toHaveBeenCalledWith('getGameId', 'lobby1', jasmine.any(Function));
        });
    });

    describe('Game management', () => {
        it('should request start game', () => {
            service.requestStartGame('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('requestStart', 'lobby1');
        });

        it('should request movement', () => {
            const coordinates: Coordinates[] = [{ x: 1, y: 1 }];
            service.requestMovement('lobby1', coordinates);
            expect(socketMock.emit).toHaveBeenCalledWith('requestMovement', { lobbyId: 'lobby1', coordinates });
        });

        it('should request teleport', () => {
            const coordinate: Coordinates = { x: 2, y: 3 };
            service.requestTeleport('lobby1', coordinate);
            expect(socketMock.emit).toHaveBeenCalledWith('teleport', { lobbyId: 'lobby1', coordinates: coordinate });
        });

        it('should request end turn', () => {
            service.requestEndTurn('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('endTurn', { lobbyId: 'lobby1' });
        });

        it('should set debug', () => {
            service.setDebug('lobby1', true);
            expect(socketMock.emit).toHaveBeenCalledWith('setDebug', { lobbyId: 'lobby1', debug: true });
        });
    });

    describe('Combat management', () => {
        it('should handle defeat', () => {
            const player: Player = { id: 'player1', name: 'Player 1' } as Player;
            service.handleDefeat(player, 'lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('playerDefeated', { player, lobbyId: 'lobby1' });
        });

        it('should attack', () => {
            const attacker: Player = { id: 'player1', name: 'Attacker' } as Player;
            const defender: Player = { id: 'player2', name: 'Defender' } as Player;
            service.attack('lobby1', attacker, defender);
            expect(socketMock.emit).toHaveBeenCalledWith('attack', { lobbyId: 'lobby1', attacker, defender });
        });

        it('should flee', () => {
            const player: Player = { id: 'player1', name: 'Runner' } as Player;
            const player2: Player = { id: 'player2', name: 'Chaser' } as Player;
            service.flee('lobby1', player, player2);
            expect(socketMock.emit).toHaveBeenCalledWith('flee', { lobbyId: 'lobby1', player, opponent: player2 });
        });

        it('should start combat', () => {
            const currentPlayer: Player = { id: 'player1', name: 'Current' } as Player;
            const opponent: Player = { id: 'player2', name: 'Opponent' } as Player;
            service.startCombat('lobby1', currentPlayer, opponent);
            expect(socketMock.emit).toHaveBeenCalledWith('startBattle', {
                lobbyId: 'lobby1',
                currentPlayer,
                opponent,
            });
        });
    });

    describe('Door management', () => {
        it('should open door', () => {
            const tile: Tile = { x: 1, y: 2, type: 1 } as Tile;
            service.openDoor('lobby1', tile);
            expect(socketMock.emit).toHaveBeenCalledWith('openDoor', { lobbyId: 'lobby1', tile });
        });

        it('should close door', () => {
            const tile: Tile = { x: 1, y: 2, type: 1 } as Tile;
            service.closeDoor('lobby1', tile);
            expect(socketMock.emit).toHaveBeenCalledWith('closeDoor', { lobbyId: 'lobby1', tile });
        });
    });

    describe('Verification methods', () => {
        it('should verify room', (done) => {
            const response = { exists: true, isLocked: false };

            socketMock.emit.and.callFake((event: string, data: any, callback: Function) => {
                if (event === 'verifyRoom') {
                    callback(response);
                }
            });

            service
                .verifyRoom('game1')
                .pipe(take(1))
                .subscribe((result) => {
                    expect(result).toEqual(response);
                    done();
                });

            expect(socketMock.emit).toHaveBeenCalledWith('verifyRoom', { gameId: 'game1' }, jasmine.any(Function));
        });

        it('should verify avatars', (done) => {
            const response = { avatars: ['avatar1', 'avatar2'] };

            socketMock.emit.and.callFake((event: string, data: any, callback: Function) => {
                if (event === 'verifyAvatars') {
                    callback(response);
                }
            });

            service
                .verifyAvatars('lobby1')
                .pipe(take(1))
                .subscribe((result) => {
                    expect(result).toEqual(response);
                    done();
                });

            expect(socketMock.emit).toHaveBeenCalledWith('verifyAvatars', { lobbyId: 'lobby1' }, jasmine.any(Function));
        });

        it('should verify username', (done) => {
            const response = { usernames: ['user1', 'user2'] };

            socketMock.emit.and.callFake((event: string, data: any, callback: Function) => {
                if (event === 'verifyUsername') {
                    callback(response);
                }
            });

            service
                .verifyUsername('lobby1')
                .pipe(take(1))
                .subscribe((result) => {
                    expect(result).toEqual(response);
                    done();
                });

            expect(socketMock.emit).toHaveBeenCalledWith('verifyUsername', { lobbyId: 'lobby1' }, jasmine.any(Function));
        });
    });

    describe('Socket event subscriptions', () => {
        it('should handle onLobbyCreated event', (done) => {
            const testData = { lobby: { id: 'lobby1' } as GameLobby };

            service
                .onLobbyCreated()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callArgs = socketMock.on.calls.allArgs().find((args: any[]) => args[0] === 'lobbyCreated');
            if (callArgs) {
                const onLobbyCreatedCallback = callArgs[1];
                onLobbyCreatedCallback(testData);
            }
        });

        it('should handle onLobbyLocked event', (done) => {
            const testData = { lobbyId: 'lobby1' };

            service
                .onLobbyLocked()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('lobbyLocked');
            callback(testData);
        });

        it('should handle onGameStarted event', (done) => {
            const testData = { gameState: { id: 'game1' } as GameState };

            service
                .onGameStarted()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('gameStarted');
            callback(testData);
        });

        it('should handle onTurnStarted event', (done) => {
            const testData = {
                gameState: { id: 'game1' } as GameState,
                currentPlayer: 'player1',
                availableMoves: [{ x: 1, y: 1 }],
            };

            service
                .onTurnStarted()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('turnStarted');
            callback(testData);
        });

        it('should handle onMovementProcessed event with availableMoves', (done) => {
            const testData = {
                gameState: {
                    id: 'game1',
                    availableMoves: [{ x: 2, y: 2 }],
                    board: [],
                    turnCounter: 1,
                    players: [],
                    currentPlayer: 'player1',
                    deletedPlayers: [],
                    playerPositions: [],
                    spawnPoints: [],
                    currentPlayerMovementPoints: 0,
                    currentPlayerActionPoints: 0,
                    shortestMoves: [],
                    debug: false,
                    gameMode: 'default',
                } as GameState,
                playerMoved: 'player1',
                newPosition: { x: 1, y: 1 },
            };

            service
                .onMovementProcessed()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('movementProcessed');
            callback(testData);
        });

        it('should handle onMovementProcessed event without availableMoves', (done) => {
            const gameStateData: Partial<GameState> = {
                id: 'game1',
                board: [],
                turnCounter: 1,
                players: [],
                currentPlayer: 'player1',
                deletedPlayers: [],
                playerPositions: [],
                spawnPoints: [],
                currentPlayerMovementPoints: 0,
                currentPlayerActionPoints: 0,
            };

            const testData = {
                gameState: gameStateData as GameState,
                playerMoved: 'player1',
                newPosition: { x: 1, y: 1 },
            };

            (testData.gameState as any).availableMoves = undefined;

            service
                .onMovementProcessed()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data.gameState.availableMoves).toEqual([]);
                    done();
                });

            const callback = findSocketCallback('movementProcessed');
            callback(testData);
        });

        it('should handle onBoardChanged event', (done) => {
            const testData = { gameState: { id: 'game1' } as GameState };

            service
                .onBoardChanged()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('boardModified');
            callback(testData);
        });

        it('should handle onError event', (done) => {
            const errorMessage = 'Test error message';

            service
                .onError()
                .pipe(take(1))
                .subscribe((error) => {
                    expect(error).toEqual(errorMessage);
                    done();
                });

            const callback = findSocketCallback('error');
            callback(errorMessage);
        });

        it('should handle onLobbyUpdated event', (done) => {
            const testData = { lobby: { id: 'lobby1' } as GameLobby };

            service
                .onLobbyUpdated()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('lobbyUpdated');
            callback(testData);
        });

        it('should handle onHostDisconnected event', (done) => {
            service
                .onHostDisconnected()
                .pipe(take(1))
                .subscribe(() => {
                    done();
                });

            const callback = findSocketCallback('hostDisconnected');
            callback();
        });

        it('should handle onAttackResult event', (done) => {
            const testData = {
                attackDice: 5,
                defenseDice: 3,
                attackRoll: 8,
                defenseRoll: 5,
                attackerHP: 10,
                defenderHP: 7,
                damage: 3,
                attacker: { id: 'player1' } as Player,
                defender: { id: 'player2' } as Player,
            };

            service
                .onAttackResult()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('attackResult');
            callback(testData);
        });

        it('should handle onStartCombat event', (done) => {
            const testData = { firstPlayer: { id: 'player1' } as Player };

            service
                .onStartCombat()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('startCombat');
            callback(testData);
        });

        it('should handle onCombatEnded event', (done) => {
            const testData = { loser: { id: 'player2' } as Player };

            service
                .onCombatEnded()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('combatEnded');
            callback(testData);
        });

        it('should handle onGameOver event', (done) => {
            const testData = { winner: 'Player 1' };

            service
                .onGameOver()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('gameOver');
            callback(testData);
        });

        it('should handle onFleeSuccess event', (done) => {
            const testData = { fleeingPlayer: { id: 'player1' } as Player };

            service
                .onFleeSuccess()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('fleeSuccess');
            callback(testData);
        });

        it('should handle onFleeFailure event', (done) => {
            const testData = { fleeingPlayer: { id: 'player1' } as Player };

            service
                .onFleeFailure()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('fleeFailure');
            callback(testData);
        });
    });
    describe('Team management', () => {
        it('should handle teamCreated event', (done) => {
            const testData = {
                team1Server: [] as Player[],
                team2Server: [] as Player[],
                updatedGameState: {} as GameState,
            };

            service
                .teamCreated()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('teamsCreated');
            callback(testData);
        });
    });
    describe('Team management', () => {
        it('should create teams', () => {
            const players: Player[] = [{ id: 'player1', name: 'Player 1' } as Player, { id: 'player2', name: 'Player 2' } as Player];

            service.createTeams('lobby1', players);

            expect(socketMock.emit).toHaveBeenCalledWith('createTeams', { lobbyId: 'lobby1', players });
        });
    });
    describe('Inventory management', () => {
        it('should handle inventoryFull event', (done) => {
            const MAX_INVENTORY_SIZE = 3;
            const MAX_ITEM_VALUE = 4;
            const testData = { item: 1, currentInventory: [2, MAX_INVENTORY_SIZE, MAX_ITEM_VALUE] };

            service
                .onInventoryFull()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('inventoryFull');
            callback(testData);
        });

        it('should resolve inventory', () => {
            service.resolveInventory('lobby1', [1, 2]);
            expect(socketMock.emit).toHaveBeenCalledWith('resolveInventory', { lobbyId: 'lobby1', keptItems: [1, 2] });
        });

        it('should cancel inventory choice', () => {
            service.cancelInventoryChoice('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('cancelInventoryChoice', { lobbyId: 'lobby1' });
        });
    });

    describe('Board management', () => {
        it('should handle boardModified event', (done) => {
            const testData = { board: [] };

            service
                .onBoardModified()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callback = findSocketCallback('boardModified');
            callback(testData);
        });
    });
    describe('Event Log subscription', () => {
        it('should emit event log data when eventLog is received', (done) => {
            const testData = {
                gameState: { id: 'game1' } as GameState,
                eventType: 'testEvent',
                involvedPlayers: ['player1', 'player2'],
                involvedPlayer: 'player1',
                description: 'Test description',
            };

            service
                .onEventLog()
                .pipe(take(1))
                .subscribe((data) => {
                    expect(data).toEqual(testData);
                    done();
                });

            const callbackArgs = socketMock.on.calls.allArgs().find((args: any[]) => args[0] === 'eventLog');
            if (callbackArgs) {
                const eventLogCallback = callbackArgs[1];
                eventLogCallback(testData);
            }
        });
    });

    function findSocketCallback(eventName: string): Function {
        if (!socketMock.on.calls) {
            socketMock.on = jasmine.createSpy('on');
        }

        switch (eventName) {
            case 'lobbyLocked':
                service.onLobbyLocked().pipe(take(1)).subscribe();
                break;
            case 'gameStarted':
                service.onGameStarted().pipe(take(1)).subscribe();
                break;
            case 'turnStarted':
                service.onTurnStarted().pipe(take(1)).subscribe();
                break;
            case 'movementProcessed':
                service.onMovementProcessed().pipe(take(1)).subscribe();
                break;
            case 'boardModified':
                service.onBoardChanged().pipe(take(1)).subscribe();
                break;
            case 'error':
                service.onError().pipe(take(1)).subscribe();
                break;
            case 'lobbyUpdated':
                service.onLobbyUpdated().pipe(take(1)).subscribe();
                break;
            case 'hostDisconnected':
                service.onHostDisconnected().pipe(take(1)).subscribe();
                break;
            case 'attackResult':
                service.onAttackResult().pipe(take(1)).subscribe();
                break;
            case 'startCombat':
                service.onStartCombat().pipe(take(1)).subscribe();
                break;
            case 'combatEnded':
                service.onCombatEnded().pipe(take(1)).subscribe();
                break;
            case 'gameOver':
                service.onGameOver().pipe(take(1)).subscribe();
                break;
            case 'fleeSuccess':
                service.onFleeSuccess().pipe(take(1)).subscribe();
                break;
            case 'fleeFailure':
                service.onFleeFailure().pipe(take(1)).subscribe();
                break;
            case 'teamsCreated':
                service.teamCreated().pipe(take(1)).subscribe();
                break;
            case 'inventoryFull':
                service.onInventoryFull().pipe(take(1)).subscribe();
                break;
            default:
                throw new Error(`Event '${eventName}' not handled in findSocketCallback`);
        }

        const args = socketMock.on.calls.allArgs().find((args: any[]) => args[0] === eventName);

        if (!args) {
            throw new Error(`Event '${eventName}' not found in socket.on calls`);
        }

        return args[1];
    }
});
