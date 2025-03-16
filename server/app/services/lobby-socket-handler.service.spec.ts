/* eslint-disable @typescript-eslint/no-explicit-any */
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { Game, GameSize, GameType } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createSandbox, SinonSandbox, SinonSpy } from 'sinon';
import { Server, Socket } from 'socket.io';

describe('LobbySocketHandlerService', () => {
    let sandbox: SinonSandbox;
    let service: LobbySocketHandlerService;
    let lobbies: Map<string, GameLobby>;
    let ioMock: { to: SinonSpy };
    let socketMock: Partial<Socket>;

    beforeEach(() => {
        sandbox = createSandbox();
        lobbies = new Map<string, GameLobby>();
        ioMock = { to: sandbox.stub().returns({ emit: sandbox.stub() }) } as any;
        socketMock = {
            id: 'socket123',
            join: sandbox.stub(),
            leave: sandbox.stub(),
            emit: sandbox.stub(),
        };
        service = new LobbySocketHandlerService(lobbies);
        service.setServer(ioMock as unknown as Server);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should create lobby and update it', () => {
        const game: Game = {
            id: 'game1',
            mapSize: GameSize.medium,
            name: '',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: undefined,
            isVisible: false,
            board: [],
            objects: [],
        };
        const lobbyId = service.createLobby(game);
        expect(lobbies.has(lobbyId)).to.equal(true);
        expect((ioMock.to as SinonSpy).calledWith(lobbyId)).to.equal(true);
    });

    it('should handle player join lobby', () => {
        const game: Game = {
            id: 'game1',
            mapSize: GameSize.small,
            name: '',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: undefined,
            isVisible: false,
            board: [],
            objects: [],
        };
        const lobbyId = service.createLobby(game);
        const player: Player = { id: '', name: 'test', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 10, defense: 10 };
        service.handleJoinLobbyRequest(socketMock as Socket, lobbyId, player);
        const lobby = lobbies.get(lobbyId);
        expect(lobby?.players.length).to.equal(1);
    });

    it('should emit error if lobby not found on join', () => {
        const player: Player = { id: '', name: 'test', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 10, defense: 10 };
        service.handleJoinLobbyRequest(socketMock as Socket, 'unknown', player);
        expect((socketMock.emit as SinonSpy).calledWith('error', 'Lobby not found.')).to.equal(true);
    });

    it('should emit error if lobby is locked or full', () => {
        const lobbyId = 'lobby123';
        lobbies.set(lobbyId, {
            id: lobbyId,
            players: [1, 2].map((i) => ({ id: i.toString(), name: '', avatar: '', isHost: false, life: 0, speed: 0, attack: 0, defense: 0 })),
            isLocked: false,
            maxPlayers: 2,
            gameId: 'game1',
        });
        const player: Player = { id: '', name: 'test', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 10, defense: 10 };
        service.handleJoinLobbyRequest(socketMock as Socket, lobbyId, player);
        expect((socketMock.emit as SinonSpy).calledWith('error', 'Lobby is locked or full.')).to.equal(true);
    });

    it('should leave lobby and emit events', () => {
        const player: Player = { id: '', name: 'test', avatar: 'avatar1', isHost: false, life: 100, speed: 10, attack: 10, defense: 10 };
        const lobbyId = service.createLobby({
            id: 'g',
            mapSize: GameSize.small,
            name: '',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: undefined,
            isVisible: false,
            board: [],
            objects: [],
        });
        lobbies.get(lobbyId)?.players.push(player);
        service.leaveLobby(socketMock as Socket, lobbyId, player.name);
        expect((socketMock.leave as SinonSpy).calledWith(lobbyId)).to.equal(true);
    });

    it('should delete lobby if host leaves', () => {
        const player: Player = { id: '', name: 'host', avatar: '', isHost: true, life: 0, speed: 0, attack: 0, defense: 0 };
        const lobbyId = service.createLobby({
            id: 'g',
            mapSize: GameSize.small,
            name: '',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: undefined,
            isVisible: false,
            board: [],
            objects: [],
        });
        const lobby = lobbies.get(lobbyId);
        lobby?.players.push(player);
        service.leaveLobby(socketMock as Socket, lobbyId, 'host');
        expect(lobbies.has(lobbyId)).to.equal(false);
    });

    it('should lock and unlock lobby', () => {
        const lobbyId = service.createLobby({
            id: 'g',
            mapSize: GameSize.small,
            name: '',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: undefined,
            isVisible: false,
            board: [],
            objects: [],
        });
        service.lockLobby(socketMock as Socket, lobbyId);
        expect(lobbies.get(lobbyId)?.isLocked).to.equal(true);
        service.lockLobby(socketMock as Socket, lobbyId);
        expect(lobbies.get(lobbyId)?.isLocked).to.equal(false);
    });

    it('should emit error if locking unknown lobby', () => {
        service.lockLobby(socketMock as Socket, 'unknown');
        expect((socketMock.emit as SinonSpy).calledWith('error', 'Lobby not found.')).to.equal(true);
    });

    it('should return correct max players', () => {
        expect((service as any).getMaxPlayers('small')).to.equal(2);
        expect((service as any).getMaxPlayers('medium')).to.equal(4);
        expect((service as any).getMaxPlayers('large')).to.equal(6);
        expect((service as any).getMaxPlayers('unknown')).to.equal(2);
    });

    it('should generate unique ids', () => {
        const id1 = (service as any).generateId();
        const id2 = (service as any).generateId();
        expect(id1).to.not.equal(id2);
    });

    it('should return lobby by id', () => {
        const lobbyId = service.createLobby({
            id: 'g',
            mapSize: GameSize.small,
            name: '',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: undefined,
            isVisible: false,
            board: [],
            objects: [],
        });
        const result = service.getLobby(lobbyId);
        expect(result?.id).to.equal(lobbyId);
    });
});
