/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoardService } from '@app/services/board.service';
import { GameLobby } from '@common/game-lobby';
import { Game } from '@common/game.interface';
import { expect } from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';

describe('BoardService', () => {
    let sandbox: SinonSandbox;
    let boardService: BoardService;
    let gameService: any;
    let pathfindingService: any;

    beforeEach(() => {
        sandbox = createSandbox();
        gameService = { getGameById: sandbox.stub() };
        pathfindingService = {
            findShortestPath: sandbox.stub(),
            getMovementCost: sandbox.stub(),
            findReachablePositions: sandbox.stub(),
        };
        boardService = new BoardService(gameService, pathfindingService);
    });

    afterEach(() => sandbox.restore());

    it('should throw error if game not found', async () => {
        gameService.getGameById.resolves(null);
        try {
            await boardService.getGameFromId('id');
            expect.fail('Should throw an error');
        } catch (e: any) {
            expect(e.message).to.equal('Game not found');
        }
    });

    it('should initialize game state', async () => {
        const lobby: GameLobby = {
            id: '1',
            players: [{ id: 'p1', speed: 2, name: '', avatar: '', isHost: true, bonus: {} }],
            gameId: 'g1',
            isLocked: false,
            maxPlayers: 4,
        } as any;

        const game: Game = {
            board: [
                [0, 0],
                [10, 0],
            ],
        } as any;

        gameService.getGameById.resolves(game);

        const state = await boardService.initializeGameState(lobby);
        expect(state.players[0].id).to.equal('p1');
        expect(state.board).to.deep.equal(game.board);
        expect(state.spawnPoints.length).to.be.at.least(0);
    });

    it('should handleTurn with valid position', () => {
        const state = {
            players: [{ id: 'p1', speed: 2, bonus: {} }],
            currentPlayer: 'p1',
            playerPositions: [{ x: 0, y: 0 }],
            currentPlayerMovementPoints: 2,
        } as any;
        pathfindingService.findReachablePositions.returns([{ x: 0, y: 1 }]);
        pathfindingService.findShortestPath.returns([
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ]);

        const result = boardService.handleTurn(state);
        expect(result.availableMoves).to.deep.equal([{ x: 0, y: 1 }]);
    });

    it('should return empty moves if player index or position invalid in handleTurn', () => {
        const gs1 = { players: [], currentPlayer: 'unknown' } as any;
        const gs2 = { players: [{ id: 'a', speed: 1 }], currentPlayer: 'a', playerPositions: [] } as any;

        const res1 = boardService.handleTurn(gs1);
        const res2 = boardService.handleTurn(gs2);

        expect(res1.availableMoves).to.deep.equal([]);
        expect(res2.availableMoves).to.deep.equal([]);
    });

    it('should return null path in findShortestPath', () => {
        pathfindingService.findShortestPath.returns(null);
        const res = boardService.findShortestPath({ currentPlayerMovementPoints: 3 } as any, { x: 0, y: 0 }, { x: 1, y: 1 });
        expect(res).to.equal(null);
    });

    it('should return unchanged state if invalid movement', () => {
        const state = {
            players: [{ id: 'p1' }],
            currentPlayer: 'p1',
            availableMoves: [],
            playerPositions: [],
        } as any;
        const result = boardService.handleMovement(state, { x: 1, y: 1 });
        expect(result).to.equal(state);
    });

    it('should handleMovement and update game state correctly', () => {
        const state = {
            players: [{ id: 'p1', speed: 2, bonus: {} }],
            currentPlayer: 'p1',
            playerPositions: [{ x: 0, y: 0 }],
            availableMoves: [{ x: 1, y: 1 }],
            currentPlayerMovementPoints: 5,
        } as any;

        pathfindingService.findShortestPath.returns([
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ]);
        pathfindingService.getMovementCost.returns(1);
        pathfindingService.findReachablePositions.returns([{ x: 2, y: 2 }]);

        const result = boardService.handleMovement(state, { x: 1, y: 1 });
        expect(result.playerPositions[0]).to.deep.equal({ x: 1, y: 1 });
    });

    it('should handleEndTurn and set next player', () => {
        const state = {
            players: [
                { id: 'p1', speed: 2, bonus: {} },
                { id: 'p2', speed: 1, bonus: {} },
            ],
            currentPlayer: 'p1',
            playerPositions: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            currentPlayerMovementPoints: 5,
            turnCounter: 0,
        } as any;

        pathfindingService.findReachablePositions.returns([]);
        pathfindingService.findShortestPath.returns([]);

        const result = boardService.handleEndTurn(state);
        expect(result.currentPlayer).to.equal('p2');
        expect(result.turnCounter).to.equal(1);
    });

    it('should return unchanged state if currentPlayer index not found in handleEndTurn', () => {
        const state = { players: [{ id: 'p1' }], currentPlayer: 'pX', turnCounter: 0 } as any;
        const result = boardService.handleEndTurn(state);
        expect(result).to.equal(state);
    });

    it('should calculate correct movement points', () => {
        const player = {
            id: 'p1',
            speed: 2,
            bonus: { speed: 1 },
            name: '',
            avatar: '',
            isHost: false,
        } as any;

        const mp = (boardService as any).getPlayerMovementPoints(player);
        expect(mp).to.equal(3);
    });

    it('should return empty list in findAllPaths when state or position is invalid', () => {
        const res1 = (boardService as any).findAllPaths({}, null);
        const res2 = (boardService as any).findAllPaths({ currentPlayerMovementPoints: -1 }, { x: 0, y: 0 });

        expect(res1).to.deep.equal([]);
        expect(res2).to.deep.equal([]);
    });

    it('should return [] if pathfinding fails in findAllPaths', () => {
        pathfindingService.findReachablePositions.throws(new Error('fail'));
        const res = (boardService as any).findAllPaths({ currentPlayerMovementPoints: 2 }, { x: 0, y: 0 });
        expect(res).to.deep.equal([]);
    });

    it('should shuffle and assign spawn points', async () => {
        const gs = {
            board: [[60, 0]],
            players: [{ id: 'p1', speed: 2 }],
            playerPositions: [],
            spawnPoints: [],
        } as any;

        await (boardService as any).assignSpawnPoints(gs);
        expect(gs.playerPositions.length).to.equal(1);
        expect(gs.spawnPoints.length).to.equal(1);
    });

    it('should sort players by speed descending', () => {
        const gs = {
            players: [
                { id: 'p1', speed: 1, bonus: {} },
                { id: 'p2', speed: 3, bonus: {} },
            ],
        } as any;
        (boardService as any).sortPlayersBySpeed(gs);
        expect(gs.players[0].id).to.equal('p2');
    });

    it('should calculate shortest moves properly', () => {
        const gs = { currentPlayerMovementPoints: 3 } as any;
        pathfindingService.findShortestPath.returns([
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ]);
        const result = (boardService as any).calculateShortestMoves(gs, { x: 0, y: 0 }, [{ x: 0, y: 1 }]);
        expect(result.length).to.equal(1);
    });
    /* These tests should be added to board.service.spec.ts */

    // Additional test for handleBoardChange
    it('should handle board changes correctly', () => {
        const state = {
            players: [{ id: 'p1', speed: 2, bonus: {} }],
            currentPlayer: 'p1',
            playerPositions: [{ x: 0, y: 0 }],
            currentPlayerMovementPoints: 5,
            availableMoves: [],
        } as any;

        pathfindingService.findReachablePositions.returns([{ x: 1, y: 1 }]);
        pathfindingService.findShortestPath.returns([
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ]);

        const result = boardService.handleBoardChange(state);
        expect(result.availableMoves).to.deep.equal([{ x: 1, y: 1 }]);
        expect(pathfindingService.findReachablePositions.calledOnce).to.equal(true);
    });

    // Test for when player index is not found in handleBoardChange
    it('should return unchanged state if player index not found in handleBoardChange', () => {
        const state = {
            players: [{ id: 'p1' }],
            currentPlayer: 'pX',
            availableMoves: [],
            shortestMoves: [],
        } as any;

        const result = boardService.handleBoardChange(state);
        expect(result).to.equal(state);
        expect(result.availableMoves).to.deep.equal([]);
        expect(result.shortestMoves).to.deep.equal([]);
    });

    // Test for when player position is not found in handleBoardChange
    it('should return unchanged state if player position not found in handleBoardChange', () => {
        const state = {
            players: [{ id: 'p1' }],
            currentPlayer: 'p1',
            playerPositions: [],
            availableMoves: [],
            shortestMoves: [],
        } as any;

        const result = boardService.handleBoardChange(state);
        expect(result).to.equal(state);
        expect(result.availableMoves).to.deep.equal([]);
        expect(result.shortestMoves).to.deep.equal([]);
    });

    // Test for empty player array in handleEndTurn
    it('should return unchanged state if players array is empty in handleEndTurn', () => {
        const state = { players: [], currentPlayer: '', turnCounter: 0 } as any;
        const result = boardService.handleEndTurn(state);
        expect(result).to.equal(state);
    });

    // Test for movement points calculation with null or undefined values
    it('should handle null or undefined bonus values in getPlayerMovementPoints', () => {
        const player1 = { id: 'p1', speed: 2, bonus: null } as any;
        const player2 = { id: 'p2', speed: 3 } as any; // No bonus property

        const mp1 = (boardService as any).getPlayerMovementPoints(player1);
        const mp2 = (boardService as any).getPlayerMovementPoints(player2);

        expect(mp1).to.equal(2);
        expect(mp2).to.equal(3);
    });

    // Test assignment of spawn points with no spawn points available
    it('should handle no spawn points in board', async () => {
        const gs = {
            board: [[1]], // No spawn points
            players: [{ id: 'p1', speed: 2 }],
            playerPositions: [],
            spawnPoints: [],
        } as any;

        await (boardService as any).assignSpawnPoints(gs);
        expect(gs.playerPositions).to.have.lengthOf(0);
        expect(gs.spawnPoints).to.have.lengthOf(0);
    });

    // Test with more spawn points than players
    it('should clean up excess spawn points', async () => {
        const gs = {
            board: [
                [60, 0], // Two spawn points (60 = 6*10 = spawn point)
                [60, 0],
            ],
            players: [{ id: 'p1', speed: 2 }], // One player
            playerPositions: [],
            spawnPoints: [],
        } as any;

        await (boardService as any).assignSpawnPoints(gs);
        expect(gs.playerPositions).to.have.lengthOf(1);
        expect(gs.spawnPoints).to.have.lengthOf(1);

        // Check that one spawn point was converted to regular tile
        const remainingSpawnPoints = gs.board.flat().filter((tile: number) => Math.floor(tile / 10) === 6);
        expect(remainingSpawnPoints).to.have.lengthOf(1);
    });

    // Test sort players by speed with bonus
    it('should sort players by speed including bonus values', () => {
        const gs = {
            players: [
                { id: 'p1', speed: 1, bonus: { speed: 2 } }, // Total speed 3
                { id: 'p2', speed: 2, bonus: { speed: 0 } }, // Total speed 2
                { id: 'p3', speed: 4, bonus: null }, // Total speed 4
            ],
        } as any;

        (boardService as any).sortPlayersBySpeed(gs);

        expect(gs.players[0].id).to.equal('p3'); // Highest speed
        expect(gs.players[1].id).to.equal('p1');
        expect(gs.players[2].id).to.equal('p2'); // Lowest speed
    });

    // Test error handling in getGameFromId
    it('should propagate errors from gameService in getGameFromId', async () => {
        gameService.getGameById.rejects(new Error('Database error'));

        try {
            await boardService.getGameFromId('id');
            expect.fail('Should have thrown an error');
        } catch (e: any) {
            expect(e.message).to.include('Error fetching game');
            expect(e.message).to.include('Database error');
        }
    });

    // Test empty calculateShortestMoves
    it('should return empty array for empty moves in calculateShortestMoves', () => {
        const gs = { currentPlayerMovementPoints: 3 } as any;
        const result = (boardService as any).calculateShortestMoves(gs, { x: 0, y: 0 }, []);
        expect(result).to.deep.equal([]);
    });

    // Test calculateShortestMoves with null path
    it('should handle null paths in calculateShortestMoves', () => {
        const gs = { currentPlayerMovementPoints: 3 } as any;
        pathfindingService.findShortestPath.returns(null);

        const result = (boardService as any).calculateShortestMoves(gs, { x: 0, y: 0 }, [{ x: 1, y: 1 }]);
        expect(result).to.deep.equal([]);
    });

    // Test calculateShortestMoves with short path
    it('should handle path with single point in calculateShortestMoves', () => {
        const gs = { currentPlayerMovementPoints: 3 } as any;
        pathfindingService.findShortestPath.returns([{ x: 0, y: 0 }]);

        const result = (boardService as any).calculateShortestMoves(gs, { x: 0, y: 0 }, [{ x: 0, y: 0 }]);
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.have.lengthOf(2);
        expect(result[0][0]).to.deep.equal({ x: 0, y: 0 });
        expect(result[0][1]).to.deep.equal({ x: 0, y: 0 });
    });
});
