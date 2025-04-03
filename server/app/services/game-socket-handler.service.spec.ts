/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
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

        expect(
            emitStub.calledWith('inventoryFull', {
                item: 1,
                currentInventory: [],
            }),
        ).to.equal(true);
    });

    it('should declare winner when flag is brought to spawn', async () => {
        const currentPlayer: Player = {
            id: 'socket1',
            items: [ObjectsTypes.FLAG],
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
            teams: {
                team1: [currentPlayer],
                team2: [],
            },
            playerPositions: [{ x: 0, y: 0 }],
            spawnPoints: [{ x: 0, y: 0 }],
            board: [[]],
            animation: true,
            gameMode: 'capture',
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleMovement as any).returns({ gameState, shouldStop: false });
        (boardService.updatePlayerMoves as any).returns(gameState);

        await service.handleRequestMovement(socket, 'lobby1', [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
        ]);

        expect(emitStub.calledWith('gameOver')).to.be.true;
        const gameOverCall = emitStub.args.find((args) => args[0] === 'gameOver');
        expect(gameOverCall).to.exist;
        expect(gameOverCall[1].winner).to.equal('Player1');
    });

    it('should not declare winner when no flag', async () => {
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
            teams: {
                team1: [currentPlayer],
                team2: [],
            },
            playerPositions: [{ x: 0, y: 0 }],
            spawnPoints: [{ x: 0, y: 0 }],
            board: [[]],
            animation: true,
            gameMode: 'capture',
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleMovement as any).returns({ gameState, shouldStop: false });
        (boardService.updatePlayerMoves as any).returns(gameState);

        await service.handleRequestMovement(socket, 'lobby1', [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
        ]);

        expect(emitStub.calledWith('gameOver')).to.be.false;
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
        const currentPlayer = {
            id: 'p1',
            amountEscape: 1,
            currentAP: 5,
            speed: 3,
        } as Player;
        const opponent = {
            id: 'p2',
            amountEscape: 1,
            currentAP: 5,
            speed: 2,
        } as Player;

        const gameState = {
            players: [currentPlayer, opponent],
            currentPlayerActionPoints: 5,
            currentPlayer: 'p1',
            teams: {
                team1: [currentPlayer],
                team2: [opponent],
            },
        } as GameState;

        gameStates.set('lobby1', gameState);

        service.startBattle('lobby1', currentPlayer, opponent);

        expect(gameState.currentPlayerActionPoints).to.equal(0);
        expect(currentPlayer.amountEscape).to.equal(0);
        expect(opponent.amountEscape).to.equal(0);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(
            emitStub.calledWith('startCombat', {
                firstPlayer: currentPlayer,
            }),
        ).to.equal(true);
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

        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('attackResult')).to.equal(true);
    });

    describe('Error handling', () => {
        it('should exit handleDefeat if player indices are not found', () => {
            const winner = { id: 'p1', maxLife: 10 } as Player;
            const loser = { id: 'p2', maxLife: 10 } as Player;
            const gameState: GameState = {
                players: [], // Empty players array will cause indices to be -1
            } as any;

            gameStates.set('lobby1', gameState);

            service.handleDefeat('lobby1', winner, loser);

            expect(ioToStub.called).to.equal(false);
        });

        it('should exit handleDefeat if gameState is not found', () => {
            const winner = { id: 'p1' } as Player;
            const loser = { id: 'p2' } as Player;

            service.handleDefeat('lobbyNonexistent', winner, loser);

            expect(ioToStub.called).to.equal(false);
        });

        it('should exit handleFlee if gameState is not found', () => {
            const player = { id: 'p1' } as Player;

            service.handleFlee('lobbyNonexistent', player);

            expect(ioToStub.called).to.equal(false);
        });

        it('should force successful flee in debug mode', () => {
            const player = { id: 'p1', amountEscape: 1 } as Player;
            const gameState = {
                players: [player],
                debug: true, // Enable debug mode
            } as GameState;

            gameStates.set('lobby1', gameState);

            sandbox.stub(Math, 'random').returns(0.99);

            service.handleFlee('lobby1', player);

            expect(ioToStub.calledWith('lobby1')).to.equal(true);
            expect(emitStub.calledWith(GameEvents.FleeSuccess)).to.equal(true);
        });

        it('should check if player is in spawn points correctly', () => {
            const winner = { id: 'p1', maxLife: 10, life: 5 } as Player;
            const loser = { id: 'p2', maxLife: 10, life: 0 } as Player;

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
                currentPlayer: 'p3',
            } as any;

            gameStates.set('lobby1', gameState);
            (boardService.handleTurn as any).returns(gameState);

            service.handleDefeat('lobby1', winner, loser);

            expect((pathfindingService.findClosestAvailableSpot as SinonStub).called).to.equal(false);
            expect(gameState.playerPositions[1]).to.deep.equal(gameState.spawnPoints[1]);
        });

        it('should handle error in startTurn', () => {
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

        it('should handle error in handleEndTurn', () => {
            const gameState: GameState = {
                currentPlayer: 'socket1',
            } as any;

            gameStates.set('lobby1', gameState);

            (boardService.handleEndTurn as any).throws(new Error('End turn error'));

            service.handleEndTurn(socket, 'lobby1');
            expect(emitStub.calledWith(GameEvents.Error, 'Failed to end turn: End turn error')).to.equal(true);
        });

        it('should handle error in handleTeleport', () => {
            const gameState: GameState = {
                board: [[TileTypes.Floor]],
                playerPositions: [{ x: 0, y: 0 }],
            } as any;

            gameStates.set('lobby1', gameState);

            (boardService.handleTeleport as SinonStub).throws(new Error('Teleport error'));

            service.handleTeleport(socket, 'lobby1', { x: 1, y: 1 });

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

        sandbox.stub(Math, 'random').returns(0.01);

        service.handleFlee('lobby1', player);

        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.FleeSuccess)).to.equal(true);
        expect(emitStub.calledWith(GameEvents.BoardModified)).to.equal(true);
        expect(player.amountEscape).to.equal(0);
    });

    it('should handle flee failure', () => {
        const player = { id: 'p1', amountEscape: 1 } as Player;
        const gameState = {
            players: [player],
            debug: false,
        } as GameState;

        gameStates.set('lobby1', gameState);

        sandbox.stub(Math, 'random').returns(0.9);

        service.handleFlee('lobby1', player);

        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith(GameEvents.FleeFailure)).to.equal(true);
        expect(player.amountEscape).to.equal(2);
    });

    it('should return correct dice values', () => {
        expect(service['getDiceValue']('D4')).to.equal(4);
        expect(service['getDiceValue']('D6')).to.equal(6);
        expect(service['getDiceValue']('invalid')).to.equal(0);
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
            currentPlayer: 'p2',
            currentPlayerActionPoints: 1,
        } as any;

        gameStates.set('lobby1', gameState);
        (boardService.handleEndTurn as any).returns(gameState);
        (boardService.handleTurn as any).returns(gameState);

        service.handleDefeat('lobby1', winner, loser);

        expect((boardService.handleEndTurn as SinonStub).calledWith(gameState)).to.equal(true);
    });

    it('should not proceed with handleAttackAction if gameState is not found', () => {
        const attacker = { id: 'p1' } as Player;
        const defender = { id: 'p2' } as Player;

        service.handleAttackAction('nonexistent', attacker, defender);

        expect(ioToStub.called).to.equal(false);
    });

    it('should not proceed with handleAttackAction if players are not found', () => {
        const attacker = { id: 'p1' } as Player;
        const defender = { id: 'p2' } as Player;
        const gameState: GameState = {
            players: [{ id: 'p3' } as Player],
            board: [[TileTypes.Floor]],
            playerPositions: [{ x: 0, y: 0 }],
        } as any;

        gameStates.set('lobby1', gameState);

        service.handleAttackAction('lobby1', attacker, defender);

        expect(ioToStub.called).to.equal(false);
    });

    it('should handle zero damage in attack calculations', () => {
        const attacker: Player = {
            id: 'p1',
            life: 10,
            attack: 1,
            bonus: { attack: 'D6', defense: 'D6' },
            defense: 0,
        } as Player;

        const defender: Player = {
            id: 'p2',
            life: 10,
            defense: 10,
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

        sandbox.stub(Math, 'random').returns(0);

        service.handleAttackAction('lobby1', attacker, defender);

        expect(defender.life).to.equal(10);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('attackResult')).to.equal(true);
        expect(emitStub.args.some((args) => args[0] === 'attackResult' && args[1].damage === 0)).to.equal(true);
    });

    it('should handle player defeat in handleAttackAction', () => {
        const attacker: Player = {
            id: 'p1',
            life: 10,
            attack: 20,
            winCount: 0,
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
            spawnPoints: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ],
            debug: false,
        } as any;

        gameStates.set('lobby1', gameState);

        const handleDefeatSpy = sandbox.spy(service, 'handleDefeat');

        sandbox.stub(Math, 'random').returns(0.99);

        service.handleAttackAction('lobby1', attacker, defender);

        expect(attacker.winCount).to.equal(1);
        expect(handleDefeatSpy.calledWith('lobby1', attacker, defender)).to.equal(true);
    });

    it('should declare game over when attacker reaches MAX_WIN_COUNT', () => {
        const attacker: Player = {
            id: 'p1',
            name: 'Winner',
            life: 10,
            attack: 20,
            winCount: 2,
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

        sandbox.stub(Math, 'random').returns(0.99);

        const handleDefeatSpy = sandbox.spy(service, 'handleDefeat');

        service.handleAttackAction('lobby1', attacker, defender);

        expect(attacker.winCount).to.equal(3);
        expect(ioToStub.calledWith('lobby1')).to.equal(true);
        expect(emitStub.calledWith('gameOver', { winner: 'Winner' })).to.equal(true);
        expect(handleDefeatSpy.called).to.equal(false);
    });

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

        sandbox.stub(Math, 'random').returns(0.5);

        service.createTeams('lobby1', players);

        const updatedGameState = gameStates.get('lobby1');
        expect(updatedGameState!.teams).to.exist;
        expect(updatedGameState!.teams!.team1).to.have.lengthOf(2);
        expect(updatedGameState!.teams!.team2).to.have.lengthOf(2);

        const allPlayers = [...updatedGameState!.teams!.team1, ...updatedGameState!.teams!.team2];
        expect(allPlayers.map((p) => p.id).sort()).to.deep.equal(players.map((p) => p.id).sort());
    });

    it('should emit inventoryFull event and update game state', () => {
        const currentPlayer = {
            id: 'socket1',
            pendingItem: 1,
            items: [],
        } as Player;

        const gameState: GameState = {
            animation: true,
            players: [currentPlayer],
        } as any;

        service.handleInventoryFull(gameState, currentPlayer, socket, 'lobby1');

        expect(
            emitStub.calledWith('inventoryFull', {
                item: 1,
                currentInventory: [],
            }),
        ).to.be.true;
        expect(gameState.animation).to.be.false;
        expect(gameStates.get('lobby1')).to.equal(gameState);
    });

    it('should delay for specified milliseconds', async () => {
        const delayTime = 100;
        let resolved = false;

        const delayPromise = service['delay'](delayTime).then(() => {
            resolved = true;
        });

        clock.tick(delayTime - 1);
        expect(resolved).to.be.false;

        clock.tick(1);
        await delayPromise;
        expect(resolved).to.be.true;
    });
});
