/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoardService } from '@app/services/board.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';

describe('GameSocketHandlerService', () => {
    let sandbox: SinonSandbox;
    let lobbies: Map<string, GameLobby>;
    let gameStates: Map<string, GameState>;
    let boardService: BoardService;
    let lobbySocketHandlerService: LobbySocketHandlerService;
    let service: GameSocketHandlerService;
    let socket: any;

    let emitStub: SinonStub;
    let ioToStub: SinonStub;

    beforeEach(() => {
        sandbox = createSandbox();
        lobbies = new Map<string, GameLobby>();
        gameStates = new Map<string, GameState>();

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
        ioToStub = sandbox.stub().returns({ emit: sandbox.stub() });
        service['io'] = { to: ioToStub } as any;

        emitStub = sandbox.stub();
        socket = { id: 'socket1', emit: emitStub };
    });

    afterEach(() => {
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
        (boardService.handleTurn as any).returns(gameState); // ✅ nécessaire

        lobbies.set('lobby1', lobby);

        await service.handleRequestStart(socket, 'lobby1');

        expect(gameStates.get('lobby1')).to.deep.equal(gameState); // ✅ deep
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
    it('should emit error if handleMovement throws in handleRequestMovement', () => {
        const gameState: GameState = {
            currentPlayer: 'socket1',
            availableMoves: [],
            playerPositions: new Map(),
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleMovement as any).throws(new Error('Movement error'));

        service.handleRequestMovement(socket, 'lobby1', [{ x: 0, y: 0 }]);
        expect(emitStub.calledWith('error', 'Movement error: Movement error')).to.equal(true);
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
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('error', 'Turn error: Turn error')).to.equal(true);
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
        // Create players
        const player1 = { id: 'socket1', name: 'Player 1' } as Player;
        const player2 = { id: 'socket2', name: 'Player 2' } as Player;
        const player3 = { id: 'socket3', name: 'Player 3' } as Player;

        // Create game state with 3 players
        const gameState: GameState = {
            currentPlayer: 'socket1',
            players: [player1, player2, player3],
            board: [
                [1, 1, 61], // 61 is spawn point (6 * TILE_DELIMITER + 1)
                [1, 1, 1],
                [1, 61, 1], // Another spawn point
            ],
            playerPositions: [
                { x: 0, y: 2 }, // Player 1 at first spawn
                { x: 2, y: 1 }, // Player 2 at second spawn
                { x: 1, y: 1 }, // Player 3 elsewhere
            ],
            spawnPoints: [
                { x: 0, y: 2 },
                { x: 2, y: 1 },
            ],
            availableMoves: [],
        } as any;

        // Set the game state in the map
        gameStates.set('lobby1', gameState);

        // Create updated players array with player2 removed
        const updatedPlayers = [player1, player3];

        // Mock handleBoardChange to return unmodified state
        (boardService.handleBoardChange as any).returns(gameState);

        // Call the function with updated players
        service.handlePlayersUpdate(socket, 'lobby1', updatedPlayers);

        // Get the updated game state
        const updatedGameState = gameStates.get('lobby1');

        // Verify that player2 was removed from players array
        expect(updatedGameState!.players).to.have.lengthOf(2);
        expect(updatedGameState!.players.some((p) => p.id === 'socket2')).to.equal(false);

        // Verify that player2's spawn point was cleared in the board
        expect(updatedGameState!.board[2][1]).to.equal(1); // Should be just tile without spawn object

        // Verify that player2's position was removed
        expect(updatedGameState!.playerPositions).to.have.lengthOf(2);

        // Verify that player2's spawn point was removed from spawnPoints array
        expect(updatedGameState!.spawnPoints).to.have.lengthOf(1);

        // Verify that player2 was added to deletedPlayers
        expect(updatedGameState!.deletedPlayers).to.have.lengthOf(1);
        expect(updatedGameState!.deletedPlayers![0].id).to.equal('socket2');

        // Verify that currentPlayer was updated if needed
        if (gameState.currentPlayer === 'socket2') {
            expect(updatedGameState!.currentPlayer).not.to.equal('socket2');
        }

        // Verify that the event was emitted
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('boardModified')).to.equal(true);
    });

    it('should handle players update when no players are removed', () => {
        // Create players
        const player1 = { id: 'socket1', name: 'Player 1' } as Player;
        const player2 = { id: 'socket2', name: 'Player 2' } as Player;

        // Create game state with 2 players
        const gameState: GameState = {
            currentPlayer: 'socket1',
            players: [player1, player2],
            board: [
                [1, 1, 61], // 61 is spawn point (6 * TILE_DELIMITER + 1)
                [1, 1, 1],
                [1, 61, 1], // Another spawn point
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

        // Set the game state in the map
        gameStates.set('lobby1', gameState);

        // Create updated players array with the same players
        const updatedPlayers = [player1, player2];

        // Mock handleBoardChange to return unmodified state
        (boardService.handleBoardChange as any).returns(gameState);

        // Create deep copies for later comparison
        const originalPlayersLength = gameState.players.length;
        const originalPlayerPositionsLength = gameState.playerPositions.length;
        const originalSpawnPointsLength = gameState.spawnPoints.length;

        // Call the function with updated players
        service.handlePlayersUpdate(socket, 'lobby1', updatedPlayers);

        // Get the updated game state
        const updatedGameState = gameStates.get('lobby1');

        // Verify that no players were removed
        expect(updatedGameState!.players).to.have.lengthOf(originalPlayersLength);

        // Verify that no player positions were removed
        expect(updatedGameState!.playerPositions).to.have.lengthOf(originalPlayerPositionsLength);

        // Verify that no spawn points were removed
        expect(updatedGameState!.spawnPoints).to.have.lengthOf(originalSpawnPointsLength);

        // Verify that deletedPlayers was not created
        expect(updatedGameState!.deletedPlayers).to.be.undefined;

        // Verify that the event was still emitted
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        const emit = ioToStub.returnValues[0].emit;
        expect(emit.calledWith('boardModified')).to.equal(true);
    });

    it('should emit error if gameState not found in handlePlayersUpdate', () => {
        const players = [{ id: 'player1' }] as Player[];
        service.handlePlayersUpdate(socket, 'nonexistentLobby', players);
        expect(emitStub.calledWith('error', 'Game not found.')).to.equal(true);
    });
});
