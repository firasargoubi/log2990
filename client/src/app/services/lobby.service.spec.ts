/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { TestBed } from '@angular/core/testing';
import { Coordinates } from '@common/coordinates';
import { GameEvents } from '@common/events';
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
            once: jasmine.createSpy('once'),
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
    describe('Additional methods for 100% coverage', () => {
        const findSocketCallback = (event: string): Function | null => {
            const call = socketMock.on.calls.allArgs().find((args: any[]) => args[0] === event);
            return call ? call[1] : null;
        };

        it('should return current player after setting it', () => {
            const player: Player = { id: 'p1', name: 'Test Player' } as Player;
            service.setCurrentPlayer(player);
            expect(service.getCurrentPlayer()).toEqual(player);
        });

        it('should call socket.disconnect on disconnect()', () => {
            service.disconnect();
            expect(socketMock.disconnect).toHaveBeenCalled();
        });

        it('should call socket.connect on reconnect() if disconnected', () => {
            socketMock.connected = false;
            service.reconnect();
            expect(socketMock.connect).toHaveBeenCalled();
        });

        it('should not call socket.connect on reconnect() if already connected', () => {
            socketMock.connected = true;
            service.reconnect();
            expect(socketMock.connect).not.toHaveBeenCalled();
        });

        it('should create lobby by emitting createLobby', () => {
            const game: Game = { id: 'game1', name: 'Test Game' } as Game;
            service.createLobby(game);
            expect(socketMock.emit).toHaveBeenCalledWith('createLobby', game);
        });

        it('should join lobby by emitting joinLobby with correct data', () => {
            const player: Player = { id: 'p1', name: 'Test' } as Player;
            service.joinLobby('lobby1', player);
            expect(socketMock.emit).toHaveBeenCalledWith('joinLobby', { lobbyId: 'lobby1', player });
        });

        it('should leave lobby by emitting leaveLobby with correct data', () => {
            service.leaveLobby('lobby1', 'Test');
            expect(socketMock.emit).toHaveBeenCalledWith('leaveLobby', { lobbyId: 'lobby1', playerName: 'Test' });
        });

        it('should leave game by emitting leaveGame with correct args', () => {
            service.leaveGame('lobby1', 'Test');
            expect(socketMock.emit).toHaveBeenCalledWith('leaveGame', 'lobby1', 'Test');
        });

        it('should lock lobby by emitting lockLobby', () => {
            service.lockLobby('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('lockLobby', 'lobby1');
        });

        it('should disconnect from room by emitting disconnectFromRoom', () => {
            service.disconnectFromRoom('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('disconnectFromRoom', 'lobby1');
        });

        it('should update players by emitting updatePlayers', () => {
            const players: Player[] = [{ id: 'p1', name: 'A' } as Player];
            service.updatePlayers('lobby1', players);
            expect(socketMock.emit).toHaveBeenCalledWith('updatePlayers', 'lobby1', players);
        });

        it('should request start game by emitting requestStart', () => {
            service.requestStartGame('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('requestStart', 'lobby1');
        });

        it('should request movement by emitting requestMovement with correct data', () => {
            const coords: Coordinates[] = [{ x: 1, y: 1 }];
            service.requestMovement('lobby1', coords);
            expect(socketMock.emit).toHaveBeenCalledWith('requestMovement', { lobbyId: 'lobby1', coordinates: coords });
        });

        it('should request teleport by emitting teleport with correct data', () => {
            const coord: Coordinates = { x: 2, y: 3 };
            service.requestTeleport('lobby1', coord);
            expect(socketMock.emit).toHaveBeenCalledWith('teleport', { lobbyId: 'lobby1', coordinates: coord });
        });

        it('should request end turn by emitting endTurn', () => {
            service.requestEndTurn('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('endTurn', { lobbyId: 'lobby1' });
        });

        it('should set debug by emitting setDebug with correct data', () => {
            service.setDebug('lobby1', true);
            expect(socketMock.emit).toHaveBeenCalledWith('setDebug', { lobbyId: 'lobby1', debug: true });
        });

        it('should verify room and complete observable', (done) => {
            const response = { exists: true, isLocked: false };
            socketMock.emit.and.callFake((event: string, data: any, callback: Function) => {
                if (event === 'verifyRoom') {
                    callback(response);
                }
            });
            service.verifyRoom('game1').subscribe((res) => {
                expect(res).toEqual(response);
                done();
            });
            expect(socketMock.emit).toHaveBeenCalledWith('verifyRoom', { gameId: 'game1' }, jasmine.any(Function));
        });

        it('should verify avatars and complete observable', (done) => {
            const response = { avatars: ['a1', 'a2'] };
            socketMock.emit.and.callFake((event: string, data: any, callback: Function) => {
                if (event === 'verifyAvatars') {
                    callback(response);
                }
            });
            service.verifyAvatars('lobby1').subscribe((res) => {
                expect(res).toEqual(response);
                done();
            });
            expect(socketMock.emit).toHaveBeenCalledWith('verifyAvatars', { lobbyId: 'lobby1' }, jasmine.any(Function));
        });

        it('should verify username and complete observable', (done) => {
            const response = { usernames: ['u1', 'u2'] };
            socketMock.emit.and.callFake((event: string, data: any, callback: Function) => {
                if (event === 'verifyUsername') {
                    callback(response);
                }
            });
            service.verifyUsername('lobby1').subscribe((res) => {
                expect(res).toEqual(response);
                done();
            });
            expect(socketMock.emit).toHaveBeenCalledWith('verifyUsername', { lobbyId: 'lobby1' }, jasmine.any(Function));
        });

        it('should emit playerDefeated on handleDefeat', () => {
            const player: Player = { id: 'p1', name: 'Defeated' } as Player;
            service.handleDefeat(player, 'lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('playerDefeated', { player, lobbyId: 'lobby1' });
        });

        it('should emit attack on attack()', () => {
            const attacker: Player = { id: 'p1', name: 'Attacker' } as Player;
            const defender: Player = { id: 'p2', name: 'Defender' } as Player;
            service.attack('lobby1', attacker, defender);
            expect(socketMock.emit).toHaveBeenCalledWith('attack', { lobbyId: 'lobby1', attacker, defender });
        });

        it('should emit flee on flee()', () => {
            const player: Player = { id: 'p1', name: 'Runner' } as Player;
            const opponent: Player = { id: 'p2', name: 'Chaser' } as Player;
            service.flee('lobby1', player, opponent);
            expect(socketMock.emit).toHaveBeenCalledWith('flee', { lobbyId: 'lobby1', player, opponent });
        });

        it('should start combat by emitting startBattle', () => {
            const current: Player = { id: 'p1', name: 'Current' } as Player;
            const opp: Player = { id: 'p2', name: 'Opponent' } as Player;
            service.startCombat('lobby1', current, opp);
            expect(socketMock.emit).toHaveBeenCalledWith('startBattle', { lobbyId: 'lobby1', currentPlayer: current, opponent: opp });
        });

        it('should subscribe to onStartCombat and receive data', (done) => {
            const data = { firstPlayer: { id: 'p1', name: 'Starter' } as Player };
            service
                .onStartCombat()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback('startCombat');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });

        it('should subscribe to onCombatEnded and receive data', (done) => {
            const data = { loser: { id: 'p2', name: 'Loser' } as Player };
            service
                .onCombatEnded()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback('combatEnded');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });

        it('should subscribe to onGameOver and receive data', (done) => {
            const data = { winner: 'p1' };
            service
                .onGameOver()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback('gameOver');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });

        it('should subscribe to teamCreated and receive data', (done) => {
            const data = {
                team1Server: [{ id: 'p1', name: 'A' } as Player],
                team2Server: [{ id: 'p2', name: 'B' } as Player],
                updatedGameState: { id: 'game1' } as GameState,
            };
            service
                .teamCreated()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback('teamsCreated');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });

        it('should subscribe to onFleeSuccess and receive data', (done) => {
            const data = { fleeingPlayer: { id: 'p1', name: 'Runner' } as Player };
            service
                .onFleeSuccess()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback('fleeSuccess');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });

        it('should subscribe to onFleeFailure and receive data', (done) => {
            const data = { fleeingPlayer: { id: 'p1', name: 'Runner' } as Player };
            service
                .onFleeFailure()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback('fleeFailure');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });

        it('should subscribe to onEventLog and receive data', (done) => {
            const data = { gameState: { id: 'game1' } as GameState, eventType: 'TEST', description: 'An event' };
            service
                .onEventLog()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback('eventLog');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });

        it('should subscribe to onInventoryFull and receive data', (done) => {
            const CURRENT_INVENTORY = 3;
            const data = { item: 1, currentInventory: [1, 2, CURRENT_INVENTORY] };
            service
                .onInventoryFull()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback('inventoryFull');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });

        it('should call resolveInventory emitting resolveInventory with correct data', () => {
            const keptItems = [1, 2];
            service.resolveInventory('lobby1', keptItems);
            expect(socketMock.emit).toHaveBeenCalledWith('resolveInventory', { lobbyId: 'lobby1', keptItems });
        });

        it('should call cancelInventoryChoice emitting cancelInventoryChoice', () => {
            service.cancelInventoryChoice('lobby1');
            expect(socketMock.emit).toHaveBeenCalledWith('cancelInventoryChoice', { lobbyId: 'lobby1' });
        });

        it('should subscribe to onBoardModified and receive data', (done) => {
            const testData = { modified: true };
            service
                .onBoardModified()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(testData);
                    done();
                });
            const callback = findSocketCallback('boardModified');
            expect(callback).not.toBeNull();
            if (callback) {
                callback(testData);
            }
        });

        it('should create teams by emitting createTeams with correct data', () => {
            const players: Player[] = [{ id: 'p1', name: 'A' } as Player, { id: 'p2', name: 'B' } as Player];
            service.createTeams('lobby1', players);
            expect(socketMock.emit).toHaveBeenCalledWith('createTeams', { lobbyId: 'lobby1', players });
        });

        describe('joinLobbyMessage and sendMessage methods', () => {
            it('should call joinLobbyMessage immediately if connected', () => {
                socketMock.connected = true;
                service.joinLobbyMessage('lobby1');
                expect(socketMock.emit).toHaveBeenCalledWith('joinLobby', 'lobby1');
            });

            it('should call sendMessage if connected', () => {
                socketMock.connected = true;
                service.sendMessage('lobby1', 'Tester', 'Hello');
                expect(socketMock.emit).toHaveBeenCalledWith('sendMessage', { lobbyId: 'lobby1', playerName: 'Tester', message: 'Hello' });
            });
        });

        it('should subscribe to onMessageReceived and receive data', (done) => {
            const data = { playerName: 'Tester', message: 'Hi there' };
            service
                .onMessageReceived()
                .pipe(take(1))
                .subscribe((res) => {
                    expect(res).toEqual(data);
                    done();
                });
            const callback = findSocketCallback(GameEvents.ChatMessage);
            expect(callback).not.toBeNull();
            if (callback) {
                callback(data);
            }
        });
    });
    describe('joinLobbyMessage', () => {
        const testLobbyId = 'lobby-test';

        it('should call emit immediately if socket is connected', () => {
            socketMock.connected = true;
            service.joinLobbyMessage(testLobbyId);
            expect(socketMock.emit).toHaveBeenCalledWith('joinLobby', testLobbyId);
        });

        it('should call emit after connect if socket is not connected', () => {
            socketMock.connected = false;
            service.joinLobbyMessage(testLobbyId);
            const onceCall = socketMock.once.calls.allArgs().find((args: any[]) => args[0] === 'connect');
            expect(onceCall).toBeDefined();

            onceCall[1]();
            expect(socketMock.emit).toHaveBeenCalledWith('joinLobby', testLobbyId);
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
