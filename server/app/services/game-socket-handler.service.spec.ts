/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoardService } from '@app/services/board.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { TILE_DELIMITER, TileTypes } from '@common/game.interface';
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
    describe('handlePlayersUpdate', () => {
        it('should emit error if gameState not found', () => {
            service.handlePlayersUpdate(socket, 'nonexistent', []);
            expect(socket.emit.calledWith('error', 'Game not found.')).to.be.true;
        });

        it('should update gameState when a player is deleted', () => {
            // Create initial game state with two players
            const gameState: GameState = {
                board: [[10]], // Value 10 = spawn point
                players: [{ id: 'p1', name: 'Player1' } as Player, { id: 'p2', name: 'Player2' } as Player],
                currentPlayer: 'p1',
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                deletedPlayers: [],
                availableMoves: [],
                shortestMoves: [],
                turnCounter: 0,
                currentPlayerMovementPoints: 0,
            } as GameState;

            gameStates.set('lobby1', gameState);

            // Call with updated player list that has player 'p2' removed
            const updatedPlayers = [{ id: 'p1', name: 'Player1' } as Player];
            service.handlePlayersUpdate(socket, 'lobby1', updatedPlayers);

            // Check that player was moved to deletedPlayers
            expect(gameState.deletedPlayers?.length).to.equal(1);
            expect(gameState.deletedPlayers?.[0].id).to.equal('p2');

            // Check that players array was updated
            expect(gameState.players.length).to.equal(1);
            expect(gameState.players[0].id).to.equal('p1');

            // Check that currentPlayer was updated if it was the deleted player
            expect(gameState.currentPlayer).to.equal('p1');

            // Verify board modification at spawn point
            expect(ioToStub.calledWith('lobby1')).to.be.true;
        });

        it('should update currentPlayer when current player is deleted', () => {
            // Create initial game state where p2 is the current player
            const gameState: GameState = {
                board: [[10]], // Value 10 = spawn point
                players: [{ id: 'p1', name: 'Player1' } as Player, { id: 'p2', name: 'Player2' } as Player, { id: 'p3', name: 'Player3' } as Player],
                currentPlayer: 'p2', // p2 is current player and will be deleted
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ],
                deletedPlayers: [],
                availableMoves: [],
                shortestMoves: [],
                turnCounter: 0,
                currentPlayerMovementPoints: 0,
            } as GameState;

            gameStates.set('lobby1', gameState);

            // Call with updated player list that has player 'p2' removed
            const updatedPlayers = [{ id: 'p1', name: 'Player1' } as Player, { id: 'p3', name: 'Player3' } as Player];

            service.handlePlayersUpdate(socket, 'lobby1', updatedPlayers);

            // Check that currentPlayer was updated to the next player in line (p3)
            expect(gameState.currentPlayer).to.equal('p3');

            // Check that p2 was moved to deletedPlayers
            expect(gameState.deletedPlayers?.length).to.equal(1);
            expect(gameState.deletedPlayers?.[0].id).to.equal('p2');
        });

        it('should handle a player being deleted with no deletedPlayers array', () => {
            // Create initial game state with two players but no deletedPlayers array
            const gameState: GameState = {
                board: [[10]], // Value 10 = spawn point
                players: [{ id: 'p1', name: 'Player1' } as Player, { id: 'p2', name: 'Player2' } as Player],
                currentPlayer: 'p1',
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 1, y: 1 },
                ],
                availableMoves: [],
                shortestMoves: [],
                turnCounter: 0,
                currentPlayerMovementPoints: 0,
            } as GameState;

            // Deliberately don't set deletedPlayers
            delete gameState.deletedPlayers;

            gameStates.set('lobby1', gameState);

            // Call with updated player list that has player 'p2' removed
            const updatedPlayers = [{ id: 'p1', name: 'Player1' } as Player];
            service.handlePlayersUpdate(socket, 'lobby1', updatedPlayers);

            // Check that deletedPlayers was created and player was added
            expect(gameState.deletedPlayers?.length).to.equal(1);
            expect(gameState.deletedPlayers?.[0].id).to.equal('p2');
        });

        it('should modify tile type at spawn point when player is deleted', () => {
            // Create initial game state with a player and a spawn point
            const gameState: GameState = {
                board: [[TILE_DELIMITER * 6]], // Tile value 60 = spawn point (6*10)
                players: [{ id: 'p1', name: 'Player1' } as Player],
                currentPlayer: 'p1',
                spawnPoints: [{ x: 0, y: 0 }],
                playerPositions: [{ x: 0, y: 0 }],
                deletedPlayers: [],
                availableMoves: [],
                shortestMoves: [],
                turnCounter: 0,
                currentPlayerMovementPoints: 0,
            } as GameState;

            gameStates.set('lobby1', gameState);

            // Call with empty player list to remove the player
            service.handlePlayersUpdate(socket, 'lobby1', []);

            // Check that the board tile was modified (divided by TILE_DELIMITER)
            expect(gameState.board[0][0]).to.equal(0);
        });
    });

    // Test for any functionality around line 106
    describe('startTurn with combat', () => {
        it('should handle game state with active combat', () => {
            // Create game state with active combat
            const gameState: GameState = {
                players: [{ id: 'p1' }] as any,
                currentPlayer: 'p1',
                combat: {
                    playerId: 'p1',
                    isActive: true,
                    endTime: new Date(Date.now() + 10000), // Combat ends in 10 seconds
                },
                availableMoves: [],
                shortestMoves: [],
                playerPositions: [],
            } as GameState;

            gameStates.set('lobby1', gameState);

            // Call startTurn
            service.startTurn('lobby1');

            // Verify that the emit was called correctly
            expect(ioToStub.calledWith('lobby1')).to.be.true;
        });

        it('should end combat if time has expired', () => {
            // Create game state with expired combat
            const pastDate = new Date();
            pastDate.setSeconds(pastDate.getSeconds() - 10); // 10 seconds in the past

            const gameState: GameState = {
                players: [{ id: 'p1' }] as any,
                currentPlayer: 'p1',
                combat: {
                    playerId: 'p1',
                    isActive: true,
                    endTime: pastDate, // Combat ended 10 seconds ago
                },
                availableMoves: [],
                shortestMoves: [],
                playerPositions: [],
            } as GameState;

            (boardService as any).handleTurn = sandbox.stub().returns(gameState);

            gameStates.set('lobby1', gameState);

            // Call startTurn
            service.startTurn('lobby1');

            // Verify that combat.isActive was set to false
            expect(gameState.combat?.isActive).to.be.false;
        });
    });
});
