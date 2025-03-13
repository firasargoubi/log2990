/* eslint-disable @typescript-eslint/no-explicit-any */
import { SocketService } from '@app/services/socket.service';
import { GameLobby } from '@common/game-lobby';
import { expect } from 'chai';
import { createSandbox, SinonSandbox, SinonSpy } from 'sinon';
import { Socket } from 'socket.io';
describe('SocketService unit tests', () => {
    interface FakeSocket extends Partial<Socket> {
        emit: SinonSpy;
        join: SinonSpy;
        leave?: SinonSpy;
    }

    let socketService: SocketService;
    let sandbox: SinonSandbox;
    let fakeSocket: FakeSocket;

    beforeEach(() => {
        sandbox = createSandbox();

        socketService = Object.create(SocketService.prototype);
        socketService['lobbies'] = new Map();

        socketService['io'] = {
            to: sandbox.stub().returns({ emit: sandbox.spy() }),
            on: sandbox.stub(),
        } as any;

        fakeSocket = {
            id: 'socket123',
            emit: sandbox.spy(),
            join: sandbox.spy(),
            leave: sandbox.spy(),
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should emit error if lobby not found (join)', () => {
        (socketService as any).handleJoinLobbyRequest(fakeSocket, 'unknownLobby', {
            name: 'Alice',
            avatar: 'avatar1',
            life: 100,
            speed: 10,
            attack: 5,
            defense: 5,
            isHost: false,
            id: '',
        });
        expect((fakeSocket.emit as SinonSpy).calledWith('error', 'Lobby not found.')).to.equal(true);
    });

    it('should emit error if lobby is locked (join)', () => {
        socketService['lobbies'].set('lobby1', { id: 'lobby1', players: [], isLocked: true, maxPlayers: 4, gameId: 'game123' });
        (socketService as any).handleJoinLobbyRequest(fakeSocket, 'lobby1', {
            name: 'Alice',
            avatar: 'avatar1',
            life: 100,
            speed: 10,
            attack: 5,
            defense: 5,
            isHost: false,
            id: '',
        });
        expect((fakeSocket.emit as SinonSpy).calledWith('error', 'Lobby is locked or full.')).to.equal(true);
    });

    it('should join lobby and emit playerJoined', () => {
        socketService['lobbies'].set('lobby1', { id: 'lobby1', players: [], isLocked: false, maxPlayers: 4, gameId: 'game123' });
        const player = { name: 'Alice', avatar: 'avatar1', life: 100, speed: 10, attack: 5, defense: 5, isHost: false, id: '' };
        const updateLobbySpy: SinonSpy = sandbox.spy();
        socketService['updateLobby'] = updateLobbySpy;
        (socketService as any).handleJoinLobbyRequest(fakeSocket, 'lobby1', player);
        expect((fakeSocket.join as SinonSpy).calledWith('lobby1')).to.equal(true);
        expect((socketService['io'].to('lobby1').emit as SinonSpy).calledWith('playerJoined')).to.equal(true);
        expect(updateLobbySpy.calledWith('lobby1')).to.equal(true);
    });

    it('should leave lobby and emit playerLeft', () => {
        socketService['lobbies'].set('lobby1', {
            id: 'lobby1',
            players: [{ id: 'socket123', name: 'Alice', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 5, defense: 5 }],
            maxPlayers: 4,
            isLocked: false,
            gameId: 'game123',
        });
        const updateLobbySpy: SinonSpy = sandbox.spy();
        socketService['updateLobby'] = updateLobbySpy;
        (socketService as any).leaveLobby(fakeSocket, 'lobby1', 'Alice');
        expect((fakeSocket.leave as SinonSpy).calledWith('lobby1')).to.equal(true);
        expect((socketService['io'].to('lobby1').emit as SinonSpy).calledWith('playerLeft', { lobbyId: 'lobby1', playerName: 'Alice' })).to.equal(
            true,
        );
        expect(updateLobbySpy.calledWith('lobby1')).to.equal(true);
    });

    it('should lock lobby and emit lobbyLocked', () => {
        socketService['lobbies'].set('lobby1', { id: 'lobby1', players: [], isLocked: false, maxPlayers: 4, gameId: 'game123' });
        const updateLobbySpy: SinonSpy = sandbox.spy();
        socketService['updateLobby'] = updateLobbySpy;
        (socketService as any).lockLobby(fakeSocket, 'lobby1');
        expect((socketService['io'].to('lobby1').emit as SinonSpy).calledWith('lobbyLocked', { lobbyId: 'lobby1' })).to.equal(true);
        expect(updateLobbySpy.calledWith('lobby1')).to.equal(true);
    });

    it('should respond to verifyRoom with exists=true', () => {
        socketService['lobbies'].set('lobby1', { id: 'lobby1', players: [], isLocked: false, maxPlayers: 4, gameId: 'game123' });
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyRoom(fakeSocket, 'lobby1', callback);
        expect(callback.calledWith({ exists: true })).to.equal(true);
    });

    it('should respond to verifyRoom with exists=false if not found', () => {
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyRoom(fakeSocket, 'unknownLobby', callback);
        expect(callback.calledWith({ exists: false })).to.equal(true);
        expect((fakeSocket.emit as SinonSpy).calledWith('error', "Cette partie n'existe pas.")).to.equal(true);
    });

    it('should respond to verifyRoom with isLocked=true if locked', () => {
        socketService['lobbies'].set('lobby1', { id: 'lobby1', players: [], isLocked: true, maxPlayers: 4, gameId: 'game123' });
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyRoom(fakeSocket, 'lobby1', callback);
        expect(callback.calledWith({ exists: false, isLocked: true })).to.equal(true);
        expect((fakeSocket.emit as SinonSpy).calledWith('error', 'Cette partie est verrouillée.')).to.equal(true);
    });

    it('should respond to verifyAvatars with list', () => {
        socketService['lobbies'].set('lobby1', {
            id: 'lobby1',
            players: [{ id: 'socket123', name: 'Alice', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 5, defense: 5 }],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'game123',
        });
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyAvatars(fakeSocket, 'lobby1', callback);
        expect(callback.calledWith({ avatars: ['avatar1'] })).to.equal(true);
    });

    it('should emit error if lobby not found in verifyAvatars', () => {
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyAvatars(fakeSocket, 'unknownLobby', callback);
        expect((fakeSocket.emit as SinonSpy).calledWith('error', "Cette partie n'existe pas.")).to.equal(true);
    });

    it('should emit error if lobby is locked in verifyAvatars', () => {
        socketService['lobbies'].set('lobby1', { id: 'lobby1', players: [], isLocked: true, maxPlayers: 4, gameId: 'game123' });
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyAvatars(fakeSocket, 'lobby1', callback);
        expect((fakeSocket.emit as SinonSpy).calledWith('error', 'Cette partie est verrouillée.')).to.equal(true);
    });

    it('should respond to verifyUsername with list', () => {
        socketService['lobbies'].set('lobby1', {
            id: 'lobby1',
            players: [{ id: 'socket123', name: 'Alice', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 5, defense: 5 }],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'game123',
        });
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyUsername(fakeSocket, 'lobby1', callback);
        expect(callback.calledWith({ usernames: ['Alice'] })).to.equal(true);
    });

    it('should emit error if lobby not found in verifyUsername', () => {
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyUsername(fakeSocket, 'unknownLobby', callback);
        expect((fakeSocket.emit as SinonSpy).calledWith('error', "Cette partie n'existe pas.")).to.equal(true);
    });

    it('should emit error if lobby is locked in verifyUsername', () => {
        socketService['lobbies'].set('lobby1', { id: 'lobby1', players: [], isLocked: true, maxPlayers: 4, gameId: 'game123' });
        const callback: SinonSpy = sandbox.spy();
        (socketService as any).verifyUsername(fakeSocket, 'lobby1', callback);
        expect((fakeSocket.emit as SinonSpy).calledWith('error', 'Cette partie est verrouillée.')).to.equal(true);
    });

    it('should return lobby in getLobby callback', () => {
        const testLobby: GameLobby = { id: 'lobby1', players: [], isLocked: false, maxPlayers: 4, gameId: 'game123' };
        socketService['lobbies'].set('lobby1', testLobby);
        const callback: SinonSpy = sandbox.spy();
        const result = socketService['lobbies'].get('lobby1');
        callback(result);
        expect(callback.calledWith(testLobby)).to.equal(true);
    });

    it('should return gameId in getGameId callback', () => {
        socketService['lobbies'].set('lobby1', { id: 'lobby1', players: [], isLocked: false, maxPlayers: 4, gameId: 'game123' });
        const callback: SinonSpy = sandbox.spy();
        const lobby = socketService['lobbies'].get('lobby1');
        callback(lobby?.gameId || null);
        expect(callback.calledWith('game123')).to.equal(true);
    });

    it('should return null gameId if lobby not found', () => {
        const callback: SinonSpy = sandbox.spy();
        const lobby = socketService['lobbies'].get('unknownLobby');
        callback(lobby?.gameId || null);
        expect(callback.calledWith(null)).to.equal(true);
    });
    it('should create a lobby and call updateLobby', () => {
        const updateLobbySpy = sandbox.spy();
        socketService['updateLobby'] = updateLobbySpy;

        const game = { id: 'gameId1', mapSize: 'medium' };
        const lobbyId = (socketService as any).createLobby(game);

        const createdLobby = socketService['lobbies'].get(lobbyId);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
        expect(createdLobby).to.exist;
        expect(createdLobby?.gameId).to.equal('gameId1');
        expect(createdLobby?.maxPlayers).to.equal(4); // medium = 4
        expect(updateLobbySpy.calledWith(lobbyId)).to.equal(true);
    });

    it('should return correct maxPlayers based on mapSize', () => {
        expect((socketService as any).getMaxPlayers('small')).to.equal(2);
        expect((socketService as any).getMaxPlayers('medium')).to.equal(4);
        expect((socketService as any).getMaxPlayers('large')).to.equal(6);
        expect((socketService as any).getMaxPlayers('unknown')).to.equal(2); // default
    });

    it('should generate unique lobby ids', () => {
        const map = new Map();
        socketService['lobbies'] = map;

        // Simuler collision
        sandbox.stub(Math, 'random').onFirstCall().returns(0.1234).onSecondCall().returns(0.5678);
        const id1 = (socketService as any).generateId();
        map.set(id1, { id: id1 });

        const id2 = (socketService as any).generateId();
        expect(id1).to.not.equal(id2);
    });

    it('should emit lobbyUpdated in updateLobby', () => {
        const emitSpy = sandbox.spy();
        socketService['io'] = {
            to: sandbox.stub().returns({ emit: emitSpy }),
        } as any;

        const testLobby: GameLobby = {
            id: 'lobby1',
            players: [],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'game123',
        };
        socketService['lobbies'].set('lobby1', testLobby);

        (socketService as any).updateLobby('lobby1');
        expect(
            emitSpy.calledWith('lobbyUpdated', {
                lobbyId: 'lobby1',
                lobby: JSON.parse(JSON.stringify(testLobby)),
            }),
        ).to.equal(true);
    });

    it('should not emit anything if lobby not found in updateLobby', () => {
        const emitSpy = sandbox.spy();
        socketService['io'] = {
            to: sandbox.stub().returns({ emit: emitSpy }),
        } as any;

        (socketService as any).updateLobby('unknownLobby');
        expect(emitSpy.notCalled).to.equal(true);
    });
    it('should return null in getLobby callback if lobby not found', () => {
        const callback: SinonSpy = sandbox.spy();
        const lobby = socketService['lobbies'].get('unknown');
        callback(lobby || null);
        expect(callback.calledWith(null)).to.equal(true);
    });
    it('should return null in getGameId callback if lobby not found', () => {
        const callback: SinonSpy = sandbox.spy();
        const lobby = socketService['lobbies'].get('unknown');
        callback(lobby?.gameId || null);
        expect(callback.calledWith(null)).to.equal(true);
    });
    it('should register socket events on init', () => {
        const socketOnSpy = sandbox.spy();
        const socket: any = { on: socketOnSpy };

        (socketService['io'] as any).on = (event: string, handler: any) => {
            if (event === 'connection') handler(socket);
        };

        socketService.init();

        expect(socketOnSpy.callCount).to.be.gte(7);
        expect(socketOnSpy.calledWith('createLobby')).to.equal(true);
        expect(socketOnSpy.calledWith('joinLobby')).to.equal(true);
        expect(socketOnSpy.calledWith('leaveLobby')).to.equal(true);
        expect(socketOnSpy.calledWith('lockLobby')).to.equal(true);
        expect(socketOnSpy.calledWith('getLobby')).to.equal(true);
        expect(socketOnSpy.calledWith('getGameId')).to.equal(true);
        expect(socketOnSpy.calledWith('verifyRoom')).to.equal(true);
    });
    it('should trigger createLobby and emit lobbyCreated', () => {
        const socket: any = {
            on: (event: string, callback: any) => {
                if (event === 'createLobby') {
                    const spyEmit = sandbox.spy();
                    socket.emit = spyEmit;
                    callback({ id: 'game123', mapSize: 'small' });
                    expect(spyEmit.calledOnce).to.equal(true);
                    expect(spyEmit.args[0][0]).to.equal('lobbyCreated');
                    expect(spyEmit.args[0][1]).to.have.property('lobbyId');
                }
            },
        };
        socketService['io'].on('connection', (cb: any) => cb(socket));
        socketService.init();
    });
});
