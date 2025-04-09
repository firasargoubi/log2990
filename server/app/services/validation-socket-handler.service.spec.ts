/* eslint-disable @typescript-eslint/no-explicit-any */
import { VIRTUAL_PLAYER_NAMES } from '@app/consts/virtual-player-names';
import { ValidationSocketHandlerService } from '@app/services/validation-socket-handler.service';
import { AVATARS } from '@common/avatars';
import { GameLobby } from '@common/game-lobby';
import { expect } from 'chai';
import { createSandbox, SinonSandbox, SinonSpy } from 'sinon';
import { Socket } from 'socket.io';

describe('ValidationSocketHandlerService', () => {
    let sandbox: SinonSandbox;
    let lobbies: Map<string, GameLobby>;
    let service: ValidationSocketHandlerService;
    let socket: any;
    let emitSpy: SinonSpy;

    beforeEach(() => {
        sandbox = createSandbox();
        lobbies = new Map<string, GameLobby>();
        service = new ValidationSocketHandlerService(lobbies);

        emitSpy = sandbox.spy();
        socket = { emit: emitSpy } as unknown as Socket;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should emit error and callback exists: false if lobby not found in verifyRoom', () => {
        const callback = sandbox.spy();
        service.verifyRoom(socket, 'unknown', callback);
        expect(callback.calledWith({ exists: false })).to.equal(true);
        expect(emitSpy.calledWith('error', "Cette partie n'existe pas.")).to.equal(true);
    });

    it('should emit error and callback exists: false, isLocked: true if lobby is locked in verifyRoom', () => {
        const lobby: GameLobby = { id: 'lobby1', players: [], isLocked: true, maxPlayers: 4, gameId: 'g1' };
        lobbies.set('lobby1', lobby);
        const callback = sandbox.spy();
        service.verifyRoom(socket, 'lobby1', callback);
        expect(callback.calledWith({ exists: false, isLocked: true })).to.equal(true);
        expect(emitSpy.calledWith('error', 'Cette partie est verrouillée.')).to.equal(true);
    });

    it('should callback exists: true if lobby is not locked in verifyRoom', () => {
        const lobby: GameLobby = { id: 'lobby1', players: [], isLocked: false, maxPlayers: 4, gameId: 'g1' };
        lobbies.set('lobby1', lobby);
        const callback = sandbox.spy();
        service.verifyRoom(socket, 'lobby1', callback);
        expect(callback.calledWith({ exists: true })).to.equal(true);
    });

    it('should emit error if lobby not found in verifyAvatars', () => {
        const callback = sandbox.spy();
        service.verifyAvatars(socket, 'unknown', callback);
        expect(emitSpy.calledWith('error', "Cette partie n'existe pas.")).to.equal(true);
    });

    it('should emit error if lobby is locked in verifyAvatars', () => {
        const lobby: GameLobby = { id: 'lobby1', players: [], isLocked: true, maxPlayers: 4, gameId: 'g1' };
        lobbies.set('lobby1', lobby);
        const callback = sandbox.spy();
        service.verifyAvatars(socket, 'lobby1', callback);
        expect(emitSpy.calledWith('error', 'Cette partie est verrouillée.')).to.equal(true);
    });

    it('should callback avatars if lobby is not locked in verifyAvatars', () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [
                {
                    id: '1',
                    name: 'Alice',
                    avatar: 'avatar1',
                    isHost: false,
                    life: 100,
                    speed: 1,
                    attack: 1,
                    defense: 1,
                    maxLife: 0,
                    winCount: 0,
                    pendingItem: 0,
                },
            ],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);
        const callback = sandbox.spy();
        service.verifyAvatars(socket, 'lobby1', callback);
        expect(callback.calledWith({ avatars: ['avatar1'] })).to.equal(true);
    });

    it('should emit error if lobby not found in verifyUsername', () => {
        const callback = sandbox.spy();
        service.verifyUsername(socket, 'unknown', callback);
        expect(emitSpy.calledWith('error', "Cette partie n'existe pas.")).to.equal(true);
    });

    it('should emit error if lobby is locked in verifyUsername', () => {
        const lobby: GameLobby = { id: 'lobby1', players: [], isLocked: true, maxPlayers: 4, gameId: 'g1' };
        lobbies.set('lobby1', lobby);
        const callback = sandbox.spy();
        service.verifyUsername(socket, 'lobby1', callback);
        expect(emitSpy.calledWith('error', 'Cette partie est verrouillée.')).to.equal(true);
    });

    it('should callback usernames if lobby is not locked in verifyUsername', () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [
                {
                    id: '1',
                    name: 'Alice',
                    avatar: 'avatar1',
                    isHost: false,
                    life: 100,
                    speed: 1,
                    attack: 1,
                    defense: 1,
                    maxLife: 0,
                    winCount: 0,
                    pendingItem: 0,
                },
            ],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);
        const callback = sandbox.spy();
        service.verifyUsername(socket, 'lobby1', callback);
        expect(callback.calledWith({ usernames: ['Alice'] })).to.equal(true);
    });
    it('should return the default avatar if lobby does not exist', () => {
        const avatar = service.getAvailableAvatar('unknown');
        expect(avatar).to.equal(AVATARS.fawn);
    });

    it('should return an available avatar if some avatars are unused', () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [
                {
                    id: '1',
                    name: 'Alice',
                    avatar: AVATARS.fawn,
                    isHost: false,
                    life: 100,
                    speed: 1,
                    attack: 1,
                    defense: 1,
                    maxLife: 0,
                    winCount: 0,
                    pendingItem: 0,
                },
            ],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);

        const avatar = service.getAvailableAvatar('lobby1');
        expect(Object.values(AVATARS)).to.include(avatar);
        expect(avatar).to.not.equal(AVATARS.fawn);
    });

    it('should return the default avatar if all avatars are used', () => {
        const allAvatars = Object.values(AVATARS);
        const lobby: GameLobby = {
            id: 'lobby1',
            players: allAvatars.map((av, index) => ({
                id: `${index}`,
                name: `Player${index}`,
                avatar: av,
                isHost: false,
                life: 100,
                speed: 1,
                attack: 1,
                defense: 1,
                maxLife: 0,
                winCount: 0,
                pendingItem: 0,
            })),
            isLocked: false,
            maxPlayers: allAvatars.length,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);

        const avatar = service.getAvailableAvatar('lobby1');
        expect(avatar).to.equal(AVATARS.fawn);
    });
    it('should return the first virtual player name if lobby does not exist', () => {
        const name = service.getAvailableVirtualPlayerName('unknown');
        expect(name).to.equal(VIRTUAL_PLAYER_NAMES[0]);
    });

    it('should return an available virtual player name if some names are unused', () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [
                {
                    id: '1',
                    name: VIRTUAL_PLAYER_NAMES[0],
                    avatar: AVATARS.fawn,
                    isHost: false,
                    life: 100,
                    speed: 1,
                    attack: 1,
                    defense: 1,
                    maxLife: 0,
                    winCount: 0,
                    pendingItem: 0,
                },
            ],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);

        const name = service.getAvailableVirtualPlayerName('lobby1');
        expect(VIRTUAL_PLAYER_NAMES).to.include(name);
        expect(name).to.not.equal(VIRTUAL_PLAYER_NAMES[0]);
    });

    it('should append "Bot" to a name if all virtual names are used', () => {
        const allNames = VIRTUAL_PLAYER_NAMES;
        const lobby: GameLobby = {
            id: 'lobby1',
            players: allNames.map((username, index) => ({
                id: `${index}`,
                name: username,
                avatar: AVATARS.fawn,
                isHost: false,
                life: 100,
                speed: 1,
                attack: 1,
                defense: 1,
                maxLife: 0,
                winCount: 0,
                pendingItem: 0,
            })),
            isLocked: false,
            maxPlayers: allNames.length,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);

        const name = service.getAvailableVirtualPlayerName('lobby1');
        expect(name).to.match(/Bot$/);
    });

    it('should generate a unique bot name if multiple bots are needed', () => {
        const allNames = VIRTUAL_PLAYER_NAMES;
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [
                ...allNames.map((username, index) => ({
                    id: `${index}`,
                    name: username,
                    avatar: AVATARS.fawn,
                    isHost: false,
                    life: 100,
                    speed: 1,
                    attack: 1,
                    defense: 1,
                    maxLife: 0,
                    winCount: 0,
                    pendingItem: 0,
                })),
                {
                    id: 'extra',
                    name: `${VIRTUAL_PLAYER_NAMES[0]}Bot`,
                    avatar: AVATARS.fawn,
                    isHost: false,
                    life: 100,
                    speed: 1,
                    attack: 1,
                    defense: 1,
                    maxLife: 0,
                    winCount: 0,
                    pendingItem: 0,
                },
            ],
            isLocked: false,
            maxPlayers: allNames.length + 1,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);

        const name = service.getAvailableVirtualPlayerName('lobby1');
        expect(name).to.match(/Bot(\d+)?$/);
    });
    it('should enter the while loop and generate a unique bot name when the base bot name is taken', () => {
        const randomStub = sandbox.stub(Math, 'random').returns(0);
        const randomName = VIRTUAL_PLAYER_NAMES[0];

        const lobby: GameLobby = {
            id: 'lobby1',
            players: [
                ...VIRTUAL_PLAYER_NAMES.map((username, index) => ({
                    id: `${index}`,
                    name: username,
                    avatar: AVATARS.fawn,
                    isHost: false,
                    life: 100,
                    speed: 1,
                    attack: 1,
                    defense: 1,
                    maxLife: 0,
                    winCount: 0,
                    pendingItem: 0,
                })),
                {
                    id: 'extra',
                    name: `${randomName}Bot`,
                    avatar: AVATARS.fawn,
                    isHost: false,
                    life: 100,
                    speed: 1,
                    attack: 1,
                    defense: 1,
                    maxLife: 0,
                    winCount: 0,
                    pendingItem: 0,
                },
            ],
            isLocked: false,
            maxPlayers: VIRTUAL_PLAYER_NAMES.length + 1,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);

        const name = service.getAvailableVirtualPlayerName('lobby1');
        expect(name).to.equal(`${randomName}Bot1`);

        randomStub.restore();
    });
});
