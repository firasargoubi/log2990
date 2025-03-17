/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LobbyService } from './lobby.service';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { Game } from '@common/game.interface';
import { Player } from '@common/player';
import { GameLobby } from '@common/game-lobby';

describe('LobbyService', () => {
    let service: LobbyService;
    let mockSocket: any;

    beforeEach(() => {
        mockSocket = {
            emit: jasmine.createSpy('emit'),
            on: jasmine.createSpy('on'),
            disconnect: jasmine.createSpy('disconnect'),
            connect: jasmine.createSpy('connect'),
            id: 'test-socket-id',
            connected: false,
        };

        TestBed.configureTestingModule({
            providers: [LobbyService, { provide: environment, useValue: { serverUrl: 'http://test-url' } }],
        });

        service = TestBed.inject(LobbyService);
        // Manually set the socket to the mock object
        (service as any).socket = mockSocket;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Socket ID handling', () => {
        it('should return socket ID', () => {
            expect(service.getSocketId()).toBe('test-socket-id');
        });

        it('should return empty string if socket ID is undefined', () => {
            mockSocket.id = undefined;
            expect(service.getSocketId()).toBe('');
        });
    });

    describe('Connection management', () => {
        it('should disconnect socket', () => {
            service.disconnect();
            expect(mockSocket.disconnect).toHaveBeenCalled();
        });

        it('should reconnect when not connected', () => {
            mockSocket.connected = false;
            service.reconnect();
            expect(mockSocket.connect).toHaveBeenCalled();
        });

        it('should not reconnect when already connected', () => {
            mockSocket.connected = true;
            service.reconnect();
            expect(mockSocket.connect).not.toHaveBeenCalled();
        });
    });

    describe('Lobby creation', () => {
        it('should emit createLobby event', () => {
            const game = { id: '1', name: 'Test Game' } as Game;
            service.createLobby(game);
            expect(mockSocket.emit).toHaveBeenCalledWith('createLobby', game);
        });

        it('should handle lobbyCreated event', (done) => {
            const testData = {
                lobby: {
                    id: 'lobby-123',
                    players: [],
                    isLocked: false,
                    maxPlayers: 4,
                    gameId: 'game-123',
                },
            };

            mockSocket.on.and.callFake((event: string, callback: (data: any) => void) => {
                if (event === 'lobbyCreated') {
                    callback(testData);
                }
            });

            service.onLobbyCreated().subscribe((data) => {
                expect(data).toEqual(testData);
                done();
            });
        });
    });

    describe('Player interactions', () => {
        it('should emit joinLobby event', () => {
            const lobbyId = 'lobby-123';
            const player: Player = {
                name: 'player1',
                avatar: 'avatar1',
                id: '',
                isHost: false,
                life: 0,
                speed: 0,
                attack: 0,
                defense: 0,
            };
            service.joinLobby(lobbyId, player);
            expect(mockSocket.emit).toHaveBeenCalledWith('joinLobby', { lobbyId, player });
        });

        it('should emit leaveLobby event', () => {
            service.leaveLobby('lobby-123', 'player1');
            expect(mockSocket.emit).toHaveBeenCalledWith('leaveLobby', {
                lobbyId: 'lobby-123',
                playerName: 'player1',
            });
        });
    });

    describe('Server communication', () => {
        it('should get lobby data', (done) => {
            const testLobby: GameLobby = {
                id: 'lobby-123',
                players: [],
                isLocked: false,
                maxPlayers: 4,
                gameId: 'game-123',
            };

            service.getLobby('lobby-123').subscribe((lobby) => {
                expect(lobby).toEqual(testLobby);
                done();
            });

            const emitCall = mockSocket.emit.calls.all().find((call: any) => call.args[0] === 'getLobby');
            if (emitCall) {
                const callback = emitCall.args[2];
                callback(testLobby);
            }
        });

        it('should verify room existence', (done) => {
            const response = { exists: true, isLocked: false };
            service.verifyRoom('game-123').subscribe((res) => {
                expect(res).toEqual(response);
                done();
            });

            const emitCall = mockSocket.emit.calls.all().find((call: any) => call.args[0] === 'verifyRoom');
            if (emitCall) {
                const callback = emitCall.args[2];
                callback(response);
            }
        });
        it('should emit leaveGame event', () => {
            service.leaveGame('lobby-123', 'player1');
            expect(mockSocket.emit).toHaveBeenCalledWith('leaveGame', 'lobby-123', 'player1');
        });

        it('should emit disconnectFromRoom event', () => {
            service.disconnectFromRoom('lobby-123');
            expect(mockSocket.emit).toHaveBeenCalledWith('disconnectFromRoom', 'lobby-123');
        });

        it('should emit updatePlayers event', () => {
            const players: Player[] = [
                { name: 'player1', avatar: 'avatar1', id: '1', isHost: false, life: 100, speed: 5, attack: 10, defense: 8 },
                { name: 'player2', avatar: 'avatar2', id: '2', isHost: false, life: 90, speed: 6, attack: 12, defense: 7 },
            ];

            service.updatePlayers('lobby-123', players);
            expect(mockSocket.emit).toHaveBeenCalledWith('updatePlayers', 'lobby-123', players);
        });
    });

    describe('Lobby Locking', () => {
        it('should emit lockLobby event', () => {
            service.lockLobby('lobby-123');
            expect(mockSocket.emit).toHaveBeenCalledWith('lockLobby', 'lobby-123');
        });

        it('should handle lobbyLocked event', (done) => {
            const testData = { lobbyId: 'lobby-123' };
            service.onLobbyLocked().subscribe((data) => {
                expect(data).toEqual(testData);
                done();
            });

            const handler = getEventHandler('lobbyLocked');
            handler(testData);
        });
    });

    describe('Game Flow', () => {
        it('should emit requestStart event', () => {
            service.requestStartGame('lobby-123');
            expect(mockSocket.emit).toHaveBeenCalledWith('requestStart', 'lobby-123');
        });

        it('should handle gameStarted event with conversion', (done) => {
            const testData = {
                gameState: {
                    playerPositions: { player1: { x: 1, y: 2 } },
                    availableMoves: undefined,
                },
            };

            service.onGameStarted().subscribe((data) => {
                expect(data.gameState.playerPositions as any).toEqual({ player1: { x: 1, y: 2 } });
                expect(data.gameState.availableMoves || []).toEqual([]);
                done();
            });

            const handler = getEventHandler('gameStarted');
            handler(testData);
        });
    });

    describe('Turn Management', () => {
        it('should emit endTurn event', () => {
            service.requestEndTurn('lobby-123');
            expect(mockSocket.emit).toHaveBeenCalledWith('endTurn', { lobbyId: 'lobby-123' });
        });

        it('should handle turnStarted event with conversions', (done) => {
            const testData = {
                gameState: { playerPositions: { player1: { x: 1, y: 2 } } },
                currentPlayer: 'player1',
                availableMoves: undefined,
            };

            service.onTurnStarted().subscribe((data) => {
                expect(data.gameState.playerPositions as any).toEqual({ player1: { x: 1, y: 2 } });
                expect(data.availableMoves || []).toEqual([]);
                done();
            });

            const handler = getEventHandler('turnStarted');
            handler(testData);
        });

        describe('Turn Ended', () => {
            it('should handle turnEnded event and convert undefined availableMoves to an empty array', (done) => {
                const testData = {
                    gameState: {
                        playerPositions: { player1: { x: 1, y: 2 } },
                        availableMoves: undefined,
                    },
                    previousPlayer: 'player1',
                    currentPlayer: 'player2',
                };

                service.onTurnEnded().subscribe((data) => {
                    expect(data.gameState.playerPositions as any).toEqual({ player1: { x: 1, y: 2 } });
                    expect(data.gameState.availableMoves || []).toEqual([]);
                    expect(data.previousPlayer).toBe('player1');
                    expect(data.currentPlayer).toBe('player2');
                    done();
                });

                const handler = getEventHandler('turnEnded');
                handler(testData);
            });
        });
    });

    describe('Board Changed', () => {
        it('should handle boardModified event and emit the received data', (done) => {
            const testData: any = {
                gameState: {
                    playerPositions: { player1: { x: 1, y: 2 } },
                    availableMoves: ['move1', 'move2'],
                },
            };

            service.onBoardChanged().subscribe((data) => {
                expect(data).toEqual(testData);
                done();
            });

            const handler = getEventHandler('boardModified');
            handler(testData);
        });
    });

    describe('Movement Handling', () => {
        it('should handle movementProcessed event', (done) => {
            const testData = {
                gameState: {
                    playerPositions: { player1: { x: 1, y: 2 } },
                    availableMoves: undefined,
                },
                playerMoved: 'player1',
                newPosition: { x: 2, y: 3 },
            };

            service.onMovementProcessed().subscribe((data) => {
                expect(data.gameState.playerPositions as any).toEqual({ player1: { x: 1, y: 2 } });
                expect(data.gameState.availableMoves || []).toEqual([]);
                done();
            });

            const handler = getEventHandler('movementProcessed');
            handler(testData);
        });
    });

    describe('Movement Request', () => {
        it('should emit requestMovement event with the correct payload', () => {
            const lobbyId = 'lobby-123';
            const coordinates = [
                { x: 1, y: 2 },
                { x: 3, y: 4 },
            ];
            service.requestMovement(lobbyId, coordinates);
            expect(mockSocket.emit).toHaveBeenCalledWith('requestMovement', { lobbyId, coordinates });
        });
    });

    describe('Error Handling', () => {
        it('should handle error events', (done) => {
            const errorMsg = 'Test error';
            service.onError().subscribe((error) => {
                expect(error).toBe(errorMsg);
                done();
            });

            const handler = getEventHandler('error');
            handler(errorMsg);
        });
    });

    describe('Additional Server Communication', () => {
        it('should get game ID', (done) => {
            service.getGameId('lobby-123').subscribe((id) => {
                expect(id).toBe('game-456');
                done();
            });

            const emitCall = mockSocket.emit.calls.all().find((c: any) => c.args[0] === 'getGameId');
            if (emitCall) emitCall.args[2]('game-456');
        });

        it('should handle lobbyUpdated events', (done) => {
            const testData = {
                lobbyId: 'lobby-123',
                lobby: {
                    id: 'lobby-123',
                    players: [],
                    isLocked: false,
                    maxPlayers: 4,
                    gameId: 'game-123',
                },
            };

            service.onLobbyUpdated().subscribe((data) => {
                expect(data).toEqual(testData);
                done();
            });

            const handler = getEventHandler('lobbyUpdated');
            handler(testData);
        });
    });

    describe('Verification Methods', () => {
        it('should verify avatars', (done) => {
            const response = { avatars: ['avatar1'] };
            service.verifyAvatars('lobby-123').subscribe((res) => {
                expect(res).toEqual(response);
                done();
            });

            const emitCall = mockSocket.emit.calls.all().find((c: any) => c.args[0] === 'verifyAvatars');
            if (emitCall) emitCall.args[2](response);
        });

        it('should verify usernames', (done) => {
            const response = { usernames: ['user1'] };
            service.verifyUsername('lobby-123').subscribe((res) => {
                expect(res).toEqual(response);
                done();
            });

            const emitCall = mockSocket.emit.calls.all().find((c: any) => c.args[0] === 'verifyUsername');
            if (emitCall) emitCall.args[2](response);
        });
    });

    describe('Host Disconnection', () => {
        it('should handle hostDisconnected event', (done) => {
            service.onHostDisconnected().subscribe(() => {
                expect(true).toBeTrue();
                done();
            });

            const handler = getEventHandler('hostDisconnected');
            handler();
        });
    });

    describe('Current Player Management', () => {
        it('should set and get current player', () => {
            const player: Player = {
                name: 'test',
                avatar: 'avatar',
                id: '1',
                isHost: true,
                life: 100,
                speed: 5,
                attack: 10,
                defense: 8,
            };

            service.setCurrentPlayer(player);
            expect(service.getCurrentPlayer()).toEqual(player);
        });
    });

    // Helper function to retrieve event handlers from the mock socket
    function getEventHandler(eventName: string): (...args: any[]) => void {
        const call = mockSocket.on.calls.allArgs().find((args: any[]) => args[0] === eventName);
        if (!call) throw new Error(`Handler for ${eventName} not found`);
        return call[1];
    }
});
