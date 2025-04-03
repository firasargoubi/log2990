/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { BoardService } from '@app/services/board.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { GameEvents } from '@common/events';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { ObjectsTypes, Tile, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createSandbox, match, SinonFakeTimers, SinonSandbox, SinonStub, useFakeTimers } from 'sinon';
import { PathfindingService } from './pathfinding.service';

describe('GameSocketHandlerService', () => {
    let sandbox: SinonSandbox;
    let service: GameSocketHandlerService;
    let lobbies: Map<string, GameLobby>;
    let gameStates: Map<string, GameState>;
    let boardService: BoardService;
    let lobbySocketHandlerService: LobbySocketHandlerService;
    let pathfindingService: PathfindingService;
    let socket: any;
    let ioStub: any;
    let clock: SinonFakeTimers;

    beforeEach(() => {
        sandbox = createSandbox();
        clock = useFakeTimers();
        lobbies = new Map<string, GameLobby>();
        gameStates = new Map<string, GameState>();

        boardService = {
            initializeGameState: sandbox.stub(),
            handleEndTurn: sandbox.stub(),
            handleMovement: sandbox.stub(),
            updatePlayerMoves: sandbox.stub(),
            handleTurn: sandbox.stub(),
            handleBoardChange: sandbox.stub(),
            handleTeleport: sandbox.stub(),
        } as any;

        lobbySocketHandlerService = { updateLobby: sandbox.stub() } as any;
        pathfindingService = { findClosestAvailableSpot: sandbox.stub() } as any;

        service = new GameSocketHandlerService(lobbies, gameStates, boardService, lobbySocketHandlerService, pathfindingService);

        socket = { id: 'socket1', emit: sandbox.stub() };
        ioStub = {
            to: sandbox.stub().callsFake(() => ({
                to: sandbox.stub().callsFake(() => ({
                    emit: socket.emit,
                })),
                emit: socket.emit,
            })),
            emit: socket.emit,
        };
        service['io'] = ioStub;
    });

    afterEach(() => {
        sandbox.restore();
        clock.restore();
    });

    describe('setServer', () => {
        it('should set the server correctly', () => {
            const fakeServer = {} as any;
            service.setServer(fakeServer);
            expect((service as any).io).to.equal(fakeServer);
        });
    });

    describe('handleRequestStart', () => {
        it('should emit error if lobby not found', async () => {
            await service.handleRequestStart(socket, 'unknown');
            expect(socket.emit.calledWith(GameEvents.Error, 'Lobby not found.')).to.equal(true);
        });

        it('should emit error if player is not host', async () => {
            lobbies.set('lobby1', { id: 'lobby1', players: [{ id: 'socket1', isHost: false }], isLocked: false } as any);
            await service.handleRequestStart(socket, 'lobby1');
            expect(socket.emit.calledWith(GameEvents.Error, 'Only the host can start the game.')).to.equal(true);
        });

        it('should start game successfully for host', async () => {
            const lobby = { id: 'lobby1', players: [{ id: 'socket1', isHost: true }], isLocked: false } as GameLobby;
            const gameState = { currentPlayer: 'socket1' } as GameState;
            lobbies.set('lobby1', lobby);
            (boardService.initializeGameState as SinonStub).resolves(gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            await service.handleRequestStart(socket, 'lobby1');

            expect(gameStates.get('lobby1')).to.equal(gameState);
            expect(lobby.isLocked).to.equal(true);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
            expect(socket.emit.calledWith(GameEvents.GameStarted, { gameState })).to.equal(true);
        });

        it('should handle initialization error', async () => {
            const lobby = { id: 'lobby1', players: [{ id: 'socket1', isHost: true }], isLocked: false } as GameLobby;
            lobbies.set('lobby1', lobby);
            (boardService.initializeGameState as SinonStub).rejects(new Error('Init error'));

            await service.handleRequestStart(socket, 'lobby1');

            expect(socket.emit.calledWith(GameEvents.Error, 'Failed to start game: Init error')).to.equal(true);
        });
    });

    describe('handleEndTurn', () => {
        it('should emit error if game not found', () => {
            service.handleEndTurn(socket, 'lobbyX');
            expect(socket.emit.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
        });

        it('should emit error if not current player', () => {
            gameStates.set('lobby1', { currentPlayer: 'other' } as GameState);
            service.handleEndTurn(socket, 'lobby1');
            expect(socket.emit.calledWith(GameEvents.Error, "It's not your turn.")).to.equal(true);
        });

        it('should end turn successfully', () => {
            const gameState = { currentPlayer: 'socket1' } as GameState;
            const updatedGameState = { currentPlayer: 'socket2' } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleEndTurn as SinonStub).returns(updatedGameState);
            (boardService.handleTurn as SinonStub).returns(updatedGameState);

            service.handleEndTurn(socket, 'lobby1');

            expect(gameStates.get('lobby1')).to.equal(updatedGameState);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
        });

        it('should handle error during end turn', () => {
            const gameState = { currentPlayer: 'socket1' } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleEndTurn as SinonStub).throws(new Error('End turn error'));

            service.handleEndTurn(socket, 'lobby1');

            expect(socket.emit.calledWith(GameEvents.Error, 'Failed to end turn: End turn error')).to.equal(true);
        });
    });

    describe('handleRequestMovement', () => {
        beforeEach(() => {
            sandbox.stub(service, 'emitMovementUpdate').returns(undefined);
        });

        it('should emit error if game not found', () => {
            service.handleRequestMovement(socket, 'lobbyX', [{ x: 0, y: 0 }]);
            expect(socket.emit.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
        });

        it('should process single coordinate without movement', async () => {
            const gameState = {
                currentPlayer: 'socket1',
                players: [{ id: 'socket1', pendingItem: 0 }],
                animation: undefined,
            } as GameState;
            gameStates.set('lobby1', gameState);

            await service.handleRequestMovement(socket, 'lobby1', [{ x: 0, y: 0 }]);
            expect(gameState.animation).to.equal(undefined);
        });

        it('should process full movement path without stopping', async () => {
            const gameState = {
                currentPlayer: 'socket1',
                players: [{ id: 'socket1', pendingItem: 0 }],
                animation: false,
            } as GameState;
            gameStates.set('lobby1', gameState);

            (boardService.handleMovement as SinonStub).resolves({ gameState, shouldStop: false });

            await service.handleRequestMovement(socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ]);

            expect(gameState.animation).to.equal(false);
        });

        it('should handle inventory full scenario', async () => {
            const gameState = {
                currentPlayer: 'socket1',
                players: [{ id: 'socket1', pendingItem: 1, items: [] }],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).returns({ gameState, shouldStop: true });

            await service.handleRequestMovement(socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ]);

            expect(socket.emit.calledWith('inventoryFull')).to.equal(true);
            expect(gameState.animation).to.equal(false);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
            expect(socket.emit.calledWith('movementProcessed', { gameState })).to.equal(true);
            clock.tick(150);
        });

        it('should handle movement error', async () => {
            const gameState = { currentPlayer: 'socket1', players: [{ id: 'socket1' }] } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as SinonStub).throws(new Error('Move error'));

            await service.handleRequestMovement(socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ]);

            expect(socket.emit.calledWith(GameEvents.Error, 'Movement error:Move error')).to.equal(true);
            expect(ioStub.to.called).to.equal(false);
        });
    });

    describe('handleTeleport', () => {
        it('should emit error if game not found', () => {
            service.handleTeleport(socket, 'lobbyX', { x: 1, y: 1 });
            expect(socket.emit.calledWith('error', 'Game not found.')).to.equal(true);
        });

        it('should teleport successfully', () => {
            const gameState = { board: [[TileTypes.Floor]] } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTeleport as SinonStub).returns(gameState);

            service.handleTeleport(socket, 'lobby1', { x: 1, y: 1 });

            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
            expect(socket.emit.calledWith('boardModified', { gameState })).to.equal(true);
        });

        it('should handle teleport error', () => {
            const gameState = { board: [[TileTypes.Floor]] } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTeleport as SinonStub).throws(new Error('Teleport error'));

            service.handleTeleport(socket, 'lobby1', { x: 1, y: 1 });

            expect(socket.emit.calledWith('error', 'Teleport error: Teleport error')).to.equal(true);
        });
    });

    describe('startTurn', () => {
        it('should do nothing if game not found', () => {
            service.startTurn('lobbyX');
            expect(ioStub.to.called).to.equal(false);
        });

        it('should start turn successfully', () => {
            const gameState = { currentPlayer: 'socket1' } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.startTurn('lobby1');

            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
            expect(socket.emit.calledWith(GameEvents.TurnStarted, { gameState })).to.equal(true);
        });

        it('should handle turn error', () => {
            const gameState = { currentPlayer: 'socket1' } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).throws(new Error('Turn error'));

            service.startTurn('lobby1');

            expect(socket.emit.calledWith(GameEvents.Error, 'Turn error:Turn error')).to.equal(true);
        });
    });

    describe('closeDoor', () => {
        it('should emit error if game not found', () => {
            service.closeDoor(socket, { x: 0, y: 0 } as Tile, 'lobbyX');
            expect(socket.emit.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
        });

        it('should close door and update board', () => {
            const gameState = {
                board: [[TileTypes.DoorOpen]],
                players: [{ id: 'socket1', currentAP: 2 }],
                currentPlayer: 'socket1',
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.closeDoor(socket, { x: 0, y: 0 } as Tile, 'lobby1');

            expect(gameState.board[0][0]).to.equal(TileTypes.DoorClosed);
            expect(gameState.players[0].currentAP).to.equal(0);
            expect(gameState.currentPlayerActionPoints).to.equal(0);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
            expect(socket.emit.calledWith(GameEvents.BoardModified, { gameState })).to.equal(true);
        });

        it('should handle case where current player is not found', () => {
            const gameState = {
                board: [[TileTypes.DoorOpen]],
                players: [{ id: 'other', currentAP: 2 }],
                currentPlayer: 'socket1',
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.closeDoor(socket, { x: 0, y: 0 } as Tile, 'lobby1');

            expect(gameState.board[0][0]).to.equal(TileTypes.DoorClosed);
            expect(gameState.players[0].currentAP).to.equal(2);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
        });
    });

    describe('openDoor', () => {
        it('should emit error if game not found', () => {
            service.openDoor(socket, { x: 0, y: 0 } as Tile, 'lobbyX');
            expect(socket.emit.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
        });

        it('should open door and update board', () => {
            const gameState = {
                board: [[TileTypes.DoorClosed]],
                players: [{ id: 'socket1', currentAP: 2 }],
                currentPlayer: 'socket1',
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.openDoor(socket, { x: 0, y: 0 } as Tile, 'lobby1');

            expect(gameState.board[0][0]).to.equal(TileTypes.DoorOpen);
            expect(gameState.players[0].currentAP).to.equal(0);
            expect(gameState.currentPlayerActionPoints).to.equal(0);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
            expect(socket.emit.calledWith(GameEvents.BoardModified, { gameState })).to.equal(true);
        });

        it('should handle case where current player is not found', () => {
            const gameState = {
                board: [[TileTypes.DoorClosed]],
                players: [{ id: 'other', currentAP: 2 }],
                currentPlayer: 'socket1',
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.openDoor(socket, { x: 0, y: 0 } as Tile, 'lobby1');

            expect(gameState.board[0][0]).to.equal(TileTypes.DoorOpen);
            expect(gameState.players[0].currentAP).to.equal(2);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
        });
    });

    describe('startBattle', () => {
        it('should do nothing if game not found', () => {
            service.startBattle('lobbyX', { id: 'p1' } as Player, { id: 'p2' } as Player);
            expect(ioStub.to.called).to.equal(false);
        });

        it('should start battle with faster opponent first', () => {
            const currentPlayer = { id: 'p1', speed: 5 } as Player;
            const opponent = { id: 'p2', speed: 10 } as Player;
            const gameState = { players: [currentPlayer, opponent], currentPlayerActionPoints: 1 } as GameState;
            gameStates.set('lobby1', gameState);

            service.startBattle('lobby1', currentPlayer, opponent);

            expect(gameState.currentPlayerActionPoints).to.equal(0);
            expect(currentPlayer.amountEscape).to.equal(0);
            expect(opponent.amountEscape).to.equal(0);
            expect(gameState.players[0].currentAP).to.equal(0);
            expect(gameState.players[1].amountEscape).to.equal(0);
            expect(ioStub.to.calledWith('p2')).to.equal(true);
            expect(socket.emit.calledWith('startCombat', { firstPlayer: opponent })).to.equal(true);
        });

        it('should start battle with current player if speeds are equal', () => {
            const currentPlayer = { id: 'p1', speed: 5 } as Player;
            const opponent = { id: 'p2', speed: 5 } as Player;
            const gameState = { players: [currentPlayer, opponent] } as GameState;
            gameStates.set('lobby1', gameState);

            service.startBattle('lobby1', currentPlayer, opponent);

            expect(socket.emit.calledWith('startCombat', { firstPlayer: currentPlayer })).to.equal(true);
        });

        it('should handle case where one player is not found', () => {
            const currentPlayer = { id: 'p1', speed: 5 } as Player;
            const opponent = { id: 'p2', speed: 10 } as Player;
            const gameState = { players: [{ id: 'p1' }], currentPlayerActionPoints: 1 } as GameState;
            gameStates.set('lobby1', gameState);

            service.startBattle('lobby1', currentPlayer, opponent);

            expect(gameState.players[0].amountEscape).to.equal(0);
            expect(gameState.players[0].currentAP).to.equal(0);
            expect(ioStub.to.calledWith('p1')).to.equal(true);
        });
    });

    describe('handlePlayersUpdate', () => {
        it('should do nothing if game not found', () => {
            service.handlePlayersUpdate(socket, 'lobbyX', []);
            expect(socket.emit.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
        });

        it('should handle no player deletion', () => {
            const gameState = { players: [{ id: 'p1' }], board: [[]], playerPositions: [], spawnPoints: [] } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.handlePlayersUpdate(socket, 'lobby1', [{ id: 'p1' } as Player]);

            expect(gameState.players.length).to.equal(1);
            expect(gameState.deletedPlayers).to.equal(undefined);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
        });

        it('should initialize deletedPlayers if undefined', () => {
            const gameState = {
                players: [{ id: 'p1' }, { id: 'p2' }],
                board: [[0]],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleBoardChange as SinonStub).returns(gameState);

            service.handlePlayersUpdate(socket, 'lobby1', [{ id: 'p1' } as Player]);

            expect(gameState.deletedPlayers).to.have.lengthOf(1);
            expect(gameState.deletedPlayers[0].id).to.equal('p2');
        });
    });

    describe('handleDefeat', () => {
        it('should do nothing if game not found', () => {
            service.handleDefeat('lobbyX', { id: 'p1' } as Player, { id: 'p2' } as Player);
            expect(ioStub.to.called).to.equal(false);
        });

        it('should do nothing if players not found', () => {
            const gameState = { players: [{ id: 'p3' }] } as GameState;
            gameStates.set('lobby1', gameState);

            service.handleDefeat('lobby1', { id: 'p1' } as Player, { id: 'p2' } as Player);

            expect(ioStub.to.called).to.equal(false);
        });

        it('should handle defeat when loser is not current player', () => {
            const winner = { id: 'p1', maxLife: 10, life: 5 } as Player;
            const loser = { id: 'p2', maxLife: 10, life: 0 } as Player;
            const gameState = {
                players: [winner, loser],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 2, y: 2 },
                ],
                currentPlayer: 'p3',
            } as GameState;
            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.handleDefeat('lobby1', winner, loser);

            expect(winner.life).to.equal(10);
            expect(loser.life).to.equal(10);
            expect(gameState.playerPositions[1]).to.deep.equal({ x: 2, y: 2 });
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
            expect(socket.emit.calledWith('combatEnded', { loser })).to.equal(true);
            expect(socket.emit.calledWith(GameEvents.BoardModified, { gameState })).to.equal(true);
        });

        it('should find new spawn if original is occupied', () => {
            const winner = { id: 'p1', maxLife: 10, life: 5 } as Player;
            const loser = { id: 'p2', maxLife: 10, life: 0 } as Player;
            const gameState = {
                players: [winner, loser],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
                currentPlayer: 'p3',
            } as GameState;
            const newSpawn = { x: 2, y: 2 };
            gameStates.set('lobby1', gameState);
            (pathfindingService.findClosestAvailableSpot as SinonStub).returns(newSpawn);
            (boardService.handleTurn as SinonStub).returns(gameState);

            service.handleDefeat('lobby1', winner, loser);

            expect(gameState.playerPositions[1]).to.deep.equal(newSpawn);
            expect((pathfindingService.findClosestAvailableSpot as SinonStub).called).to.equal(true);
        });
    });

    describe('handleSetDebug', () => {
        it('should emit error if game not found', () => {
            service.handleSetDebug(socket, 'lobbyX', true);
            expect(socket.emit.calledWith('error', 'Game not found.')).to.equal(true);
        });
    });

    describe('handleAttackAction', () => {
        let attacker: Player;
        let defender: Player;
        let gameState: GameState;

        beforeEach(() => {
            attacker = {
                id: 'p1',
                life: 10,
                attack: 5,
                bonus: { attack: 'D6', defense: 'D6' },
                defense: 0,
                items: [ObjectsTypes.POTION],
                winCount: 0,
                name: 'Attacker',
            } as Player;

            defender = {
                id: 'p2',
                life: 1,
                defense: 3,
                bonus: { attack: 'D6', defense: 'D6' },
                items: [ObjectsTypes.JUICE],
                maxLife: 10,
            } as Player;

            gameState = {
                players: [attacker, defender],
                board: [[TileTypes.Floor]],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 0, y: 1 },
                ],
                debug: false,
            } as any;

            gameStates.set('lobby1', gameState);
            sandbox.stub(service, 'handleDefeat');
        });

        it('should do nothing if players not found', () => {
            service.handleAttackAction('lobby1', { id: 'p3' } as Player, { id: 'p4' } as Player);
            expect(ioStub.to.called).to.equal(false);
        });

        it('should handle zero damage', () => {
            attacker.attack = 1;
            defender.defense = 10;
            sandbox.stub(Math, 'random').returns(0); // Low rolls
            service.handleAttackAction('lobby1', attacker, defender);
            expect(defender.life).to.equal(4); // Juice effect
            expect(socket.emit.calledWith('attackResult', match({ damage: 0 }))).to.equal(true);
        });

        it('should end game if winCount reaches MAX_WIN_COUNT', () => {
            attacker.winCount = 2;
            defender.life = 1;
            sandbox.stub(Math, 'random').returns(0.99); // High roll to ensure defeat
            service.handleAttackAction('lobby1', attacker, defender);
            expect(attacker.winCount).to.equal(3);
            expect(socket.emit.calledWith('gameOver', { winner: 'Attacker' })).to.equal(true);
            expect((service.handleDefeat as SinonStub).called).to.equal(false);
        });

        it('should use debug mode dice values', () => {
            gameState.debug = true;
            service.handleAttackAction('lobby1', attacker, defender);
            expect(socket.emit.calledWith('attackResult', match({ attackRoll: 5, defenseRoll: 1 }))).to.equal(true);
        });

        it('should apply ice tile penalty to attacker', () => {
            gameState.board[0][0] = TileTypes.Ice;
            sandbox.stub(Math, 'random').returns(0.5);
            service.handleAttackAction('lobby1', attacker, defender);
            expect(socket.emit.calledWith('attackResult', match({ attackRoll: 5 + 3 - 2 }))).to.equal(true);
        });

        it('should apply ice tile penalty to defender', () => {
            gameState.board[0][1] = TileTypes.Ice;
            sandbox.stub(Math, 'random').returns(0.5);
            service.handleAttackAction('lobby1', attacker, defender);
            expect(socket.emit.calledWith('attackResult', match({ defenseRoll: 3 + 3 - 2 }))).to.equal(true);
        });
    });

    describe('handleFlee', () => {
        it('should do nothing if game not found', () => {
            service.handleFlee('lobbyX', { id: 'p1' } as Player);
            expect(ioStub.to.called).to.equal(false);
        });

        it('should prevent flee after 2 attempts', () => {
            const player = { id: 'p1', amountEscape: 2 } as Player;
            gameStates.set('lobby1', { players: [player] } as GameState);
            service.handleFlee('lobby1', player);
            expect(player.amountEscape).to.equal(2);
            expect(socket.emit.calledWith(GameEvents.FleeFailure)).to.equal(true);
        });

        it('should succeed in debug mode', () => {
            const player = { id: 'p1', amountEscape: 1 } as Player;
            gameStates.set('lobby1', { players: [player], debug: true } as GameState);
            sandbox.stub(Math, 'random').returns(0.99);
            service.handleFlee('lobby1', player);
            expect(socket.emit.calledWith(GameEvents.FleeSuccess)).to.equal(true);
            expect(player.amountEscape).to.equal(0);
        });

        it('should initialize amountEscape if undefined', () => {
            const player = { id: 'p1' } as Player;
            const gameState = { players: [player] } as GameState;
            gameStates.set('lobby1', gameState);

            service.handleFlee('lobby1', player);

            expect(player.amountEscape).to.equal(1);
            expect(ioStub.to.calledWith('lobby1')).to.equal(true);
        });

        it('should increment amountEscape and fail if random exceeds threshold', () => {
            const player = { id: 'p1', amountEscape: 0 } as Player;
            const gameState = { players: [player] } as GameState;
            gameStates.set('lobby1', gameState);
            sandbox.stub(Math, 'random').returns(0.9);

            service.handleFlee('lobby1', player);

            expect(player.amountEscape).to.equal(1);
            expect(socket.emit.calledWith(GameEvents.FleeFailure)).to.equal(true);
        });
    });

    describe('Utility Methods', () => {
        it('should return correct dice values', () => {
            expect((service as any).getDiceValue('D4')).to.equal(4);
            expect((service as any).getDiceValue('D6')).to.equal(6);
            expect((service as any).getDiceValue('D10')).to.equal(0);
        });

        it('should detect ice tile correctly', () => {
            const gameState = {
                players: [{ id: 'p1' }],
                playerPositions: [{ x: 0, y: 0 }],
                board: [[TileTypes.Ice]],
            } as any;
            expect((service as any).isPlayerOnIceTile(gameState, { id: 'p1' })).to.equal(true);
        });

        it('should handle invalid position in isPlayerOnIceTile', () => {
            const gameState = { players: [{ id: 'p1' }], playerPositions: [{ x: 10, y: 10 }], board: [[]] } as any;
            expect((service as any).isPlayerOnIceTile(gameState, { id: 'p1' })).to.equal(false);
        });
    });
});
