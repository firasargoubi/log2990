/* eslint-disable @typescript-eslint/no-explicit-any */
import { ValidationSocketHandlerService } from '@app/services/validation-socket-handler.service';
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
});
