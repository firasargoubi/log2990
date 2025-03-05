/* eslint-disable @typescript-eslint/no-explicit-any */
import { SocketClientService } from './socket-client.service';
import { ChatMessage } from '@app/interfaces/chat-message';

describe('SocketClientService', () => {
    let service: SocketClientService;
    let socketSpy: any;

    beforeEach(() => {
        socketSpy = jasmine.createSpyObj('Socket', ['emit', 'on', 'off']);
        service = new SocketClientService();
        service['socket'] = socketSpy;
    });

    it('should create the service', () => {
        expect(service).toBeTruthy();
    });

    it('should emit createGame event', () => {
        const playerName = 'testPlayer';
        service.createGame(playerName);
        expect(socketSpy.emit).toHaveBeenCalledWith('createGame', { playerName });
    });

    it('should emit joinGame event', () => {
        const gameId = 'testGameId';
        const playerName = 'testPlayer';
        service.joinGame(gameId, playerName);
        expect(socketSpy.emit).toHaveBeenCalledWith('joinGame', { gameId, playerName });
    });

    it('should emit sendMessage event', () => {
        const gameId = 'testGameId';
        const message = 'testMessage';
        const playerName = 'testPlayer';
        service.sendMessage(gameId, message, playerName);
        expect(socketSpy.emit).toHaveBeenCalledWith('message', { gameId, message, playerName });
    });

    it('should emit endGame event', () => {
        const gameId = 'testGameId';
        service.endGame(gameId);
        expect(socketSpy.emit).toHaveBeenCalledWith('endGame', { gameId });
    });

    it('should emit leaveGame event', () => {
        const gameId = 'testGameId';
        const playerName = 'testPlayer';
        service.leaveGame(gameId, playerName);
        expect(socketSpy.emit).toHaveBeenCalledWith('leaveGame', { gameId, playerName });
    });

    it('should listen to receiveError event', () => {
        const error = 'testError';
        socketSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'error') {
                callback(error);
            }
        });

        service.receiveError().subscribe((data) => {
            expect(data).toBe(error);
        });
    });

    it('should listen to receiveGameCreated event', () => {
        const gameId = 'testGameId';
        socketSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'gameCreated') {
                callback({ gameId });
            }
        });

        service.receiveGameCreated().subscribe((data) => {
            expect(data.gameId).toBe(gameId);
        });
    });

    it('should listen to receivePlayerJoined event', () => {
        const gameId = 'testGameId';
        const playerId = 'testPlayerId';
        const playerName = 'testPlayer';
        socketSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'playerJoined') {
                callback({ gameId, playerId, playerName });
            }
        });

        service.receivePlayerJoined().subscribe((data) => {
            expect(data.gameId).toBe(gameId);
            expect(data.playerId).toBe(playerId);
            expect(data.playerName).toBe(playerName);
        });
    });

    it('should listen to receiveMessage event', () => {
        const gameId = 'testGameId';
        const playerName = 'testPlayer';
        const message = 'testMessage';
        socketSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'message') {
                callback({ gameId, playerName, message });
            }
        });

        service.receiveMessage().subscribe((data) => {
            expect(data.gameId).toBe(gameId);
            expect(data.playerName).toBe(playerName);
            expect(data.message).toBe(message);
        });
    });

    it('should listen to receivePreviousMessages event', () => {
        const gameId = 'testGameId';
        const messages = [{ playerName: 'testPlayer', message: 'testMessage' }];
        socketSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'previousMessages') {
                callback({ gameId, messages });
            }
        });

        service.receivePreviousMessages().subscribe((data) => {
            expect(data.gameId).toBe(gameId);
            expect(data.messages).toEqual(messages);
        });
    });

    it('should listen to receiveGameEnded event', () => {
        const gameId = 'testGameId';
        socketSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'gameEnded') {
                callback({ gameId });
            }
        });

        service.receiveGameEnded().subscribe((data) => {
            expect(data.gameId).toBe(gameId);
        });
    });

    it('should listen to receivePlayerListUpdated event', () => {
        const gameId = 'testGameId';
        const players = [{ name: 'testPlayer' }];
        socketSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'playerListUpdated') {
                callback({ gameId, players });
            }
        });

        service.receivePlayerListUpdated().subscribe((data) => {
            expect(data.gameId).toBe(gameId);
            expect(data.players).toEqual(players);
        });
    });

    it('should listen to receiveChatCreated event', () => {
        const gameId = 'testGameId';
        const messages: ChatMessage[] = [{ playerName: 'testPlayer', message: 'testMessage' }];
        socketSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'chatCreated') {
                callback({ gameId, messages });
            }
        });

        service.receiveChatCreated().subscribe((data) => {
            expect(data.gameId).toBe(gameId);
            expect(data.messages).toEqual(messages);
        });
    });

    it('should listen to a custom event using listenToEvent', () => {
        const event = 'customEvent';
        const eventData = { key: 'value' };
        socketSpy.on.and.callFake((eventName: string, callback: (data: any) => void) => {
            if (eventName === event) {
                callback(eventData);
            }
        });

        service['listenToEvent']<{ key: string }>(event).subscribe((data) => {
            expect(data).toEqual(eventData);
        });
    });
});
