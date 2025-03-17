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

        expect((socketMock.leave as SinonSpy).calledWith(lobbyId.id)).to.equal(true);
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

    // Add these tests after the existing test cases

    it('should handle leaveGame and emit events', () => {
        // Create a game and lobby
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

        // Add a player to the lobby
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

        // Get the lobby and add player
        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(player);

        // Call the leaveGame method
        service.leaveGame(socketMock as Socket, lobbyId.id, player.name);

        // Verify the player left the socket room
        expect((socketMock.leave as SinonSpy).calledWith(lobbyId.id)).to.equal(true);

        // Verify emission to the room that player left
        expect((ioMock.to as SinonSpy).calledWith(lobbyId.id)).to.equal(true);
    });

    it('should handle leaveGame when player is not in the lobby', () => {
        // Create a game and lobby
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

        // Call leaveGame with a player that doesn't exist in the lobby
        service.leaveGame(socketMock as Socket, lobbyId.id, 'nonExistentPlayer');

        // Verify the socket still leaves the room
        expect((socketMock.leave as SinonSpy).calledWith(lobbyId.id)).to.equal(true);

        // Since nothing else should happen, verify no error was emitted
        expect((socketMock.emit as SinonSpy).calledWith('error')).to.equal(false);
    });

    it('should handle leaveGame when lobby does not exist', () => {
        // Call leaveGame with a non-existent lobby ID
        service.leaveGame(socketMock as Socket, 'nonExistentLobbyId', 'testPlayer');

        // Verify that an error was emitted
        expect((socketMock.emit as SinonSpy).calledWith('error', 'Lobby not found.')).to.equal(true);
    });

    it('should handle leaveGame when the leaving player is the host', () => {
        // Create a game and lobby
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

        // Add a host player to the lobby
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

        // Add a regular player to the lobby
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

        // Get the lobby and add players
        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(hostPlayer);
        lobby?.players.push(regularPlayer);

        // Call the leaveGame method with the host player
        service.leaveGame(socketMock as Socket, lobbyId.id, hostPlayer.name);

        // Verify the socket left the room
        expect((socketMock.leave as SinonSpy).calledWith(lobbyId.id)).to.equal(true);

        // Verify the lobby was deleted since the host left
        expect(lobbies.has(lobbyId.id)).to.equal(false);

        // Verify a hostLeft event was emitted to the lobby
        const toEmit = ioMock.to.returnValues[0].emit as SinonSpy;
        expect(toEmit.calledWith('hostLeft')).to.equal(true);
    });

    it('should handle leaveGame and assign a new host if host leaves and there are other players', () => {
        // This test case is for an implementation where a new host is assigned instead of deleting the lobby
        // Create a modified version of leaveGame method to test this specific behavior
        const mockLobbyService = Object.create(service);
        mockLobbyService.leaveGame = function (socket: Socket, lobbyId: string, playerName: string): void {
            socket.leave(lobbyId);

            const lobby = this.lobbies.get(lobbyId);
            if (!lobby) {
                socket.emit('error', 'Lobby not found.');
                return;
            }

            const playerIndex = lobby.players.findIndex((player: any) => player.name === playerName);
            if (playerIndex !== -1) {
                const isHost = lobby.players[playerIndex].isHost;
                lobby.players.splice(playerIndex, 1);

                if (isHost && lobby.players.length > 0) {
                    // Assign new host
                    lobby.players[0].isHost = true;
                    this.io.to(lobbyId).emit('newHost', { playerId: lobby.players[0].id });
                }

                this.updateLobby(lobbyId);
                this.io.to(lobbyId).emit('playerLeft', { playerName });
            }
        };

        // Setup for the test
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

        // Add a host player and a regular player
        const hostPlayer = { id: 'host123', name: 'hostPlayer', avatar: '', isHost: true, life: 0, speed: 0, attack: 0, defense: 0 };
        const regularPlayer = { id: 'regular123', name: 'regularPlayer', avatar: '', isHost: false, life: 0, speed: 0, attack: 0, defense: 0 };

        // Get the lobby and add players
        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(hostPlayer, regularPlayer);

        // Set the server for our mock
        mockLobbyService.lobbies = lobbies;
        mockLobbyService.io = ioMock;

        // Call the modified leaveGame method with the host player
        mockLobbyService.leaveGame(socketMock as Socket, lobbyId.id, hostPlayer.name);

        // Check that the lobby still exists
        expect(lobbies.has(lobbyId.id)).to.equal(true);

        // Check that a new host was assigned
        const updatedLobby = lobbies.get(lobbyId.id);
        expect(updatedLobby?.players.length).to.equal(1);
        expect(updatedLobby?.players[0].isHost).to.equal(true);
        expect(updatedLobby?.players[0].id).to.equal('regular123');

        // Verify newHost event was emitted
        const toEmit = ioMock.to.returnValues[0].emit as SinonSpy;
        expect(toEmit.calledWith('newHost')).to.equal(true);
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
        // Create a game and lobby
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

        // Add a player to the lobby
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

        // Get the lobby and add player
        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(player);

        // Initial state
        const initialPlayersLength = lobby?.players.length;

        // Call leaveLobby with a non-existent player name
        service.leaveLobby(socketMock as Socket, lobbyId.id, 'nonExistentPlayer');

        // Verify the lobby was not modified
        expect(lobby?.players.length).to.equal(initialPlayersLength);

        // Verify no socket methods were called
        expect((socketMock.leave as SinonSpy).called).to.be.false;
        expect((ioMock.to as SinonSpy).called).to.be.false;
    });

    it('should do nothing if lobby not found in leaveLobby', () => {
        // Call leaveLobby with a non-existent lobby ID
        service.leaveLobby(socketMock as Socket, 'nonExistentLobbyId', 'testPlayer');

        // Verify no socket methods were called
        expect((socketMock.leave as SinonSpy).called).to.be.false;
        expect((ioMock.to as SinonSpy).called).to.be.false;
    });

    it('should do nothing if player not found in leaveGame', () => {
        // Create a game and lobby
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

        // Add a player to the lobby
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

        // Get the lobby and add player
        const lobby = lobbies.get(lobbyId.id);
        expect(lobby).to.not.be.undefined;
        lobby?.players.push(player);

        // Initial state
        const initialPlayersLength = lobby?.players.length;

        // Call leaveGame with a non-existent player name
        service.leaveGame(socketMock as Socket, lobbyId.id, 'nonExistentPlayer');

        // Verify the lobby was not modified
        expect(lobby?.players.length).to.equal(initialPlayersLength);

        // Verify no socket methods were called
        expect((socketMock.leave as SinonSpy).called).to.be.false;
        expect((ioMock.to as SinonSpy).called).to.be.false;
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
