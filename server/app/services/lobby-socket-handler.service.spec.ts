/* eslint-disable max-lines */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-magic-numbers */
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
            lastModified: new Date(),
            isVisible: false,
            board: [],
            objects: [],
        };

        const lobbyId = service.createLobby(game);

        expect(lobbies.has(lobbyId.id)).to.equal(true);
        expect((ioMock.to as SinonSpy).calledWith(lobbyId.id)).to.equal(true);
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
        service.handleJoinLobbyRequest(socketMock as Socket, lobbyId.id, player);
        const lobby = lobbies.get(lobbyId.id);
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
        const player: Player = {
            id: 'socket123',
            name: 'test',
            avatar: 'avatar1',
            isHost: false,
            life: 100,
            speed: 10,
            attack: 10,
            defense: 10,
        };

        const lobbyId = service.createLobby({
            id: 'g',
            mapSize: GameSize.small,
            name: '',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: false,
            board: [],
            objects: [],
        });
        const lobby = lobbies.get(lobbyId.id);
        lobby?.players.push(player);
        service.leaveLobby(socketMock as Socket, lobbyId.id, player.name);
        expect(lobby?.players.find((p) => p.name === player.name)).to.be.undefined;
        expect(lobbies.has(lobbyId.id)).to.equal(true);
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
        const lobby = lobbies.get(lobbyId.id);
        lobby?.players.push(player);
        service.leaveLobby(socketMock as Socket, lobbyId.id, 'host');
        expect(lobbies.has(lobbyId.id)).to.equal(false);
    });
    it('should handle leaveGame and emit events', () => {
        const lobbyId = service.createLobby({
            id: 'game123',
            mapSize: GameSize.small,
            name: 'Test Game',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: false,
            board: [],
            objects: [],
        });

        const player: Player = {
            id: 'socket123',
            name: 'testPlayer',
            avatar: 'avatar1',
            isHost: false,
            life: 100,
            speed: 10,
            attack: 10,
            defense: 10,
        };

        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(player);

        service.leaveGame(socketMock as Socket, lobbyId.id, player.name);
        expect(lobby?.players.find((p) => p.name === player.name)).to.be.undefined;
        expect((ioMock.to as SinonSpy).calledWith(lobbyId.id)).to.equal(true);
    });

    it('should handle leaveGame when player is not in the lobby', () => {
        const lobbyId = service.createLobby({
            id: 'game123',
            mapSize: GameSize.small,
            name: 'Test Game',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: false,
            board: [],
            objects: [],
        });

        service.leaveGame(socketMock as Socket, lobbyId.id, 'nonExistentPlayer');
        expect(lobbies.has(lobbyId.id)).to.equal(true);
    });

    it('should handle leaveGame when lobby does not exist', () => {
        service.leaveGame(socketMock as Socket, 'nonExistentLobbyId', 'testPlayer');
        expect((socketMock.emit as SinonSpy).called).to.equal(false);
    });

    it('should handle leaveGame when the leaving player is the host', () => {
        const lobbyId = service.createLobby({
            id: 'game123',
            mapSize: GameSize.small,
            name: 'Test Game',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: false,
            board: [],
            objects: [],
        });

        const hostPlayer: Player = {
            id: 'socket123',
            name: 'hostPlayer',
            avatar: 'avatar1',
            isHost: true,
            life: 100,
            speed: 10,
            attack: 10,
            defense: 10,
        };

        const regularPlayer: Player = {
            id: 'socket456',
            name: 'regularPlayer',
            avatar: 'avatar2',
            isHost: false,
            life: 100,
            speed: 10,
            attack: 10,
            defense: 10,
        };

        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(hostPlayer);
        lobby?.players.push(regularPlayer);

        service.leaveGame(socketMock as Socket, lobbyId.id, hostPlayer.name);
        expect(lobbies.has(lobbyId.id)).to.equal(true);
        expect(lobby?.players.find((p) => p.name === hostPlayer.name)).to.be.undefined;
    });
    it('should handle leaveGame and keep other players if host leaves', () => {
        const lobbyId = service.createLobby({
            id: 'game123',
            mapSize: GameSize.small,
            name: 'Test Game',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: false,
            board: [],
            objects: [],
        });

        const hostPlayer = { id: 'host123', name: 'hostPlayer', avatar: '', isHost: true, life: 0, speed: 0, attack: 0, defense: 0 };
        const regularPlayer = { id: 'regular123', name: 'regularPlayer', avatar: '', isHost: false, life: 0, speed: 0, attack: 0, defense: 0 };

        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(hostPlayer, regularPlayer);

        service.leaveGame(socketMock as Socket, lobbyId.id, hostPlayer.name);
        expect(lobby?.players.find((p) => p.name === hostPlayer.name)).to.be.undefined;
        expect(lobby?.players.length).to.equal(1);
        expect(lobby?.players[0].id).to.equal('regular123');

        expect(lobby?.players[0].isHost).to.equal(false);
    });
    it('should return lobby on getLobby with a valid id', () => {
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
        const lobby = service.getLobby(lobbyId.id);
        expect(lobby).to.not.be.undefined;
    });

    it('should do nothing if player not found in leaveLobby', () => {
        const lobbyId = service.createLobby({
            id: 'game123',
            mapSize: GameSize.small,
            name: 'Test Game',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: false,
            board: [],
            objects: [],
        });

        const player: Player = {
            id: 'socket123',
            name: 'testPlayer',
            avatar: 'avatar1',
            isHost: false,
            life: 100,
            speed: 10,
            attack: 10,
            defense: 10,
        };
        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(player);
        const initialPlayersLength = lobby?.players.length;
        service.leaveLobby(socketMock as Socket, lobbyId.id, 'nonExistentPlayer');
        expect(lobby?.players.length).to.equal(initialPlayersLength);
        expect((socketMock.leave as SinonSpy).called).to.be.false;
    });

    it('should do nothing if lobby not found in leaveLobby', () => {
        service.leaveLobby(socketMock as Socket, 'nonExistentLobbyId', 'testPlayer');
        expect((socketMock.leave as SinonSpy).called).to.be.false;
        expect((ioMock.to as SinonSpy).called).to.be.false;
    });

    it('should do nothing if player not found in leaveGame', () => {
        const lobbyId = service.createLobby({
            id: 'game123',
            mapSize: GameSize.small,
            name: 'Test Game',
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: false,
            board: [],
            objects: [],
        });
        const player: Player = {
            id: 'socket123',
            name: 'testPlayer',
            avatar: 'avatar1',
            isHost: false,
            life: 100,
            speed: 10,
            attack: 10,
            defense: 10,
        };

        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(player);

        const initialPlayersLength = lobby?.players.length;

        service.leaveGame(socketMock as Socket, lobbyId.id, 'nonExistentPlayer');

        expect(lobby?.players.length).to.equal(initialPlayersLength);
        expect((socketMock.leave as SinonSpy).called).to.be.false;
    });

    it('should do nothing if lobby not found in leaveGame', () => {
        // Call leaveGame with a non-existent lobby ID
        service.leaveGame(socketMock as Socket, 'nonExistentLobbyId', 'testPlayer');

        // Verify no socket methods were called
        expect((socketMock.leave as SinonSpy).called).to.be.false;
        expect((ioMock.to as SinonSpy).called).to.be.false;
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
        service.lockLobby(socketMock as Socket, lobbyId.id);
        expect(lobbies.get(lobbyId.id)?.isLocked).to.equal(true);
        service.lockLobby(socketMock as Socket, lobbyId.id);
        expect(lobbies.get(lobbyId.id)?.isLocked).to.equal(false);
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
});
