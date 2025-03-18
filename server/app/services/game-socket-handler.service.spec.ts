/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoardService } from '@app/services/board.service';
import { GameSocketHandlerService, isTileValid, isWithinBounds } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { GameEvents } from '@common/events'; // Ensure this path is correct
import { GameState } from '@common/game-state';
import { TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createSandbox, match, SinonFakeTimers, SinonSandbox, SinonStub, useFakeTimers } from 'sinon';

describe('GameSocketHandlerService', () => {
    let sandbox: SinonSandbox;
    let lobbies: Map<string, GameLobby>;
    let gameStates: Map<string, GameState>;
    let boardService: BoardService;
    let lobbySocketHandlerService: LobbySocketHandlerService;
    let service: GameSocketHandlerService;
    let socket: any;
    let clock: SinonFakeTimers;

    let emitStub: SinonStub;
    let ioToStub: SinonStub;
    let ioToToStub: SinonStub;

    beforeEach(() => {
        sandbox = createSandbox();
        lobbies = new Map<string, GameLobby>();
        gameStates = new Map<string, GameState>();
        clock = useFakeTimers();

        boardService = {
            initializeGameState: sandbox.stub(),
            handleEndTurn: sandbox.stub(),
            handleMovement: sandbox.stub(),
            findShortestPath: sandbox.stub(),
            handleTurn: sandbox.stub(),
            handleBoardChange: sandbox.stub(),
        } as any;

        lobbySocketHandlerService = {
            updateLobby: sandbox.stub(),
        } as any;

        service = new GameSocketHandlerService(lobbies, gameStates, boardService, lobbySocketHandlerService);

        emitStub = sandbox.stub();
        ioToToStub = sandbox.stub().returns({ emit: emitStub });
        ioToStub = sandbox.stub().returns({ to: ioToToStub, emit: emitStub });
        service['io'] = { to: ioToStub } as any;

        socket = { id: 'socket1', emit: emitStub };
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    it('should emit error if lobby not found in handleRequestStart', async () => {
        await service.handleRequestStart(socket, 'unknown');
        expect(emitStub.calledWith('error', 'Lobby not found.')).to.equal(true);
    });

    it('should emit error if player not host in handleRequestStart', async () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [{ id: 'socket1', isHost: false } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);
        await service.handleRequestStart(socket, 'lobby1');
        expect(emitStub.calledWith('error', 'Only the host can start the game.')).to.equal(true);
    });

    it('should handleRequestStart successfully', async () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [{ id: 'socket1', isHost: true } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        const gameState: GameState = {
            currentPlayer: 'socket1',
            availableMoves: [],
            currentPlayerMovementPoints: 3,
            playerPositions: new Map([['socket1', { x: 0, y: 0 }]]),
        } as any;

        (boardService.initializeGameState as any).resolves(gameState);
        (boardService.handleTurn as any).returns(gameState);

        lobbies.set('lobby1', lobby);

        await service.handleRequestStart(socket, 'lobby1');

        expect(gameStates.get('lobby1')).to.deep.equal(gameState);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should emit error on gameState not found in handleEndTurn', () => {
        service.handleEndTurn(socket, 'lobbyX');
        expect(emitStub.calledWith('error', 'Game not found.')).to.equal(true);
    });

    it('should emit error if not currentPlayer in handleEndTurn', () => {
        const gameState = { currentPlayer: 'other' } as GameState;
        gameStates.set('lobby1', gameState);
        service.handleEndTurn(socket, 'lobby1');
        expect(emitStub.calledWith('error', "It's not your turn.")).to.equal(true);
    });

    it('should handleEndTurn successfully', () => {
        const gameState: GameState = { currentPlayer: 'socket1' } as any;
        const updatedGameState = { currentPlayer: 'socket2', availableMoves: [], playerPositions: new Map() } as any;
        (boardService.handleEndTurn as any).returns(updatedGameState);
        (boardService.handleTurn as any).returns(updatedGameState);
        gameStates.set('lobby1', gameState);
        service.handleEndTurn(socket, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should emit error if gameState not found in handleRequestMovement', () => {
        service.handleRequestMovement(socket, 'lobbyX', [{ x: 0, y: 0 }]);
        expect(emitStub.calledWith('error', 'Game not found.')).to.equal(true);
    });

    it('should handleRequestMovement and call endTurn if no moves left', () => {
        const gs = {
            currentPlayer: 'socket1',
            availableMoves: [{ x: 1, y: 1 }],
            playerPositions: new Map(),
        } as unknown as GameState;
        const updated = { currentPlayer: 'socket2', availableMoves: [], playerPositions: new Map() } as any;
        (boardService.handleMovement as any).returns(updated);
        (boardService.handleTurn as any).returns(updated);
        gameStates.set('lobby1', gs);
        service.handleRequestMovement(socket, 'lobby1', [{ x: 1, y: 1 }]);
        clock.runAll();
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should call handleEndTurnInternally correctly', () => {
        const gs: GameState = {} as GameState;
        (boardService.handleEndTurn as any).returns(gs);
        const result = service.handleEndTurnInternally(gs);
        expect(result).to.equal(gs);
    });
    it('should set server correctly', () => {
        const fakeServer = {} as any;
        service.setServer(fakeServer);
        expect((service as any).io).to.equal(fakeServer);
    });

    it('should exit from startTurn if lobbyId not in gameStates', () => {
        service.startTurn('lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(false);
    });

    it('should call startTurn at the end of handleRequestStart', async () => {
        const spy = sandbox.spy(service, 'startTurn');
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [{ id: 'socket1', isHost: true } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);

        const gs = {
            currentPlayer: 'socket1',
            playerPositions: new Map(),
            availableMoves: [],
            currentPlayerMovementPoints: 3,
        } as unknown as GameState;

        (boardService.initializeGameState as any).resolves(gs);
        (boardService.handleTurn as any).returns(gs);

        await service.handleRequestStart(socket, 'lobby1');

        expect(spy.calledWith('lobby1')).to.equal(true);
    });
    it('should emit error if initializeGameState throws in handleRequestStart', async () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [{ id: 'socket1', isHost: true } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        lobbies.set('lobby1', lobby);
        (boardService.initializeGameState as any).rejects(new Error('Init error'));

        await service.handleRequestStart(socket, 'lobby1');
        expect(emitStub.calledWith('error', 'Failed to start game: Init error')).to.equal(true);
    });
    it('should emit error if handleEndTurn throws in handleEndTurn', () => {
        const gameState: GameState = { currentPlayer: 'socket1' } as any;
        gameStates.set('lobby1', gameState);
        (boardService.handleEndTurn as any).throws(new Error('EndTurn error'));

        service.handleEndTurn(socket, 'lobby1');
        expect(emitStub.calledWith('error', 'Failed to end turn: EndTurn error')).to.equal(true);
    });

    it('should emit error if handleTurn throws in startTurn', () => {
        const gameState: GameState = {
            currentPlayer: 'socket1',
            availableMoves: [],
            playerPositions: new Map(),
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleTurn as any).throws(new Error('Turn error'));

        service.startTurn('lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('error', 'Turn error:Turn error')).to.equal(true);
    });
    it('should emit error if gameState not found in closeDoor', () => {
        service.closeDoor(socket, { x: 0, y: 0 } as any, 'lobbyX');
        expect(emitStub.calledWith('error', 'Game not found.')).to.equal(true);
    });

    it('should update board and emit boardModified in closeDoor', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
        } as any;
        gameStates.set('lobby1', gameState);
        (boardService.handleBoardChange as any) = sandbox.stub().returns(gameState);

        service.closeDoor(socket, { x: 0, y: 0 } as any, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should emit error if gameState not found in openDoor', () => {
        service.openDoor(socket, { x: 0, y: 0 } as any, 'lobbyX');
        expect(emitStub.calledWith('error', 'Game not found.')).to.equal(true);
    });

    it('should update board and emit boardModified in openDoor', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
        } as any;
        gameStates.set('lobby1', gameState);
        (boardService.handleBoardChange as any) = sandbox.stub().returns(gameState);

        service.openDoor(socket, { x: 0, y: 0 } as any, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });
    it('should emit error if gameState not found in closeDoor', () => {
        service.closeDoor(socket, { x: 0, y: 0 } as any, 'lobbyX');
        expect(emitStub.calledWith('error', 'Game not found.')).to.equal(true);
    });

    it('should update board and emit boardModified in closeDoor', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
        } as any;
        gameStates.set('lobby1', gameState);
        (boardService.handleBoardChange as any) = sandbox.stub().returns(gameState);

        service.closeDoor(socket, { x: 0, y: 0 } as any, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should emit error if gameState not found in openDoor', () => {
        service.openDoor(socket, { x: 0, y: 0 } as any, 'lobbyX');
        expect(emitStub.calledWith('error', 'Game not found.')).to.equal(true);
    });

    it('should update board and emit boardModified in openDoor', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
        } as any;
        gameStates.set('lobby1', gameState);
        (boardService.handleBoardChange as any) = sandbox.stub().returns(gameState);

        service.openDoor(socket, { x: 0, y: 0 } as any, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should handle players update when a player is removed', () => {
        const player1 = { id: 'socket1', name: 'Player 1' } as Player;
        const player2 = { id: 'socket2', name: 'Player 2' } as Player;
        const player3 = { id: 'socket3', name: 'Player 3' } as Player;

        const gameState: GameState = {
            currentPlayer: 'socket1',
            players: [player1, player2, player3],
            board: [
                [1, 1, 61],
                [1, 1, 1],
                [1, 61, 1],
            ],
            playerPositions: [
                { x: 0, y: 2 },
                { x: 2, y: 1 },
                { x: 1, y: 1 },
            ],
            spawnPoints: [
                { x: 0, y: 2 },
                { x: 2, y: 1 },
            ],
            availableMoves: [],
        } as any;

        gameStates.set('lobby1', gameState);

        const updatedPlayers = [player1, player3];

        (boardService.handleBoardChange as any).returns(gameState);

        service.handlePlayersUpdate(socket, 'lobby1', updatedPlayers);

        const updatedGameState = gameStates.get('lobby1');

        expect(updatedGameState!.players).to.have.lengthOf(2);
        expect(updatedGameState!.players.some((p) => p.id === 'socket2')).to.equal(false);

        expect(updatedGameState!.board[2][1]).to.equal(1);

        expect(updatedGameState!.playerPositions).to.have.lengthOf(2);

        expect(updatedGameState!.spawnPoints).to.have.lengthOf(1);

        expect(updatedGameState!.deletedPlayers).to.have.lengthOf(1);
        expect(updatedGameState!.deletedPlayers![0].id).to.equal('socket2');

        if (gameState.currentPlayer === 'socket2') {
            expect(updatedGameState!.currentPlayer).not.to.equal('socket2');
        }

        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('boardModified')).to.equal(true);
    });

    it('should handle players update when no players are removed', () => {
        const player1 = { id: 'socket1', name: 'Player 1' } as Player;
        const player2 = { id: 'socket2', name: 'Player 2' } as Player;

        const gameState: GameState = {
            currentPlayer: 'socket1',
            players: [player1, player2],
            board: [
                [1, 1, 61],
                [1, 1, 1],
                [1, 61, 1],
            ],
            playerPositions: [
                { x: 0, y: 2 },
                { x: 2, y: 1 },
            ],
            spawnPoints: [
                { x: 0, y: 2 },
                { x: 2, y: 1 },
            ],
            availableMoves: [],
        } as any;

        gameStates.set('lobby1', gameState);

        const updatedPlayers = [player1, player2];

        (boardService.handleBoardChange as any).returns(gameState);

        const originalPlayersLength = gameState.players.length;
        const originalPlayerPositionsLength = gameState.playerPositions.length;
        const originalSpawnPointsLength = gameState.spawnPoints.length;

        service.handlePlayersUpdate(socket, 'lobby1', updatedPlayers);

        const updatedGameState = gameStates.get('lobby1');

        expect(updatedGameState!.players).to.have.lengthOf(originalPlayersLength);

        expect(updatedGameState!.playerPositions).to.have.lengthOf(originalPlayerPositionsLength);

        expect(updatedGameState!.spawnPoints).to.have.lengthOf(originalSpawnPointsLength);

        expect(updatedGameState!.deletedPlayers).to.be.undefined;

        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('boardModified')).to.equal(true);
    });

    it('should emit error if gameState not found in handlePlayersUpdate', () => {
        const players = [{ id: 'player1' }] as Player[];
        service.handlePlayersUpdate(socket, 'nonexistentLobby', players);
        expect(emitStub.calledWith('error', 'Game not found.')).to.equal(true);
    });
    it('should emit playersBattling event in initializeBattle', () => {
        service.initializeBattle(socket, { id: 'p1' } as Player, { id: 'p2' } as Player);
        expect(ioToStub.calledWith('p1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('playersBattling', { isInCombat: true })).to.be.true;
    });

    it('should emit PlayerTurn with correct playerTurn and countDown in startBattle', () => {
        const currentPlayer = { id: 'p1', amountEscape: 2 } as Player;
        const opponent = { id: 'p2', amountEscape: 0 } as Player;
        const gameState = { players: [currentPlayer, opponent], debug: false } as GameState;
        gameStates.set('lobby1', gameState);

        service.startBattle('lobby1', currentPlayer, opponent, 5);

        expect(ioToStub.calledWith('p1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('startCombat', { firstPlayer: currentPlayer })).to.be.true;
    });

    it('should emit PlayerSwitch with newPlayerTurn and countDown in changeTurnEnd', () => {
        const currentPlayer = { id: 'p1', amountEscape: 1 } as Player;
        const opponent = { id: 'p2', amountEscape: 2 } as Player;
        const gameState = { players: [currentPlayer, opponent] } as GameState;

        service.changeTurnEnd(currentPlayer, opponent, 'p1', gameState);

        expect(ioToStub.calledWith('p1')).to.be.true;
        expect(ioToToStub.calledWith('p2')).to.be.true;

        const emit = ioToToStub.returnValues[0].emit;
        expect(
            emit.calledWith('PlayerSwitch', {
                newPlayerTurn: 'p2',
                countDown: 3,
                attackerId: 'p2',
                defenderId: 'p1',
            }),
        ).to.be.true;
    });
    it('should emit changedSpawnPoint when handleDefeat is called', () => {
        const player = { id: 'p1' } as Player;
        const gameState = {
            players: [player],
            playerPositions: [{}],
            spawnPoints: [{ x: 1, y: 1 }],
        } as GameState;

        gameStates.set('lobby1', gameState);

        service.handleDefeat(player, 'lobby1');

        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('combatEnded', { winner: player })).to.be.true;
    });

    it('should reduce life and emit attackResult in handleAttackAction', () => {
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'p2', life: 10, defense: 3 } as Player;
        const gameState = {
            players: [attacker, defender],
            board: [[TileTypes.Floor]],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 0, y: 0 },
            ],
            debug: false,
        } as GameState;
        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0.5);
        service.handleAttackAction('lobby1', attacker, defender);

        expect(defender.life).to.be.lessThanOrEqual(10);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('attackResult')).to.be.true;
    });

    it('should emit fleeSuccess when handleFlee succeeds', () => {
        const player = { id: 'p1' } as Player;
        const gameState = {
            players: [player],
            board: [[0]],
            playerPositions: [{ x: 0, y: 0 }],
            spawnPoints: [{ x: 0, y: 0 }],
        } as GameState;

        gameStates.set('lobby1', gameState);

        const originalMathRandom = Math.random;
        Math.random = () => 0.1;

        service.handleFlee('lobby1', player);

        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('fleeSuccess', { fleeingPlayer: player, isSuccessful: true })).to.be.true;
        Math.random = originalMathRandom;
    });
    it('should increment amountEscape and emit fleeFailure when handleFlee fails', () => {
        const player = { id: 'p1', amountEscape: 2 } as Player;
        const gameState = { players: [player] } as GameState;
        gameStates.set('lobby1', gameState);

        service.handleFlee('lobby1', player);

        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('fleeFailure', { fleeingPlayer: player })).to.be.true;
    });

    it('should initialize amountEscape to 1 if undefined in handleFlee', () => {
        const player = { id: 'p1' } as Player;
        const gameState = { players: [player] } as GameState;
        gameStates.set('lobby1', gameState);

        service.handleFlee('lobby1', player);
        expect(player.amountEscape).to.equal(1);
    });
    it('should emit attackEnd with isInCombat false in handleTerminateAttack', () => {
        service.handleTerminateAttack('lobby1');
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('attackEnd', { isInCombat: false })).to.be.true;
    });
    it('should skip player deletion in handlePlayersUpdate if all players are present', () => {
        const player1 = { id: 'p1' } as Player;
        const gameState: GameState = {
            players: [player1],
            playerPositions: [
                {
                    x: 0,
                    y: 0,
                },
            ],
            spawnPoints: [
                {
                    x: 0,
                    y: 0,
                },
            ],
            board: [[0]],
            availableMoves: [],
            currentPlayer: 'p1',
            id: '',
            turnCounter: 0,
            shortestMoves: [],
            currentPlayerMovementPoints: 0,
            currentPlayerActionPoints: 0,
            debug: false,
        };
        gameStates.set('lobby1', gameState);
        const players = [player1];
        (boardService.handleBoardChange as any).returns(gameState);
        service.handlePlayersUpdate(socket, 'lobby1', players);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
    });

    it('should not reassign currentPlayer if deletedPlayer is not current', () => {
        const player1 = { id: 'p1' } as Player;
        const player2 = { id: 'p2' } as Player;
        const gameState: GameState = {
            players: [player1, player2],
            currentPlayer: 'p1',
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            board: [
                [1, 2],
                [3, 4],
            ],
            availableMoves: [],
            id: '',
            turnCounter: 0,
            shortestMoves: [],
            currentPlayerMovementPoints: 0,
            currentPlayerActionPoints: 0,
            debug: false,
        };
        gameStates.set('lobby1', gameState);
        (boardService.handleBoardChange as any).returns(gameState);
        service.handlePlayersUpdate(socket, 'lobby1', [player1]);
        expect(gameStates.get('lobby1')!.deletedPlayers!.length).to.equal(1);
    });

    it('should not proceed if player not found in handleAttackAction', () => {
        gameStates.set('lobby1', { players: [], debug: false } as GameState);
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'opponent', life: 10, defense: 3 } as Player;
        service.handleAttackAction('lobby1', attacker, defender);
        expect(ioToStub.calledWith('lobby1')).to.be.false;
    });

    it('should not proceed if no gameState in handleAttackAction', () => {
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'op', life: 5, defense: 3 } as Player;
        service.handleAttackAction('notFoundLobby', attacker, defender);
        expect(ioToStub.calledWith('notFoundLobby')).to.be.false;
    });

    it('should not reduce life if damage is 0 in handleAttackAction', () => {
        const attacker = { id: 'p1', life: 10, attack: 1 } as Player;
        const defender = { id: 'p2', life: 10, defense: 5 } as Player;
        const gameState: GameState = {
            players: [attacker, defender],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            board: [
                [0, 0],
                [0, 0],
            ],
        } as GameState;
        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0);

        service.handleAttackAction('lobby1', attacker, defender);

        expect(defender.life).to.equal(10);
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('attackResult')).to.be.true;
    });
    it('should emit startCombat with correct playerTurn when opponent has first index in startBattle', () => {
        const currentPlayer = { id: 'p1', amountEscape: 0 } as Player;
        const opponent = { id: 'p2', amountEscape: 0 } as Player;
        const gameState = { players: [opponent, currentPlayer], debug: false } as GameState;
        gameStates.set('lobby1', gameState);

        service.startBattle('lobby1', currentPlayer, opponent, 5);

        expect(ioToStub.calledWith('p1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('startCombat', { firstPlayer: opponent })).to.be.true;
    });
    it('should emit PlayerSwitch with currentPlayer when player.id is not currentPlayer.id', () => {
        const currentPlayer = { id: 'p1', amountEscape: 0 } as Player;
        const opponent = { id: 'p2', amountEscape: 0 } as Player;
        const gameState = { players: [currentPlayer, opponent] } as GameState;

        service.changeTurnEnd(currentPlayer, opponent, 'p2', gameState);

        expect(ioToStub.calledWith('p1')).to.be.true;
        expect(ioToToStub.calledWith('p2')).to.be.true;

        const emit = ioToToStub.returnValues[0].emit;
        expect(
            emit.calledWith('PlayerSwitch', {
                newPlayerTurn: 'p1',
                countDown: 5,
                attackerId: 'p1',
                defenderId: 'p2',
            }),
        ).to.be.true;
    });

    it('should not emit anything if player not found in handleDefeat', () => {
        const player = { id: 'pX' } as Player;
        const gameState: GameState = {
            players: [{ id: 'p1' }],
            spawnPoints: [],
            playerPositions: [],
        } as GameState;

        gameStates.set('lobby1', gameState);

        service.handleDefeat(player, 'lobby1');

        expect(ioToStub.called).to.be.false;
    });
    it('should process movement correctly with animation flag and call endTurn when done', () => {
        const gameState: GameState = {
            currentPlayer: 'socket1',
            availableMoves: [{ x: 1, y: 1 }],
            playerPositions: new Map(),
            board: [[0]],
        } as any;
        gameStates.set('lobby1', gameState);

        (boardService.handleMovement as any).callsFake((gs: GameState) => {
            gs.availableMoves = []; // Force endTurn
            return gs;
        });

        const endTurnSpy = sandbox.spy(service, 'handleEndTurn');
        service.handleRequestMovement(socket, 'lobby1', [{ x: 0, y: 0 }]);
        clock.tick(150);

        expect(endTurnSpy.calledOnce).to.be.true;
    });

    it('should skip BFS if spawn is not occupied in handleDefeat', () => {
        const player = { id: 'p1' } as Player;
        const gameState: GameState = {
            players: [player],
            playerPositions: [{ x: 1, y: 1 }],
            spawnPoints: [{ x: 1, y: 1 }],
            board: [
                [0, 0],
                [0, 0],
            ],
        } as GameState;

        gameStates.set('lobby1', gameState);

        service.handleDefeat(player, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.be.true;
    });

    it('should trigger handleDefeat logic when defender life <= 0', () => {
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'p2', life: 1, defense: 0 } as Player;

        const gameState = {
            players: [attacker, defender],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            board: [
                [0, 0],
                [0, 0],
            ],
            debug: false,
            currentPlayer: 'p1',
        } as GameState;

        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(1);

        const defeatSpy = sandbox.spy(service, 'handleDefeat');

        service.handleAttackAction('lobby1', attacker, defender);

        expect(defeatSpy.calledOnce).to.be.true;
    });

    it('should not allow flee if amountEscape >= 2 and forceSuccess is false', () => {
        const player = { id: 'p1', amountEscape: 2 } as Player;
        const gameState = { players: [player] } as GameState;
        gameStates.set('lobby1', gameState);

        service.handleFlee('lobby1', player);

        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('fleeFailure', { fleeingPlayer: player })).to.be.true;
    });

    it('should not crash if player not in gameState during handleFlee update', () => {
        const player = { id: 'p1' } as Player;
        const gameState = { players: [] } as GameState;
        gameStates.set('lobby1', gameState);

        service.handleFlee('lobby1', player);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
    });

    it('should update combat time correctly', () => {
        service.updateCombatTime('lobby1', 10);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('combatUpdate', { timeLeft: 10 })).to.be.true;
    });

    it('should emit combatPlayersUpdate in updateCombatPlayers', () => {
        const player = { id: 'p1' } as Player;
        const gameState: GameState = { players: [player] } as GameState;
        gameStates.set('lobby1', gameState);
        service.updateCombatPlayers('lobby1');
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('combatPlayersUpdate', { players: [player] })).to.be.true;
    });

    it('should return null and emit error in getGameStateOrEmitError', () => {
        const result = (service as any).getGameStateOrEmitError(socket, 'unknownLobby');
        expect(result).to.be.null;
        expect(emitStub.calledWith('error', 'Game not found.')).to.be.true;
    });

    it('should detect player on ice tile in isPlayerOnIceTile', () => {
        const player = { id: 'p1' } as Player;
        const gameState: GameState = {
            players: [player],
            playerPositions: [{ x: 0, y: 0 }],
            board: [[TileTypes.Ice]],
        } as GameState;

        const result = (service as any).isPlayerOnIceTile(gameState, player);
        expect(result).to.be.true;
    });

    it('should return false in isTileValid if tile is occupied', () => {
        const gameState: GameState = {
            board: [[0]],
        } as GameState;

        const occupied = new Set<string>([JSON.stringify({ x: 0, y: 0 })]);
        const result = isTileValid({ x: 0, y: 0 }, gameState, occupied);
        expect(result).to.be.false;
    });

    it('should return false in isWithinBounds if tile is out of bounds', () => {
        const result = isWithinBounds({ x: 5, y: 0 }, [[0]]);
        expect(result).to.be.false;
    });
    it('should emit error if gameState not found in handleTeleport', () => {
        service.handleTeleport(socket, 'unknownLobby', { x: 1, y: 1 });
        expect(emitStub.calledWith('error', 'Game not found.')).to.be.true;
    });

    it('should handle teleport and emit boardModified', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
        } as any;
        gameStates.set('lobby1', gameState);

        const updatedGameState: GameState = {
            board: [[TileTypes.Floor]],
        } as any;
        (boardService.handleTeleport as any).returns(updatedGameState);

        service.handleTeleport(socket, 'lobby1', { x: 1, y: 1 });

        expect(gameStates.get('lobby1')).to.deep.equal(updatedGameState);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('boardModified', { gameState: updatedGameState })).to.be.true;
    });

    it('should emit error if handleTeleport throws an error', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
        } as any;
        gameStates.set('lobby1', gameState);

        (boardService.handleTeleport as any).throws(new Error('Teleport error'));

        service.handleTeleport(socket, 'lobby1', { x: 1, y: 1 });

        expect(emitStub.calledWith('error', 'Teleport error: Teleport error')).to.be.true;
    });
    it('should set debug mode to true and emit boardModified', () => {
        const gameState: GameState = { debug: false } as any;
        gameStates.set('lobby1', gameState);

        service.handleSetDebug(socket, 'lobby1', true);

        const updatedGameState = gameStates.get('lobby1');
        expect(updatedGameState!.debug).to.equal(true);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('boardModified', { gameState: updatedGameState })).to.be.true;
    });

    it('should set debug mode to false and emit boardModified', () => {
        const gameState: GameState = { debug: true } as any;
        gameStates.set('lobby1', gameState);

        service.handleSetDebug(socket, 'lobby1', false);

        const updatedGameState = gameStates.get('lobby1');
        expect(updatedGameState!.debug).to.equal(false);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('boardModified', { gameState: updatedGameState })).to.be.true;
    });

    it('should emit error if gameState not found in handleSetDebug', () => {
        service.handleSetDebug(socket, 'unknownLobby', true);
        expect(emitStub.calledWith('error', 'Game not found.')).to.be.true;
    });
    it('should not proceed if attacker is not found in gameState', () => {
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'p2', life: 10, defense: 3 } as Player;
        gameStates.set('lobby1', { players: [defender], debug: false } as GameState);

        service.handleAttackAction('lobby1', attacker, defender);

        expect(ioToStub.calledWith('lobby1')).to.be.false;
    });

    it('should not proceed if defender is not found in gameState', () => {
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'p2', life: 10, defense: 3 } as Player;
        gameStates.set('lobby1', { players: [attacker], debug: false } as GameState);

        service.handleAttackAction('lobby1', attacker, defender);

        expect(ioToStub.calledWith('lobby1')).to.be.false;
    });

    it('should calculate damage and reduce defender life', () => {
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'p2', life: 10, defense: 3 } as Player;
        const gameState = { players: [attacker, defender], debug: false } as GameState;
        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0.5);

        service.handleAttackAction('lobby1', attacker, defender);

        expect(defender.life).to.be.lessThan(10);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('attackResult')).to.be.true;
    });

    it('should handle defeat if defender life is reduced to 0 or below', () => {
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'p2', life: 1, defense: 0 } as Player;
        const gameState = { players: [attacker, defender], debug: false } as GameState;
        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(1);
        const handleDefeatSpy = sandbox.spy(service, 'handleDefeat');

        service.handleAttackAction('lobby1', attacker, defender);

        expect(handleDefeatSpy.calledOnceWith(defender, 'lobby1')).to.be.true;
    });

    it('should apply debug mode and use fixed attack and defense values', () => {
        const attacker = { id: 'p1', life: 10, attack: 5 } as Player;
        const defender = { id: 'p2', life: 10, defense: 3 } as Player;
        const gameState = { players: [attacker, defender], debug: true } as GameState;
        gameStates.set('lobby1', gameState);

        service.handleAttackAction('lobby1', attacker, defender);

        const emit = ioToStub.returnValues[0].emit;
        expect(
            emit.calledWith(
                'attackResult',
                match({
                    attackRoll: 5,
                    defenseRoll: 3,
                    damage: 2,
                }),
            ),
        ).to.be.true;
    });

    it('should not reduce defender life if damage is 0', () => {
        const attacker = { id: 'p1', life: 10, attack: 1 } as Player;
        const defender = { id: 'p2', life: 10, defense: 5 } as Player;
        const gameState = { players: [attacker, defender], debug: false } as GameState;
        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0);

        service.handleAttackAction('lobby1', attacker, defender);

        expect(defender.life).to.equal(10);
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('attackResult')).to.be.true;
    });
    it('should emit FleeFailure if amountEscape is greater than or equal to 2', () => {
        const player = { id: 'p1', amountEscape: 2 } as Player;
        const gameState = { players: [player] } as GameState;
        gameStates.set('lobby1', gameState);

        service.handleFlee('lobby1', player);

        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith(GameEvents.FleeFailure, { fleeingPlayer: player })).to.be.true;
    });
    it('should increment amountEscape and emit FleeFailure if flee fails', () => {
        const player = { id: 'p1', amountEscape: 1 } as Player;
        const gameState = { players: [player] } as GameState;
        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0.1); // Ensure failure
        service.handleFlee('lobby1', player);

        expect(player.amountEscape).to.equal(2);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith(GameEvents.FleeFailure, { fleeingPlayer: player })).to.be.true;
    });

    it('should emit FleeSuccess and update gameState if flee succeeds', () => {
        const player = { id: 'p1', amountEscape: 0 } as Player;
        const gameState = {
            players: [player],
            currentPlayerActionPoints: 1,
        } as GameState;
        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0.01); // Ensure success
        service.handleFlee('lobby1', player);

        expect(player.amountEscape).to.equal(1);
        expect(gameState.currentPlayerActionPoints).to.equal(0);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith(GameEvents.FleeSuccess, { fleeingPlayer: player, isSuccessful: true })).to.be.true;
        expect(emit.calledWith(GameEvents.BoardModified, { gameState })).to.be.true;
    });

    it('should initialize amountEscape to 0 if undefined and emit FleeFailure on failure', () => {
        const player = { id: 'p1' } as Player;
        const gameState = { players: [player] } as GameState;
        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0.1); // Ensure failure
        service.handleFlee('lobby1', player);

        expect(player.amountEscape).to.equal(1);
        expect(ioToStub.calledWith('lobby1')).to.be.true;
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith(GameEvents.FleeFailure, { fleeingPlayer: player })).to.be.true;
    });

    it('should not proceed if gameState is not found', () => {
        const player = { id: 'p1', amountEscape: 0 } as Player;

        service.handleFlee('unknownLobby', player);

        expect(ioToStub.called).to.be.false;
    });
});
