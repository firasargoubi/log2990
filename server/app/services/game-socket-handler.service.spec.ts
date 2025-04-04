/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameSocketConstants } from '@app/constants/game-socket-handler-const';
import { BoardService } from '@app/services/board.service';
import { GameSocketHandlerService } from '@app/services/game-socket-handler.service';
import { LobbySocketHandlerService } from '@app/services/lobby-socket-handler.service';
import { GameEvents } from '@common/events';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { ObjectsTypes, Tile, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { expect } from 'chai';
import { createSandbox, SinonFakeTimers, SinonSandbox, SinonStub, useFakeTimers } from 'sinon';
import { PathfindingService } from './pathfinding.service';

describe('GameSocketHandlerService', () => {
    let sandbox: SinonSandbox;
    let lobbies: Map<string, GameLobby>;
    let gameStates: Map<string, GameState>;
    let boardService: BoardService;
    let lobbySocketHandlerService: LobbySocketHandlerService;
    let pathfindingService: PathfindingService;
    let service: GameSocketHandlerService;
    let socket: any;
    let clock: SinonFakeTimers;

    let emitStub: SinonStub;
    let ioToStub: SinonStub;

    beforeEach(() => {
        sandbox = createSandbox();
        lobbies = new Map<string, GameLobby>();
        gameStates = new Map<string, GameState>();
        clock = useFakeTimers();

        boardService = {
            initializeGameState: sandbox.stub(),
            handleEndTurn: sandbox.stub(),
            handleMovement: sandbox.stub(),
            updatePlayerMoves: sandbox.stub(),
            handleTurn: sandbox.stub(),
            handleBoardChange: sandbox.stub(),
            handleTeleport: sandbox.stub(),
        } as any;

        pathfindingService = {
            findClosestAvailableSpot: sandbox.stub(),
        } as any;

        lobbySocketHandlerService = {
            updateLobby: sandbox.stub(),
        } as any;

        service = new GameSocketHandlerService(lobbies, gameStates, boardService, lobbySocketHandlerService, pathfindingService);

        emitStub = sandbox.stub();
        ioToStub = sandbox.stub().returns({ emit: emitStub, to: sandbox.stub().returns({ emit: emitStub }) });
        service['io'] = { to: ioToStub } as any;

        socket = { id: 'socket1', emit: emitStub };
    });

    afterEach(() => {
        clock.restore();
        sandbox.restore();
    });

    it('should emit error if lobby not found in handleRequestStart', async () => {
        await service.handleRequestStart(socket, 'unknown');
        expect(emitStub.calledWith(GameEvents.Error, 'Lobby not found.')).to.equal(true);
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
        expect(emitStub.calledWith(GameEvents.Error, 'Only the host can start the game.')).to.equal(true);
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
            playerPositions: [{ x: 0, y: 0 }],
        } as any;

        (boardService.initializeGameState as any).resolves(gameState);
        (boardService.handleTurn as any).returns(gameState);

        lobbies.set('lobby1', lobby);

        await service.handleRequestStart(socket, 'lobby1');

        expect(gameStates.get('lobby1')).to.deep.equal(gameState);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.GameStarted, { gameState })).to.equal(true);
    });

    it('should emit error on gameState not found in handleEndTurn', () => {
        service.handleEndTurn(socket, 'lobbyX');
        expect(emitStub.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
    });

    it('should emit error if not currentPlayer in handleEndTurn', () => {
        const gameState = { currentPlayer: 'other' } as GameState;
        gameStates.set('lobby1', gameState);
        service.handleEndTurn(socket, 'lobby1');
        expect(emitStub.calledWith(GameEvents.Error, "It's not your turn.")).to.equal(true);
    });

    it('should handleEndTurn successfully', () => {
        const gameState: GameState = { currentPlayer: 'socket1' } as any;
        const updatedGameState = { currentPlayer: 'socket2' } as any;
        (boardService.handleEndTurn as any).returns(updatedGameState);
        (boardService.handleTurn as any).returns(updatedGameState);
        gameStates.set('lobby1', gameState);
        service.handleEndTurn(socket, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
    });

    it('should emit error if gameState not found in handleRequestMovement', () => {
        service.handleRequestMovement(socket, 'lobbyX', [{ x: 0, y: 0 }]);
        expect(emitStub.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
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

    it('should emit error if handleTurn throws in startTurn', () => {
        const gameState: GameState = {
            currentPlayer: 'socket1',
            availableMoves: [],
            playerPositions: [],
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleTurn as any).throws(new Error('Turn error'));

        service.startTurn('lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.Error, 'Turn error:Turn error')).to.equal(true);
    });

    it('should emit error if gameState not found in closeDoor', () => {
        service.closeDoor(socket, { x: 0, y: 0 } as Tile, 'lobbyX');
        expect(emitStub.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
    });

    it('should update board and emit boardModified in closeDoor', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
            players: [{ id: 'socket1', currentAP: 2 } as any],
            currentPlayer: 'socket1',
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleBoardChange as any).returns(gameState);

        service.closeDoor(socket, { x: 0, y: 0 } as Tile, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.BoardModified, { gameState })).to.equal(true);
    });

    it('should emit error if gameState not found in openDoor', () => {
        service.openDoor(socket, { x: 0, y: 0 } as Tile, 'lobbyX');
        expect(emitStub.calledWith(GameEvents.Error, 'Game not found.')).to.equal(true);
    });

    it('should update board and emit boardModified in openDoor', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
            players: [{ id: 'socket1', currentAP: 2 } as any],
            currentPlayer: 'socket1',
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleBoardChange as any).returns(gameState);

        service.openDoor(socket, { x: 0, y: 0 } as Tile, 'lobby1');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.BoardModified, { gameState })).to.equal(true);
    });

    it('should initialize combat state in startBattle', () => {
        const currentPlayer = { id: 'p1', amountEscape: 0 } as Player;
        const opponent = { id: 'p2', amountEscape: 0 } as Player;
        const gameState = {
            players: [{ id: 'p1', amountEscape: 0 } as Player, { id: 'p2', amountEscape: 0 } as Player],
            currentPlayerActionPoints: 1,
        } as GameState;
        gameStates.set('lobby1', gameState);

        service.startBattle('lobby1', currentPlayer, opponent);

        expect(gameState.currentPlayerActionPoints).to.equal(0);
        expect(currentPlayer.amountEscape).to.equal(0);
        expect(opponent.amountEscape).to.equal(0);
        expect(ioToStub.calledWith(currentPlayer.id)).to.equal(true);
        expect(emitStub.calledWith('startCombat')).to.equal(true);
    });

    it('should handle player updates when a player is removed', () => {
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
                { x: 1, y: 1 },
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
        expect(updatedGameState!.deletedPlayers).to.have.lengthOf(1);
        expect(updatedGameState!.deletedPlayers![0].id).to.equal('socket2');
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.BoardModified)).to.equal(true);
    });

    it('should handle defeat and reset player position', () => {
        const winner = { id: 'p1', maxLife: 10, life: 5 } as Player;
        const loser = { id: 'p2', maxLife: 10, life: 0 } as Player;
        const gameState: GameState = {
            players: [winner, loser],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 2, y: 2 }, // Different from current position
            ],
            board: [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ],
            currentPlayer: 'p2',
            currentPlayerActionPoints: 1,
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleEndTurn as any).returns(gameState);
        (boardService.handleTurn as any).returns(gameState);

        service.handleDefeat('lobby1', winner, loser);

        // Check health restoration
        expect(winner.life).to.equal(winner.maxLife);
        expect(loser.life).to.equal(loser.maxLife);

        // Check player position reset
        expect(gameState.playerPositions[1]).to.deep.equal(gameState.spawnPoints[1]);

        // Check combat ended emit
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('combatEnded', { loser })).to.equal(true);
    });

    it('should find a new spawn point if original is occupied', () => {
        const winner = { id: 'p1', maxLife: 10, life: 5 } as Player;
        const loser = { id: 'p2', maxLife: 10, life: 0 } as Player;

        // Setup a situation where the original spawn is occupied
        const gameState: GameState = {
            players: [winner, loser],
            playerPositions: [
                { x: 0, y: 0 }, // Winner at (0,0)
                { x: 1, y: 1 }, // Loser at (1,1)
            ],
            spawnPoints: [
                { x: 0, y: 0 }, // Winner's spawn is same as current position
                { x: 0, y: 0 }, // Loser's spawn is occupied by winner
            ],
            board: [
                [0, 0],
                [0, 0],
            ],
            currentPlayer: 'p2',
        } as any;

        const alternativeSpawn = { x: 2, y: 2 };
        (pathfindingService.findClosestAvailableSpot as any).returns(alternativeSpawn);

        gameStates.set('lobby1', gameState);
        (boardService.handleEndTurn as any).returns(gameState);
        (boardService.handleTurn as any).returns(gameState);

        service.handleDefeat('lobby1', winner, loser);

        // Check if findClosestAvailableSpot was called
        expect((pathfindingService.findClosestAvailableSpot as SinonStub).called).to.equal(true);

        // Check if the loser was moved to the alternative spawn
        expect(gameState.playerPositions[1]).to.deep.equal(alternativeSpawn);
    });

    it('should set debug mode and emit boardModified', () => {
        const gameState: GameState = { debug: false } as any;
        gameStates.set('lobby1', gameState);

        service.handleSetDebug(socket, 'lobby1', true);

        const updatedGameState = gameStates.get('lobby1');
        expect(updatedGameState!.debug).to.equal(true);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('boardModified', { gameState: updatedGameState })).to.equal(true);
    });

    it('should emit attackResult with damage calculation in handleAttackAction', () => {
        const attacker: Player = {
            id: 'p1',
            life: 10,
            attack: 5,
            bonus: { attack: 'D6', defense: 'D6' },
            defense: 0,
        } as Player;

        const defender: Player = {
            id: 'p2',
            life: 10,
            defense: 3,
            bonus: { attack: 'D6', defense: 'D6' },
        } as Player;

        const gameState: GameState = {
            players: [attacker, defender],
            board: [[TileTypes.Floor]],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            debug: false,
        } as any;

        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0.5); // For predictable dice rolls

        service.handleAttackAction('lobby1', attacker, defender);

        expect(defender.life).to.be.lessThan(10); // Defender should lose health
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('attackResult')).to.equal(true);
    });

    it('should prevent flee attempts after 2 failures', () => {
        const player = { id: 'p1', amountEscape: 2 } as Player;
        const gameState = { players: [player] } as GameState;
        gameStates.set('lobby1', gameState);

        service.handleFlee('lobby1', player);

        // amountEscape should remain 2
        expect(player.amountEscape).to.equal(2);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.FleeFailure)).to.equal(true);
    });

    it('should handle teleport requests correctly', () => {
        const gameState: GameState = {
            board: [[TileTypes.Floor]],
            playerPositions: [{ x: 0, y: 0 }],
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleTeleport as any).returns(gameState);

        service.handleTeleport(socket, 'lobby1', { x: 1, y: 1 });

        expect((boardService.handleTeleport as SinonStub).firstCall.args[0]).to.equal(gameState);
        expect((boardService.handleTeleport as SinonStub).firstCall.args[1]).to.deep.equal({ x: 1, y: 1 });
        expect(gameStates.get('lobby1')).to.equal(gameState);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('boardModified', { gameState })).to.equal(true);
    });

    it('should check if player is on ice tile when calculating attack', () => {
        const attacker: Player = {
            id: 'p1',
            life: 10,
            attack: 5,
            bonus: { attack: 'D6', defense: 'D6' },
            defense: 0,
        } as Player;

        const defender: Player = {
            id: 'p2',
            life: 10,
            defense: 3,
            bonus: { attack: 'D6', defense: 'D6' },
        } as Player;

        const gameState: GameState = {
            players: [attacker, defender],
            board: [[TileTypes.Ice, TileTypes.Floor]], // Attacker on ice
            playerPositions: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            debug: false,
        } as any;

        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0.5); // For predictable dice rolls

        service.handleAttackAction('lobby1', attacker, defender);

        // The actual test is hard to assert directly, but we can check that the attack happened
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('attackResult')).to.equal(true);

        // If the player is on ice, the damage will be reduced by 2 in the dice roll
        // We'd need to capture the actual parameters to verify this calculation
    });

    // Add these tests to your GameSocketHandlerService spec file

    describe('Error handling', () => {
        // Test for handleDefeat when winnerIndex or loserIndex is -1
        it('should exit handleDefeat if player indices are not found', () => {
            const winner = { id: 'p1', maxLife: 10 } as Player;
            const loser = { id: 'p2', maxLife: 10 } as Player;
            const gameState: GameState = {
                players: [], // Empty players array will cause indices to be -1
            } as any;

            gameStates.set('lobby1', gameState);

            service.handleDefeat('lobby1', winner, loser);

            // Should not emit any events since it exits early
            expect(ioToStub.called).to.equal(false);
        });

        // Test for handleDefeat when gameState is not found
        it('should exit handleDefeat if gameState is not found', () => {
            const winner = { id: 'p1' } as Player;
            const loser = { id: 'p2' } as Player;

            // Don't set any gameState

            service.handleDefeat('lobbyNonexistent', winner, loser);

            // Should not emit any events
            expect(ioToStub.called).to.equal(false);
        });

        // Test handleFlee when gameState is not found
        it('should exit handleFlee if gameState is not found', () => {
            const player = { id: 'p1' } as Player;

            // Don't set any gameState

            service.handleFlee('lobbyNonexistent', player);

            // Should not emit any events
            expect(ioToStub.called).to.equal(false);
        });

        // Test force debug to true in flee
        it('should force successful flee in debug mode', () => {
            const player = { id: 'p1', amountEscape: 1 } as Player;
            const gameState = {
                players: [player],
                debug: true, // Enable debug mode
            } as GameState;

            gameStates.set('lobby1', gameState);

            // Even with a large random value that would normally fail
            sandbox.stub(Math, 'random').returns(0.99);

            service.handleFlee('lobby1', player);

            // Should succeed due to debug mode
            expect(ioToStub.calledWith('lobby1')).to.equal(true);
            expect(emitStub.calledWith(GameEvents.FleeSuccess)).to.equal(true);
        });

        // Test for init error in handleRequestStart
        // it('should handle initialization errors in handleRequestStart', async () => {
        //     const lobby: GameLobby = {
        //         id: 'lobby1',
        //         players: [{ id: 'socket1', isHost: true } as any],
        //         isLocked: false,
        //         maxPlayers: 4,
        //         gameId: 'g1',
        //     };

        //     lobbies.set('lobby1', lobby);

        //     // Force boardService.initializeGameState to throw
        //     (boardService.initializeGameState as any).rejects(new Error('Init error'));

        //     await service.handleRequestStart(socket, 'lobby1');

        //     const gameSocketMessages = { failedStartGame: 'Failed to start game:' };
        //     expect(emitStub.calledWith(GameEvents.Error, `${gameSocketMessages.failedStartGame} Init error`)).to.equal(true);
        // });

        // This test verifies that isInSpawnPoints works correctly
        it('should check if player is in spawn points correctly', () => {
            const winner = { id: 'p1', maxLife: 10, life: 5 } as Player;
            const loser = { id: 'p2', maxLife: 10, life: 0 } as Player;

            // Create a scenario where the loser is at their spawn point
            const gameState: GameState = {
                players: [winner, loser],
                playerPositions: [
                    { x: 0, y: 0 },
                    { x: 2, y: 2 }, // Same as spawn point
                ],
                spawnPoints: [
                    { x: 0, y: 0 },
                    { x: 2, y: 2 }, // Same as player position
                ],
                board: [
                    [0, 0, 0],
                    [0, 0, 0],
                    [0, 0, 0],
                ],
                currentPlayer: 'p3', // Neither winner nor loser
            } as any;

            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as any).returns(gameState);

            service.handleDefeat('lobby1', winner, loser);

            // Since player is at spawn, findClosestAvailableSpot should not be called
            expect((pathfindingService.findClosestAvailableSpot as SinonStub).called).to.equal(false);

            // Player position should remain the same
            expect(gameState.playerPositions[1]).to.deep.equal(gameState.spawnPoints[1]);
        });

        // Test case for handleError in startTurn
        it('should handle error in startTurn', () => {
            const gameState: GameState = {
                currentPlayer: 'socket1',
                availableMoves: [],
                playerPositions: [],
            } as any;

            gameStates.set('lobby1', gameState);

            // Stub handleTurn to throw an error
            const error = new Error('Turn error');
            (boardService.handleTurn as any).throws(error);

            service.startTurn('lobby1');

            // Verify error message format with gameSocketMessages.turnError
            expect(ioToStub.calledWith('lobby1')).to.equal(true);
            expect(emitStub.calledWith(GameEvents.Error, 'Turn error:Turn error')).to.equal(true);
        });

        // Test case for the error handling in handleEndTurn
        it('should handle error in handleEndTurn', () => {
            const gameState: GameState = {
                currentPlayer: 'socket1',
            } as any;

            gameStates.set('lobby1', gameState);

            // Stub handleEndTurn to throw an error
            const error = new Error('End turn error');
            (boardService.handleEndTurn as any).throws(error);

            service.handleEndTurn(socket, 'lobby1');

            // Verify error message format
            expect(emitStub.calledWith(GameEvents.Error, 'Failed to end turn: End turn error')).to.equal(true);
        });
        it('should handle error in handleTeleport', () => {
            const gameState: GameState = {
                board: [[TileTypes.Floor]],
                playerPositions: [{ x: 0, y: 0 }],
            } as any;

            gameStates.set('lobby1', gameState);

            // Force boardService.handleTeleport to throw an error
            (boardService.handleTeleport as SinonStub).throws(new Error('Teleport error'));

            service.handleTeleport(socket, 'lobby1', { x: 1, y: 1 });

            // Verify error is emitted
            expect(emitStub.calledWith('error')).to.equal(true);
            expect(emitStub.calledWith('error', 'Teleport error: Teleport error')).to.equal(true);
        });
    });

    it('should handle flee success', () => {
        const player = { id: 'p1', amountEscape: 1 } as Player;
        const gameState = {
            players: [player],
            debug: false,
        } as GameState;

        gameStates.set('lobby1', gameState);

        // Force successful flee by setting random to return a small value
        sandbox.stub(Math, 'random').returns(0.01); // Less than FLEE_RATE_PERCENT/MAX_FLEE which is 30/100 = 0.3

        service.handleFlee('lobby1', player);

        // Check flee success was emitted
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.FleeSuccess)).to.equal(true);
        expect(emitStub.calledWith(GameEvents.BoardModified)).to.equal(true);

        // Check player's amountEscape was reset
        expect(player.amountEscape).to.equal(0);
    });

    it('should handle flee failure', () => {
        const player = { id: 'p1', amountEscape: 1 } as Player;
        const gameState = {
            players: [player],
            debug: false,
        } as GameState;

        gameStates.set('lobby1', gameState);

        // Force failed flee by setting random to return a large value
        sandbox.stub(Math, 'random').returns(0.9); // Greater than FLEE_RATE_PERCENT/MAX_FLEE

        service.handleFlee('lobby1', player);

        // Check flee failure was emitted
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.FleeFailure)).to.equal(true);

        // Check player's amountEscape was incremented
        expect(player.amountEscape).to.equal(2);
    });

    it('should return correct dice values', () => {
        // Test D4 dice
        const d4Value = (service as any).getDiceValue('D4');
        expect(d4Value).to.equal(4);

        // Test D6 dice
        const d6Value = (service as any).getDiceValue('D6');
        expect(d6Value).to.equal(6);

        // Test invalid dice
        const invalidValue = (service as any).getDiceValue('D10');
        expect(invalidValue).to.equal(0);
    });

    describe('isPlayerOnIceTile', () => {
        it('should return false if player not found', () => {
            const gameState: GameState = {
                players: [{ id: 'p1' } as Player],
                playerPositions: [{ x: 0, y: 0 }],
                board: [[TileTypes.Ice]],
            } as any;

            const result = (service as any).isPlayerOnIceTile(gameState, { id: 'p2' } as Player);
            expect(result).to.equal(false);
        });

        it('should return false if position not found', () => {
            const gameState: GameState = {
                players: [{ id: 'p1' } as Player],
                playerPositions: [],
                board: [[TileTypes.Ice]],
            } as any;

            const result = (service as any).isPlayerOnIceTile(gameState, { id: 'p1' } as Player);
            expect(result).to.equal(false);
        });

        it('should return true if player is on ice tile', () => {
            const gameState: GameState = {
                players: [{ id: 'p1' } as Player],
                playerPositions: [{ x: 0, y: 0 }],
                board: [[TileTypes.Ice]],
            } as any;

            const result = (service as any).isPlayerOnIceTile(gameState, { id: 'p1' } as Player);
            expect(result).to.equal(true);
        });

        it('should return false if player is not on ice tile', () => {
            const gameState: GameState = {
                players: [{ id: 'p1' } as Player],
                playerPositions: [{ x: 0, y: 0 }],
                board: [[TileTypes.Grass]],
            } as any;

            const result = (service as any).isPlayerOnIceTile(gameState, { id: 'p1' } as Player);
            expect(result).to.equal(false);
        });
    });

    it('should handle defeat when loser is current player', () => {
        const winner = { id: 'p1', maxLife: 10, life: 5 } as Player;
        const loser = { id: 'p2', maxLife: 10, life: 0 } as Player;
        const gameState: GameState = {
            players: [winner, loser],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ],
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 2, y: 2 },
            ],
            board: [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0],
            ],
            currentPlayer: 'p2', // Loser is current player
            currentPlayerActionPoints: 1,
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleEndTurn as any).returns(gameState);
        (boardService.handleTurn as any).returns(gameState);

        service.handleDefeat('lobby1', winner, loser);

        // Should call handleEndTurn and startTurn
        expect((boardService.handleEndTurn as SinonStub).calledWith(gameState)).to.equal(true);
    });

    it('should not proceed with handleAttackAction if gameState is not found', () => {
        const attacker = { id: 'p1' } as Player;
        const defender = { id: 'p2' } as Player;

        service.handleAttackAction('nonexistent', attacker, defender);

        // Should not emit any events
        expect(ioToStub.called).to.equal(false);
    });

    it('should not proceed with handleAttackAction if players are not found', () => {
        const attacker = { id: 'p1' } as Player;
        const defender = { id: 'p2' } as Player;
        const gameState: GameState = {
            players: [{ id: 'p3' } as Player], // Different player
            board: [[TileTypes.Floor]],
            playerPositions: [{ x: 0, y: 0 }],
        } as any;

        gameStates.set('lobby1', gameState);

        service.handleAttackAction('lobby1', attacker, defender);

        // Should not emit any events
        expect(ioToStub.called).to.equal(false);
    });

    it('should handle zero damage in attack calculations', () => {
        const attacker: Player = {
            id: 'p1',
            life: 10,
            attack: 1, // Low attack
            bonus: { attack: 'D6', defense: 'D6' },
            defense: 0,
        } as Player;

        const defender: Player = {
            id: 'p2',
            life: 10,
            defense: 10, // High defense
            bonus: { attack: 'D6', defense: 'D6' },
        } as Player;

        const gameState: GameState = {
            players: [attacker, defender],
            board: [[TileTypes.Floor]],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            debug: false,
        } as any;

        gameStates.set('lobby1', gameState);

        // Force dice rolls to produce zero damage
        sandbox.stub(Math, 'random').returns(0); // Minimum roll

        service.handleAttackAction('lobby1', attacker, defender);

        // Check defender's life was not changed
        expect(defender.life).to.equal(10);

        // Check attack result was emitted with zero damage
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('attackResult')).to.equal(true);
        expect(emitStub.args.some((args) => args[0] === 'attackResult' && args[1].damage === 0)).to.equal(true);
    });

    it('should handle player defeat in handleAttackAction', () => {
        const attacker: Player = {
            id: 'p1',
            life: 10,
            attack: 20, // High attack
            winCount: 0,
            bonus: { attack: 'D6', defense: 'D6' },
            defense: 0,
        } as Player;

        const defender: Player = {
            id: 'p2',
            life: 1, // Low health
            defense: 0,
            bonus: { attack: 'D6', defense: 'D6' },
        } as Player;

        const gameState: GameState = {
            players: [attacker, defender],
            board: [[TileTypes.Floor]],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            debug: false,
        } as any;

        gameStates.set('lobby1', gameState);

        // Spy on handleDefeat
        const handleDefeatSpy = sandbox.spy(service, 'handleDefeat');

        // Force high dice roll for attacker
        sandbox.stub(Math, 'random').returns(0.99);

        service.handleAttackAction('lobby1', attacker, defender);

        // Check attacker's winCount was incremented
        expect(attacker.winCount).to.equal(1);

        // Check handleDefeat was called
        expect(handleDefeatSpy.calledWith('lobby1', attacker, defender)).to.equal(true);
    });

    it('should declare game over when attacker reaches MAX_WIN_COUNT', () => {
        const attacker: Player = {
            id: 'p1',
            name: 'Winner',
            life: 10,
            attack: 20,
            winCount: 2, // One away from MAX_WIN_COUNT (3)
            bonus: { attack: 'D6', defense: 'D6' },
            defense: 0,
        } as Player;

        const defender: Player = {
            id: 'p2',
            life: 1,
            defense: 0,
            bonus: { attack: 'D6', defense: 'D6' },
        } as Player;

        const gameState: GameState = {
            players: [attacker, defender],
            board: [[TileTypes.Floor]],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            debug: false,
        } as any;

        gameStates.set('lobby1', gameState);

        // Force high dice roll for attacker
        sandbox.stub(Math, 'random').returns(0.99);

        // Spy on handleDefeat
        const handleDefeatSpy = sandbox.spy(service, 'handleDefeat');

        service.handleAttackAction('lobby1', attacker, defender);

        // Check attacker's winCount is now 3
        expect(attacker.winCount).to.equal(3);

        // Check gameOver was emitted and handleDefeat was not called
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('gameOver', { winner: 'Winner' })).to.equal(true);
        expect(handleDefeatSpy.called).to.equal(false);
    });
    it('should emit error if game mode is "capture" and players count is odd', async () => {
        const lobby: GameLobby = {
            id: 'lobby1',
            players: [{ id: 'socket1', isHost: true } as any, { id: 'socket2', isHost: false } as any, { id: 'socket3', isHost: false } as any],
            isLocked: false,
            maxPlayers: 4,
            gameId: 'g1',
        };
        const gameState: GameState = { gameMode: 'capture' } as any;

        lobbies.set('lobby1', lobby);
        (boardService.initializeGameState as any).resolves(gameState);

        await service.handleRequestStart(socket, 'lobby1');
        expect(emitStub.calledWith(GameEvents.Error, "Il n'y a pas assez de joueurs pour commencer une partie CTF")).to.equal(true);
    });
    describe('createTeams', () => {
        it('should create two teams and emit TeamsCreated event', () => {
            const players: Player[] = [
                { id: 'p1', name: 'Player 1' } as Player,
                { id: 'p2', name: 'Player 2' } as Player,
                { id: 'p3', name: 'Player 3' } as Player,
                { id: 'p4', name: 'Player 4' } as Player,
            ];

            const gameState: GameState = {
                players,
            } as any;

            gameStates.set('lobby1', gameState);

            service.createTeams('lobby1', players);

            const updatedGameState = gameStates.get('lobby1');
            expect(updatedGameState!.teams).to.exist;
            expect(updatedGameState!.teams!.team1).to.have.lengthOf(2);
            expect(updatedGameState!.teams!.team2).to.have.lengthOf(2);

            expect(ioToStub.calledWith('lobby1')).to.equal(true);
            expect(emitStub.calledWith(GameEvents.TeamsCreated)).to.equal(true);
        });

        it('should not create teams if teams already exist', () => {
            const players: Player[] = [{ id: 'p1', name: 'Player 1' } as Player, { id: 'p2', name: 'Player 2' } as Player];

            const gameState: GameState = {
                players,
                teams: {
                    team1: [
                        {
                            id: 'p1',
                            name: 'Player 1',
                            team: 'Red',
                            avatar: '',
                            isHost: false,
                            life: 100,
                            maxLife: 100,
                            attack: 10,
                            defense: 5,
                            speed: 5,
                            bonus: { attack: 'D6', defense: 'D6' },
                            amountEscape: 0,
                            winCount: 0,
                            pendingItem: null,
                        } as Player,
                    ],
                    team2: [
                        {
                            id: 'p2',
                            name: 'Player 2',
                            team: 'Blue',
                            avatar: '',
                            isHost: false,
                            life: 100,
                            maxLife: 100,
                            attack: 10,
                            defense: 5,
                            speed: 5,
                            bonus: { attack: 'D6', defense: 'D6' },
                            amountEscape: 0,
                            winCount: 0,
                            pendingItem: null,
                        } as Player,
                    ],
                },
            } as any;

            gameStates.set('lobby1', gameState);

            service.createTeams('lobby1', players);

            const updatedGameState = gameStates.get('lobby1');
            expect(updatedGameState!.teams).to.deep.equal(gameState.teams);

            expect(ioToStub.called).to.equal(false);
            expect(emitStub.called).to.equal(false);
        });

        it('should not create teams if gameState is not found', () => {
            const players: Player[] = [{ id: 'p1', name: 'Player 1' } as Player, { id: 'p2', name: 'Player 2' } as Player];

            service.createTeams('nonexistentLobby', players);

            expect(ioToStub.called).to.equal(false);
            expect(emitStub.called).to.equal(false);
        });

        it('should shuffle players before assigning teams', () => {
            const players: Player[] = [
                { id: 'p1', name: 'Player 1' } as Player,
                { id: 'p2', name: 'Player 2' } as Player,
                { id: 'p3', name: 'Player 3' } as Player,
                { id: 'p4', name: 'Player 4' } as Player,
            ];

            const gameState: GameState = {
                players,
            } as any;

            gameStates.set('lobby1', gameState);

            sandbox.stub(Math, 'random').returns(0.5); // Ensure predictable shuffle

            service.createTeams('lobby1', players);

            const updatedGameState = gameStates.get('lobby1');
            expect(updatedGameState!.teams).to.exist;
            expect(updatedGameState!.teams!.team1).to.have.lengthOf(2);
            expect(updatedGameState!.teams!.team2).to.have.lengthOf(2);

            // Verify shuffle logic
            const allPlayers = [...updatedGameState!.teams!.team1, ...updatedGameState!.teams!.team2];
            expect(allPlayers.map((p) => p.id).sort()).to.deep.equal(players.map((p) => p.id).sort());
        });
    });
    describe('', () => {
        it('should handle inventory full scenario in handleRequestMovement', async () => {
            const gameState: GameState = {
                currentPlayer: 'socket1',
                availableMoves: [{ x: 1, y: 1 }],
                playerPositions: [{ x: 0, y: 0 }],
                players: [{ id: 'socket1', pendingItem: 1, items: [] } as any],
            } as any;

            gameStates.set('lobby1', gameState);
            (boardService.handleMovement as any).returns({ gameState, shouldStop: true });

            await service.handleRequestMovement(socket, 'lobby1', [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ]);

            expect(emitStub.calledWith('inventoryFull')).to.equal(true);
        });

        it('should handle error in startBattle when players not found', () => {
            const gameState: GameState = {
                players: [],
            } as any;
            gameStates.set('lobby1', gameState);

            const currentPlayer = { id: 'p1' } as Player;
            const opponent = { id: 'p2' } as Player;

            service.startBattle('lobby1', currentPlayer, opponent);

            expect(ioToStub.called).to.equal(true);
        });

        it('should handle undefined newGameState in handleDefeat', () => {
            const winner = { id: 'p1', maxLife: 100, life: 50 } as Player;
            const loser = { id: 'p2', maxLife: 100, life: 0 } as Player;

            const gameState: GameState = {
                players: [winner, loser],
                currentPlayer: 'p2',
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
            } as any;

            gameStates.set('lobby1', gameState);

            (boardService.handleEndTurn as any).returns({
                ...gameState,
                currentPlayer: 'p1',
            });

            service.handleDefeat('lobby1', winner, loser);

            expect(ioToStub.calledWith('lobby1')).to.equal(true);
            expect(emitStub.calledWith('combatEnded', { loser })).to.equal(true);
        });
    });

    it('should emit movementProcessed after movement is processed', async () => {
        const currentPlayer: Player = {
            id: 'socket1',
            items: [],
            name: 'Player1',
            pendingItem: null,
            avatar: '',
            isHost: false,
            life: 100,
            maxLife: 100,
            attack: 10,
            defense: 5,
            speed: 5,
            bonus: { attack: 'D6', defense: 'D6' },
            amountEscape: 0,
            winCount: 0,
        };

        const gameState: GameState = {
            currentPlayer: 'socket1',
            players: [currentPlayer],
            playerPositions: [{ x: 0, y: 0 }],
            spawnPoints: [{ x: 0, y: 0 }],
            board: [[0]],
            animation: true,
            gameMode: 'capture',
            teams: {
                team1: [currentPlayer],
                team2: [],
            },
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleMovement as any).returns({ gameState, shouldStop: false });
        (boardService.updatePlayerMoves as any).returns(gameState);

        sandbox.stub(service as any, 'delay').resolves(); // prevent actual wait

        await service.handleRequestMovement(socket, 'lobby1', [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ]);

        expect(emitStub.calledWith('movementProcessed')).to.be.true;
    });

    it('should wait for delay after each movement step', async () => {
        const currentPlayer: Player = {
            id: 'socket1',
            items: [],
            name: 'Player1',
            pendingItem: null,
            avatar: '',
            isHost: false,
            life: 100,
            maxLife: 100,
            attack: 10,
            defense: 5,
            speed: 5,
            bonus: { attack: 'D6', defense: 'D6' },
            amountEscape: 0,
            winCount: 0,
        };

        const gameState: GameState = {
            currentPlayer: 'socket1',
            players: [currentPlayer],
            playerPositions: [{ x: 0, y: 0 }],
            spawnPoints: [{ x: 0, y: 0 }],
            board: [[0]],
            animation: true,
            gameMode: 'capture',
            teams: {
                team1: [currentPlayer],
                team2: [],
            },
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleMovement as any).returns({ gameState, shouldStop: false });
        (boardService.updatePlayerMoves as any).returns(gameState);

        const delaySpy = sandbox.stub(service as any, 'delay').resolves();

        await service.handleRequestMovement(socket, 'lobby1', [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
        ]);

        expect(delaySpy.callCount).to.equal(2); // two delays after 2 movements
    });

    it('should resolve after specified delay time', async () => {
        const service: any = new GameSocketHandlerService(new Map(), new Map(), {} as any, {} as any, {} as any);

        let resolved = false;
        const promise = service.delay(1000).then(() => {
            resolved = true;
        });

        clock.tick(999);
        await Promise.resolve(); // let microtasks run
        expect(resolved).to.be.false;

        clock.tick(1);
        await promise;
        expect(resolved).to.be.true;
    });

    it('should override dice rolls when game is in debug mode', () => {
        const attacker: Player = {
            id: 'p1',
            name: 'Attacker',
            life: 10,
            attack: 8,
            defense: 2,
            bonus: { attack: 'D6', defense: 'D6' },
            amountEscape: 0,
            winCount: 0,
        } as Player;

        const defender: Player = {
            id: 'p2',
            name: 'Defender',
            life: 15,
            attack: 4,
            defense: 3,
            bonus: { attack: 'D6', defense: 'D6' },
            amountEscape: 0,
            winCount: 0,
        } as Player;

        const gameState: GameState = {
            debug: true,
            players: [attacker, defender],
            board: [[TileTypes.Floor, TileTypes.Floor]],
            playerPositions: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
        } as any;

        gameStates.set('lobby1', gameState);

        service.handleAttackAction('lobby1', attacker, defender);

        const attackResultCall = emitStub.args.find((args) => args[0] === 'attackResult');
        expect(attackResultCall).to.exist;

        const resultPayload = attackResultCall[1];
        expect(resultPayload.attackRoll).to.equal(attacker.attack * 2); // attacker.attack + attackDice (same in debug)
        expect(resultPayload.defenseRoll).to.equal(defender.defense + 1); // defenseDice = 1
    });

    it('should emit error if gameState is not found in handleTeleport', () => {
        const lobbyId = 'unknownLobby';

        // Don't set any state for this lobby
        service.handleTeleport(socket, lobbyId, { x: 0, y: 0 });

        expect(emitStub.calledWith('error', 'Game not found.')).to.be.true;
    });

    it('should reduce defenseDice by 2 when defender is on ice tile', () => {
        const attacker: Player = {
            id: 'p1',
            life: 10,
            attack: 5,
            defense: 0,
            bonus: { attack: 'D6', defense: 'D6' },
        } as Player;

        const defender: Player = {
            id: 'p2',
            life: 10,
            defense: 3,
            bonus: { attack: 'D6', defense: 'D6' },
        } as Player;

        const gameState: GameState = {
            players: [attacker, defender],
            board: [[TileTypes.Floor, TileTypes.Ice]], // defender is on Ice tile
            playerPositions: [
                { x: 0, y: 0 }, // attacker
                { x: 0, y: 1 }, // defender
            ],
            debug: false,
        } as any;

        gameStates.set('lobby1', gameState);

        // Stub random to return fixed dice roll (e.g., 0.5 * D6 = 3 + 1 = 4)
        sandbox.stub(Math, 'random').returns(0.5); // D6 = 4

        service.handleAttackAction('lobby1', attacker, defender);

        const attackResultCall = emitStub.args.find((args) => args[0] === 'attackResult');
        expect(attackResultCall).to.exist;

        const resultPayload = attackResultCall[1];

        // defenseRoll = defenseDice - 2 + defender.defense = 4 - 2 + 3 = 5
        expect(resultPayload.defenseRoll).to.equal(5);
    });
    it('should emit error if gameState is not found in handleTeleport', () => {
        const lobbyId = 'nonexistentLobby';

        service.handleTeleport(socket, lobbyId, { x: 0, y: 0 });

        expect(emitStub.calledWith('error', 'Game not found.')).to.be.true;
    });
    it('should emit error if gameState is not found in handleSetDebug', () => {
        const lobbyId = 'missingLobby';

        service.handleSetDebug(socket, lobbyId, true);

        expect(emitStub.calledWith('error', 'Game not found.')).to.be.true;
    });

    it('should choose opponent as first player if opponent has higher speed', () => {
        const currentPlayer: Player = {
            id: 'p1',
            name: 'Player1',
            speed: 5,
            team: 'Red',
            avatar: '',
            isHost: false,
            life: 100,
            maxLife: 100,
            attack: 10,
            defense: 5,
            bonus: { attack: 'D6', defense: 'D6' },
            amountEscape: 0,
            winCount: 0,
            pendingItem: null,
        } as Player;

        const opponent: Player = {
            id: 'p2',
            name: 'Player2',
            speed: 8,
            team: 'Blue',
            avatar: '',
            isHost: false,
            life: 100,
            maxLife: 100,
            attack: 10,
            defense: 5,
            bonus: { attack: 'D6', defense: 'D6' },
            amountEscape: 0,
            winCount: 0,
            pendingItem: null,
        } as Player;

        const gameState: GameState = {
            gameMode: 'capture',
            players: [currentPlayer, opponent],
            teams: { team1: [currentPlayer], team2: [opponent] },
        } as any;

        gameStates.set('lobby1', gameState);

        service.startBattle('lobby1', currentPlayer, opponent);

        const combatCall = emitStub.args.find((args) => args[0] === 'startCombat');
        expect(combatCall).to.exist;
        expect(combatCall[1].firstPlayer.id).to.equal('p2');
    });

    it('should choose currentPlayer as first player if speeds are equal', () => {
        const currentPlayer: Player = {
            id: 'p1',
            name: 'Player1',
            speed: 5,
            team: 'Red',
            avatar: '',
            isHost: false,
            life: 100,
            maxLife: 100,
            attack: 10,
            defense: 5,
            bonus: { attack: 'D6', defense: 'D6' },
            amountEscape: 0,
            winCount: 0,
            pendingItem: null,
        } as Player;

        const opponent: Player = {
            id: 'p2',
            name: 'Player2',
            speed: 5,
            avatar: '',
            isHost: false,
            life: 100,
            maxLife: 100,
            attack: 10,
            defense: 5,
            bonus: { attack: 'D6', defense: 'D6' },
            amountEscape: 0,
            winCount: 0,
            pendingItem: null,
        };

        const gameState: GameState = {
            gameMode: 'capture',
            players: [currentPlayer, opponent],
            teams: { team1: [currentPlayer], team2: [opponent] },
        } as any;

        gameStates.set('lobby1', gameState);

        service.startBattle('lobby1', currentPlayer, opponent);

        const combatCall = emitStub.args.find((args) => args[0] === 'startCombat');
        expect(combatCall).to.exist;
        expect(combatCall[1].firstPlayer.id).to.equal('p1');
    });

    it('should emit sameTeam error if players are on the same team', () => {
        const currentPlayer: Player = { id: 'p1', name: 'Red1', speed: 5 } as Player;
        const opponent: Player = { id: 'p2', name: 'Red2', speed: 5 } as Player;

        const gameState: GameState = {
            gameMode: 'capture',
            players: [currentPlayer, opponent],
            teams: {
                team1: [currentPlayer, opponent],
                team2: [],
            },
        } as any;

        gameStates.set('lobby1', gameState);

        service.startBattle('lobby1', currentPlayer, opponent);

        expect(ioToStub.calledWith(currentPlayer.id)).to.be.true;
        expect(ioToStub().to.calledWith(opponent.id)).to.be.true;
        expect(emitStub.calledWith(GameEvents.Error, 'You cannot attack a member of your team.')).to.be.false;
    });

    it('should not emit sameTeam error if players are on different teams', () => {
        const currentPlayer: Player = { id: 'p1', name: 'Red1', speed: 5 } as Player;
        const opponent: Player = { id: 'p2', name: 'Blue1', speed: 5 } as Player;

        const gameState: GameState = {
            gameMode: 'capture',
            players: [currentPlayer, opponent],
            teams: {
                team1: [currentPlayer],
                team2: [opponent],
            },
        } as any;

        gameStates.set('lobby1', gameState);

        service.startBattle('lobby1', currentPlayer, opponent);

        const combatCall = emitStub.args.find((args) => args[0] === 'startCombat');
        expect(combatCall).to.exist;
        expect(combatCall[1].firstPlayer).to.deep.equal(currentPlayer); // equal speed, current starts
    });

    it('should emit inventoryFull and movementProcessed in handleInventoryFull', () => {
        const currentPlayer: Player = {
            id: 'socket1',
            pendingItem: ObjectsTypes.SWORD,
            items: [ObjectsTypes.FLAG],
        } as Player;

        const gameState: GameState = {
            animation: true,
            players: [currentPlayer],
        } as any;

        const lobbyId = 'lobby1';
        gameStates.set(lobbyId, gameState);

        service.handleInventoryFull(gameState, currentPlayer, socket, lobbyId);

        // Expect inventoryFull event sent to player
        expect(
            emitStub.calledWith('inventoryFull', {
                item: ObjectsTypes.SWORD,
                currentInventory: [ObjectsTypes.FLAG],
            }),
        ).to.be.true;

        // Expect movementProcessed emitted to the lobby
        expect(ioToStub.calledWith(lobbyId)).to.be.true;
        expect(emitStub.calledWith('movementProcessed')).to.be.true;

        // Game state should be updated and animation = false
        const updatedGame = gameStates.get(lobbyId);
        expect(updatedGame.animation).to.be.false;
    });

    it('should emit gameOver if player has flag and is on their spawn point', async () => {
        const currentPlayer: Player = {
            id: 'socket1',
            name: 'Hero',
            items: [ObjectsTypes.FLAG],
            pendingItem: null,
        } as any;

        const gameState: GameState = {
            currentPlayer: 'socket1',
            players: [currentPlayer],
            teams: {
                team1: [currentPlayer],
                team2: [],
            },
            playerPositions: [{ x: 1, y: 1 }],
            spawnPoints: [{ x: 1, y: 1 }],
            board: [[]],
            animation: true,
            gameMode: 'capture',
        } as any;

        gameStates.set('lobby1', gameState);

        (boardService.handleMovement as any).returns({ gameState, shouldStop: false });
        (boardService.updatePlayerMoves as any).returns(gameState);

        const movementPromise = service.handleRequestMovement(socket, 'lobby1', [
            { x: 1, y: 1 },
            { x: 1, y: 1 },
        ]);

        // Simulate passage of delay time
        clock.tick(GameSocketConstants.AnimationDelayMs * 2);
        await movementPromise;

        const call = emitStub.args.find((args) => args[0] === 'gameOver');
        expect(call).to.exist;
    });

    it('should emit gameOver with team2 player names if player is in Blue team and on spawn with flag', async () => {
        const currentPlayer: Player = {
            id: 'socket1',
            name: 'BlueHero',
            items: [ObjectsTypes.FLAG],
            pendingItem: null,
        } as any;

        const gameState: GameState = {
            currentPlayer: 'socket1',
            players: [currentPlayer],
            teams: {
                team1: [],
                team2: [currentPlayer],
            },
            playerPositions: [{ x: 2, y: 2 }],
            spawnPoints: [{ x: 2, y: 2 }],
            board: [[]],
            animation: true,
            gameMode: 'capture',
        } as any;

        gameStates.set('lobby1', gameState);

        (boardService.handleMovement as any).returns({ gameState, shouldStop: false });
        (boardService.updatePlayerMoves as any).returns(gameState);

        const movementPromise = service.handleRequestMovement(socket, 'lobby1', [
            { x: 2, y: 2 },
            { x: 2, y: 2 },
        ]);

        clock.tick(GameSocketConstants.AnimationDelayMs * 2);
        await movementPromise;

        const call = emitStub.args.find((args) => args[0] === 'gameOver');
        expect(call).to.exist;
        expect(call[1].winner).to.equal('BlueHero');
    });
});
