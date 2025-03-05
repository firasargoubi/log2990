import { Server } from 'app/server';
import { SocketService } from '@app/services/socket.service';
import { expect } from 'chai';
import { SinonSandbox, createSandbox } from 'sinon';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';
import { Application } from '@app/app';

describe('SocketService service tests', () => {
    let server: Server;
    let socket: Socket;
    let service: SocketService;
    let sandbox: SinonSandbox;

    const urlString = 'http://localhost:3000';

    beforeEach(async () => {
        const app = Container.get(Application);
        server = new Server(app);
        sandbox = createSandbox();
        server.init();
        service = server['socketManager'];
        socket = ioClient(urlString, {
            reconnection: false,
            timeout: 5000, // Increased timeout
        });
        sandbox.stub(console, 'log');
    });

    afterEach((done) => {
        if (socket.connected) {
            socket.disconnect();
        }
        service['io'].close();
        sandbox.restore();
        done();
    });

    it('should create a game and emit gameCreated event', (done) => {
        socket.on('gameCreated', (data) => {
            try {
                expect(data).to.have.property('gameId');
                done();
            } catch (error) {
                done(error);
            }
        });
        socket.emit('createGame', { playerName: 'Player1' });
    });

    it('should join a game and emit playerJoined event', (done) => {
        const gameId = 'testGameId';
        service['rooms'][gameId] = { id: gameId, players: [], isStarted: false, messages: [] };

        socket.on('playerJoined', (data) => {
            try {
                expect(data).to.deep.equal({ gameId, playerName: 'Player1' });
                done();
            } catch (error) {
                done(error);
            }
        });

        socket.emit('joinGame', { gameId, playerName: 'Player1' });
    });

    it('should handle message event and emit message to room', (done) => {
        const gameId = 'testGameId';
        service['rooms'][gameId] = {
            id: gameId,
            players: [{ id: socket.id, name: 'Player1' }],
            isStarted: false,
            messages: [],
        };

        socket.on('message', (data) => {
            try {
                expect(data).to.deep.equal({ gameId, playerName: 'Player1', message: 'Hello' });
                done();
            } catch (error) {
                done(error);
            }
        });

        socket.emit('message', { gameId, message: 'Hello', playerName: 'Player1' });
    });

    it('should end a game and emit gameEnded event', (done) => {
        const gameId = 'testGameId';
        service['rooms'][gameId] = {
            id: gameId,
            players: [{ id: socket.id, name: 'Player1' }],
            isStarted: false,
            messages: [],
        };

        socket.on('gameEnded', (data) => {
            try {
                expect(data).to.deep.equal({ gameId });
                done();
            } catch (error) {
                done(error);
            }
        });

        socket.emit('endGame', { gameId });
    });

    it('should leave a game and remove player from room', (done) => {
        const gameId = 'testGameId';
        service['rooms'][gameId] = {
            id: gameId,
            players: [{ id: socket.id, name: 'Player1' }],
            isStarted: false,
            messages: [],
        };

        socket.on('gameLeft', (data) => {
            try {
                expect(data).to.deep.equal({ gameId, playerName: 'Player1' });
                const room = service['rooms'][gameId];
                expect(room.players).to.have.lengthOf(0);

                done();
            } catch (error) {
                done(error);
            }
        });

        socket.emit('leaveGame', { gameId, playerName: 'Player1' });
    });
});
