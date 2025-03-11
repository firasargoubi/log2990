import { Application } from '@app/app';
import { SocketService } from '@app/services/socket.service';
import { Server } from 'app/server';
import { expect } from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';

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
            timeout: 5000,
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

    it('should create a lobby and emit lobbyCreated event', (done) => {
        socket.on('lobbyCreated', (data) => {
            try {
                expect(data).to.have.property('lobbyId');
                done();
            } catch (error) {
                done(error);
            }
        });

        socket.emit('createLobby', { id: 'gameId1', mapSize: 'medium' });
    });

    it('should join a lobby and emit playerJoined event', (done) => {
        const lobbyId = 'testLobbyId';
        service['lobbies'].set(lobbyId, {
            id: lobbyId,
            players: [],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'game123',
        });

        socket.on('playerJoined', (data) => {
            try {
                expect(data.lobbyId).to.equal(lobbyId);
                expect(data.player.name).to.equal('Player1');
                done();
            } catch (error) {
                done(error);
            }
        });

        socket.emit('joinLobby', {
            lobbyId,
            player: {
                id: '',
                name: 'Player1',
                avatar: 'avatar1',
                isHost: false,
                life: 100,
                speed: 10,
                attack: 5,
                defense: 5,
            },
        });
    });

    it('should lock a lobby and emit lobbyLocked event', (done) => {
        const lobbyId = 'testLobbyId';
        service['lobbies'].set(lobbyId, {
            id: lobbyId,
            players: [{ id: socket.id, name: 'Player1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 5, defense: 5 }],
            maxPlayers: 4,
            gameId: 'game123',
            isLocked: false,
        });

        socket.on('lobbyLocked', (data) => {
            try {
                expect(data.lobbyId).to.equal(lobbyId);
                done();
            } catch (error) {
                done(error);
            }
        });

        socket.emit('lockLobby', lobbyId);
    });
    it('should leave a lobby and remove player from lobby', (done) => {
        const lobbyId = 'testLobbyId';
        service['lobbies'].set(lobbyId, {
            id: lobbyId,
            players: [{ id: socket.id, name: 'Player1', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 5, defense: 5 }],
            maxPlayers: 4,
            gameId: 'game123',
            isLocked: false,
        });

        socket.on('playerLeft', (data) => {
            try {
                expect(data).to.deep.equal({ lobbyId, playerName: 'Player1' });

                const lobby = service['lobbies'].get(lobbyId);
                expect(lobby.players).to.have.lengthOf(0);

                done();
            } catch (error) {
                done(error);
            }
        });

        socket.emit('leaveLobby', { lobbyId, playerName: 'Player1' });
    });
});
