/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoardSocketConstants } from '@app/constants/board-const';
import { BoardService } from '@app/services/board.service';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game, ObjectsTypes, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createSandbox, SinonSandbox } from 'sinon';

describe('BoardService', () => {
    let sandbox: SinonSandbox;
    let boardService: BoardService;
    let gameService: any;
    let pathfindingService: any;
    let itemService: any;

    beforeEach(() => {
        sandbox = createSandbox();
        gameService = { getGameById: sandbox.stub() };
        pathfindingService = {
            findShortestPath: sandbox.stub(),
            getMovementCost: sandbox.stub(),
            findReachablePositions: sandbox.stub(),
        };
        boardService = new BoardService(gameService, pathfindingService, itemService);
    });

    afterEach(() => sandbox.restore());

    it('should throw error if game not found', async () => {
        gameService.getGameById.resolves(null);
        try {
            await boardService.getGameFromId('id');
            expect.fail('Should throw an error');
        } catch (e: any) {
            expect(e.message).to.equal('Error fetching game: Game not found');
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
        const gs1: GameState = {
            players: [],
            currentPlayer: 'unknown',
            availableMoves: [],
            shortestMoves: [],
            playerPositions: [],
        } as any;
        const gs2: GameState = {
            players: [{ id: 'a', speed: 1 }],
            currentPlayer: 'a',
            playerPositions: [],
            availableMoves: [],
            shortestMoves: [],
        } as any;

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

    it('should handleMovement and update game state correctly', () => {
        const state = {
            players: [{ id: 'p1', speed: 2, bonus: {} }],
            currentPlayer: 'p1',
            playerPositions: [{ x: 0, y: 0 }],
            availableMoves: [{ x: 1, y: 1 }],
            currentPlayerMovementPoints: 5,
            board: [
                [0, 0],
                [0, 0],
            ],
        } as any;

        pathfindingService.findShortestPath.returns([
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ]);
        pathfindingService.getMovementCost.returns(1);
        pathfindingService.findReachablePositions.returns([{ x: 2, y: 2 }]);

        const result = boardService.handleMovement(state, { x: 1, y: 1 });
        expect(result.gameState.playerPositions[0]).to.deep.equal({ x: 1, y: 1 });
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
        expect(mp).to.equal(2);
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
            board: [[ObjectsTypes.SPAWN * BoardSocketConstants.TileDivisor, 0]],
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

    it('should return unchanged state if players array is empty in handleEndTurn', () => {
        const state = { players: [], currentPlayer: '', turnCounter: 0 } as any;
        const result = boardService.handleEndTurn(state);
        expect(result).to.equal(state);
    });

    it('should handle null or undefined bonus values in getPlayerMovementPoints', () => {
        const player1 = { id: 'p1', speed: 2, bonus: null } as any;
        const player2 = { id: 'p2', speed: 3 } as any;

        const mp1 = (boardService as any).getPlayerMovementPoints(player1);
        const mp2 = (boardService as any).getPlayerMovementPoints(player2);

        expect(mp1).to.equal(2);
        expect(mp2).to.equal(3);
    });

    it('should handle no spawn points in board', async () => {
        const gs = {
            board: [[1]],
            players: [{ id: 'p1', speed: 2 }],
            playerPositions: [],
            spawnPoints: [],
        } as any;

        await (boardService as any).assignSpawnPoints(gs);
        expect(gs.playerPositions).to.have.lengthOf(0);
        expect(gs.spawnPoints).to.have.lengthOf(0);
    });

    it('should clean up excess spawn points', async () => {
        const gs = {
            board: [
                [ObjectsTypes.SPAWN * BoardSocketConstants.TileDivisor, 0],
                [ObjectsTypes.SPAWN * BoardSocketConstants.TileDivisor, 0],
            ],

            players: [{ id: 'p1', speed: 2 }],
            playerPositions: [],
            spawnPoints: [],
        } as any;

        await (boardService as any).assignSpawnPoints(gs);
        expect(gs.playerPositions).to.have.lengthOf(1);
        expect(gs.spawnPoints).to.have.lengthOf(1);

        const remainingSpawnPoints = gs.board
            .flat()
            .filter((tile: number) => Math.floor(tile / BoardSocketConstants.TileDivisor) === ObjectsTypes.SPAWN);

        expect(remainingSpawnPoints).to.have.lengthOf(1);
    });

    it('should sort players by speed including bonus values', () => {
        const gs = {
            players: [
                { id: 'p1', speed: 1, bonus: { speed: 2 } },
                { id: 'p2', speed: 2, bonus: { speed: 0 } },
                { id: 'p3', speed: 4, bonus: null },
            ],
        } as any;

        (boardService as any).sortPlayersBySpeed(gs);

        expect(gs.players[0].id).to.equal('p3');
        expect(gs.players[1].id).to.equal('p1');
        expect(gs.players[2].id).to.equal('p2');
    });

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

    it('should return empty array for empty moves in calculateShortestMoves', () => {
        const gs = { currentPlayerMovementPoints: 3 } as any;
        const result = (boardService as any).calculateShortestMoves(gs, { x: 0, y: 0 }, []);
        expect(result).to.deep.equal([]);
    });

    it('should handle path with single point in calculateShortestMoves', () => {
        const gs = { currentPlayerMovementPoints: 3 } as any;
        pathfindingService.findShortestPath.returns([
            { x: 0, y: 0 },
            { x: 0, y: 0 },
        ]);

        const result = (boardService as any).calculateShortestMoves(gs, { x: 0, y: 0 }, [{ x: 0, y: 0 }]);
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.have.lengthOf(2);
        expect(result[0][0]).to.deep.equal({ x: 0, y: 0 });
        expect(result[0][1]).to.deep.equal({ x: 0, y: 0 });
    });

    it('should return unchanged state if player index not found in handleMovement', () => {
        const state = {
            players: [{ id: 'p1' }],
            currentPlayer: 'pX',
            availableMoves: [],
            playerPositions: [],
        } as any;

        const result = boardService.handleMovement(state, { x: 1, y: 1 });
        expect(result.gameState).to.equal(state);
    });

    it('should return empty array if gameState or startPosition is null in findAllPaths', async () => {
        const result1 = (boardService as any).findAllPaths(null, { x: 0, y: 0 });
        expect(Array.isArray(result1)).to.equal(true);
        expect(result1.length === 0).to.equal(true);

        const gameState = {
            currentPlayerMovementPoints: 5,
        } as GameState;
        const result2 = (boardService as any).findAllPaths(gameState, null);
        expect(Array.isArray(result2)).to.equal(true);
        expect(result2.length === 0).to.equal(true);
    });

    it('should handle null gameState in findAllPaths', async () => {
        const result = (boardService as any).findAllPaths(null, { x: 0, y: 0 });
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length === 0).to.equal(true);
    });

    it('should handle undefined gameState in findAllPaths', async () => {
        const result = (boardService as any).findAllPaths(undefined, { x: 0, y: 0 });
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length === 0).to.equal(true);
    });

    it('should handle null startPosition in findAllPaths', async () => {
        const gameState = {
            currentPlayerMovementPoints: 5,
        } as GameState;
        const result = (boardService as any).findAllPaths(gameState, null);
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length === 0).to.equal(true);
    });

    it('should handle undefined startPosition in findAllPaths', async () => {
        const gameState = {
            currentPlayerMovementPoints: 5,
        } as GameState;
        const result = (boardService as any).findAllPaths(gameState, undefined);
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length === 0).to.equal(true);
    });

    it('should handle zero currentPlayerMovementPoints in findAllPaths', async () => {
        const gameState = {
            currentPlayerMovementPoints: 0,
        } as GameState;
        const result = (boardService as any).findAllPaths(gameState, { x: 0, y: 0 });
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length === 0).to.equal(true);
    });

    it('should handle negative currentPlayerMovementPoints in findAllPaths', async () => {
        const gameState = {
            currentPlayerMovementPoints: -1,
        } as GameState;
        const result = (boardService as any).findAllPaths(gameState, { x: 0, y: 0 });
        expect(Array.isArray(result)).to.equal(true);
        expect(result.length === 0).to.equal(true);
    });

    it('should not throw when sorting empty players array by speed', async () => {
        const gameState = {
            players: [],
        } as GameState;

        expect(() => (boardService as any).sortPlayersBySpeed(gameState)).to.not.throw();

        expect(Array.isArray(gameState.players)).to.equal(true);
        expect(gameState.players.length === 0).to.equal(true);
    });

    it('should sort players by speed including bonuses', async () => {
        const player1: Player = {
            id: 'player1',
            name: 'Player 1',
            speed: 5,
        } as Player;

        const player2: Player = {
            id: 'player2',
            name: 'Player 2',
            speed: 3,
            bonus: {
                speed: 3,
            },
        } as Player;

        const player3: Player = {
            id: 'player3',
            name: 'Player 3',
            speed: 7,
            bonus: {
                speed: 0,
            },
        } as Player;

        const gameState = {
            players: [player1, player2, player3],
        } as GameState;

        (boardService as any).sortPlayersBySpeed(gameState);

        expect(gameState.players[0].id).to.equal('player3');
        expect(gameState.players[1].id).to.equal('player2');
        expect(gameState.players[2].id).to.equal('player1');
    });

    it('should sort players with null or undefined bonus property correctly', async () => {
        const player1: Player = {
            id: 'player1',
            name: 'Player 1',
            speed: 5,
            bonus: null,
        } as Player;

        const player2: Player = {
            id: 'player2',
            name: 'Player 2',
            speed: 3,
        } as Player;

        const gameState = {
            players: [player1, player2],
        } as GameState;

        (boardService as any).sortPlayersBySpeed(gameState);

        expect(gameState.players[0].id).to.equal('player1');
        expect(gameState.players[1].id).to.equal('player2');
    });
    it('should return [] if findReachablePositions returns null', () => {
        pathfindingService.findReachablePositions.returns(null);

        const gameState = { currentPlayerMovementPoints: 5 } as any;
        const result = (boardService as any).findAllPaths(gameState, { x: 0, y: 0 });

        expect(result).to.deep.equal([]);
    });
    it('should return [] if findReachablePositions throws error', () => {
        pathfindingService.findReachablePositions.throws(new Error('Test error'));

        const gameState = { currentPlayerMovementPoints: 5 } as any;
        const result = (boardService as any).findAllPaths(gameState, { x: 0, y: 0 });

        expect(result).to.deep.equal([]);
    });

    it('should handle null paths in calculateShortestMoves', () => {
        const gs = { currentPlayerMovementPoints: 3 } as any;
        pathfindingService.findShortestPath.returns(null);
        const result = (boardService as any).calculateShortestMoves(gs, { x: 0, y: 0 }, [{ x: 1, y: 1 }]);
        expect(result).to.deep.equal([]);
    });
    it('should return 0 if both player.speed and bonus.speed are 0', () => {
        const player = { speed: 0, bonus: { speed: 0 } } as any;
        const result = (boardService as any).getPlayerMovementPoints(player);
        expect(result).to.equal(0);
    });
    it('should return game state unchanged if player not found in handleTeleport', () => {
        const state: GameState = {
            players: [{ id: 'p1' }],
            currentPlayer: 'pX',
            playerPositions: [],
        } as any;

        const result = boardService.handleTeleport(state, { x: 2, y: 2 });
        expect(result).to.equal(state);
    });

    it('should return game state unchanged if playerPosition is undefined in handleTeleport', () => {
        const state: GameState = {
            players: [{ id: 'p1' }],
            currentPlayer: 'p1',
            playerPositions: [],
        } as any;

        const result = boardService.handleTeleport(state, { x: 2, y: 2 });
        expect(result).to.equal(state);
    });

    it('should return game state unchanged if target position is occupied in handleTeleport', () => {
        sandbox.stub(boardService as any, 'isOccupied').returns(true);

        const state: GameState = {
            players: [{ id: 'p1' }],
            currentPlayer: 'p1',
            playerPositions: [{ x: 0, y: 0 }],
        } as any;

        const result = boardService.handleTeleport(state, { x: 2, y: 2 });
        expect(result).to.equal(state);
    });

    it('should correctly update player position in handleTeleport', () => {
        sandbox.stub(boardService as any, 'isOccupied').returns(false);

        const state: GameState = {
            players: [{ id: 'p1' }],
            currentPlayer: 'p1',
            playerPositions: [{ x: 0, y: 0 }],
        } as any;

        const result = boardService.handleTeleport(state, { x: 2, y: 2 });
        expect(result.playerPositions[0]).to.deep.equal({ x: 2, y: 2 });
    });

    it('should handle empty availableMoves correctly in handleTeleport', () => {
        sandbox.stub(boardService as any, 'isOccupied').returns(false);
        const state: GameState = {
            players: [{ id: 'p1' }],
            currentPlayer: 'p1',
            playerPositions: [{ x: 0, y: 0 }],
            currentPlayerMovementPoints: -1,
        } as any;

        const result = boardService.handleTeleport(state, { x: 2, y: 2 });
        expect(result.availableMoves).to.deep.equal([]);
        expect(result.shortestMoves).to.deep.equal([]);
    });

    it('should ensure getPlayerMovementPoints returns default if undefined', () => {
        const player: Player = { id: 'p1', speed: undefined } as any;
        const result = (boardService as any).getPlayerMovementPoints(player);
        expect(result).to.equal(0);
    });

    it('should correctly return true if another player is at position', () => {
        const state: GameState = {
            board: [[0]],
            players: [{ id: 'p1' }, { id: 'p2' }],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
        } as any;

        const result = (boardService as any).isOccupied(state, { x: 1, y: 1 }, 0);
        expect(result).to.be.equal(true);
    });
    it('should return true if another player occupies the position', () => {
        const gameState = {
            board: [[0]],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
        } as any;

        const result = (boardService as any).isOccupied(gameState, { x: 1, y: 1 }, 0);
        expect(result).to.equal(true);
    });

    it('should return true if item is neither SPAWN nor EMPTY', () => {
        const gameState = {
            board: [[ObjectsTypes.SPAWN * TILE_DELIMITER + TileTypes.Wall]],
            playerPositions: [{ x: 2, y: 2 }],
        } as any;

        const position = { x: 0, y: 0 };
        const result = (boardService as any).isOccupied(gameState, position, 0);
        expect(result).to.equal(true);
    });

    it('should return true if tile is a wall or closed door', () => {
        const gameState = {
            board: [[0 * TILE_DELIMITER + TileTypes.Wall]],
            playerPositions: [{ x: 2, y: 2 }],
        } as any;

        const position = { x: 0, y: 0 };
        const result = (boardService as any).isOccupied(gameState, position, 0);
        expect(result).to.equal(true);
    });
    it('should update available and shortest moves in handleTeleport when movement points >= 0', () => {
        const stubFindAllPaths = sandbox.stub(boardService as any, 'findAllPaths').returns([{ x: 1, y: 1 }]);
        const stubCalculateShortestMoves = sandbox.stub(boardService as any, 'calculateShortestMoves').returns([[{ x: 1, y: 1 }]]);
        sandbox.stub(boardService as any, 'isOccupied').returns(false);

        const state: GameState = {
            players: [{ id: 'p1' }],
            currentPlayer: 'p1',
            playerPositions: [{ x: 0, y: 0 }],
            currentPlayerMovementPoints: 1,
        } as any;

        const result = boardService.handleTeleport(state, { x: 2, y: 2 });

        expect(stubFindAllPaths.calledOnce).to.equal(true);
        expect(stubCalculateShortestMoves.calledOnce).to.equal(true);
        expect(result.availableMoves).to.deep.equal([{ x: 1, y: 1 }]);
        expect(result.shortestMoves).to.deep.equal([[{ x: 1, y: 1 }]]);
    });
    it('should return true in isOccupied if item is not SPAWN or EMPTY', () => {
        const state: GameState = {
            board: [[(ObjectsTypes.WALL || 3) * TILE_DELIMITER]],
            playerPositions: [{ x: 2, y: 2 }],
        } as any;

        const result = (boardService as any).isOccupied(state, { x: 0, y: 0 }, 0);
        expect(result).to.equal(true);
    });
    it('should return false in isOccupied if position not occupied and item is SPAWN or EMPTY and tile not wall/door', () => {
        const state: GameState = {
            board: [[ObjectsTypes.SPAWN * TILE_DELIMITER + TileTypes.Grass]],
            playerPositions: [{ x: 1, y: 1 }],
        } as any;

        const result = (boardService as any).isOccupied(state, { x: 0, y: 0 }, 0);
        expect(result).to.equal(false);
    });
    it('should replace RANDOM tiles with a random object type', () => {
        const gameState: GameState = {
            board: [[ObjectsTypes.RANDOM * TILE_DELIMITER + TileTypes.Grass], [0, 0]],
        } as any;

        (boardService as any).randomizeItem(gameState);

        const newTile = gameState.board[0][0];
        const objectValue = Math.floor(newTile / TILE_DELIMITER);
        const tileType = newTile % TILE_DELIMITER;

        expect([ObjectsTypes.BOOTS, ObjectsTypes.SWORD, ObjectsTypes.POTION, ObjectsTypes.WAND, ObjectsTypes.JUICE, ObjectsTypes.CRYSTAL]).to.include(
            objectValue,
        );
        expect(tileType).to.equal(TileTypes.Grass);
    });

    it('should not modify non-RANDOM tiles', () => {
        const gameState: GameState = {
            board: [[ObjectsTypes.SPAWN * TILE_DELIMITER + TileTypes.Grass], [ObjectsTypes.BOOTS * TILE_DELIMITER + TileTypes.Wall]],
        } as any;

        (boardService as any).randomizeItem(gameState);

        expect(gameState.board[0][0]).to.equal(ObjectsTypes.SPAWN * TILE_DELIMITER + TileTypes.Grass);
        expect(gameState.board[1][0]).to.equal(ObjectsTypes.BOOTS * TILE_DELIMITER + TileTypes.Wall);
    });

    it('should handle empty board without errors', () => {
        const gameState: GameState = { board: [] } as any;

        expect(() => (boardService as any).randomizeItem(gameState)).to.not.throw();
        expect(gameState.board).to.deep.equal([]);
    });

    it('should exclude already present object types from randomization', () => {
        const gameState: GameState = {
            board: [[ObjectsTypes.BOOTS * TILE_DELIMITER + TileTypes.Grass], [ObjectsTypes.RANDOM * TILE_DELIMITER + TileTypes.Grass]],
        } as any;

        (boardService as any).randomizeItem(gameState);

        const newTile = gameState.board[1][0];
        const objectValue = Math.floor(newTile / TILE_DELIMITER);

        expect(objectValue).to.not.equal(ObjectsTypes.BOOTS);
        expect([ObjectsTypes.SWORD, ObjectsTypes.POTION, ObjectsTypes.WAND, ObjectsTypes.JUICE, ObjectsTypes.CRYSTAL]).to.include(objectValue);
    });

    it('should preserve tile type when replacing RANDOM', () => {
        const gameState: GameState = {
            board: [[ObjectsTypes.RANDOM * TILE_DELIMITER + TileTypes.Wall]],
        } as any;

        (boardService as any).randomizeItem(gameState);

        const newTile = gameState.board[0][0];
        const tileType = newTile % TILE_DELIMITER;

        expect(tileType).to.equal(TileTypes.Wall);
    });
});
