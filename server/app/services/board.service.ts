import { GameLobby } from '@common/game-lobby';
import { GameState } from '@app/interface/game-state';
import { Player } from '@common/player';
import { Coordinates } from '@common/coordinates';
import { GameService } from './game.service';
import { Service, Inject } from 'typedi';
import { Game, ObjectsTypes } from '@common/game.interface';
import { PathfindingService } from './pathfinding.service';

@Service()
export class BoardService {
    constructor(
        @Inject() private gameService: GameService,
        @Inject() private pathfindingService: PathfindingService,
    ) {}

    async getGameFromId(gameId: string): Promise<Game> {
        try {
            const game = await this.gameService.getGameById(gameId);
            if (!game) {
                throw new Error('Game not found');
            }
            return game;
        } catch (error) {
            throw new Error(`Error fetching game: ${error.message}`);
        }
    }

    async initializeGameState(lobby: GameLobby): Promise<GameState> {
        const gameData = await this.getGameFromId(lobby.gameId);

        const gameState: GameState = {
            id: lobby.id,
            players: [...lobby.players],
            currentPlayer: '',
            turnCounter: 0,
            playerPositions: new Map<string, Coordinates>(),
            availableMoves: [],
            board: gameData.board,
            gameBoard: gameData.board,
            currentPlayerMovementPoints: 0,
        };

        await this.assignSpawnPoints(gameState);

        this.sortPlayersBySpeed(gameState);

        if (gameState.players.length > 0) {
            gameState.currentPlayer = gameState.players[0].id;
            gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(gameState.players[0]);
        }

        return gameState;
    }

    handleTurn(gameState: GameState): GameState {
        console.log(`Handling turn for player ${gameState.currentPlayer}`);

        const playerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (playerIndex === -1) {
            console.error(`Current player ${gameState.currentPlayer} not found in players list`);
            gameState.availableMoves = [];
            return gameState;
        }

        const playerPosition = gameState.playerPositions.get(gameState.currentPlayer);
        if (!playerPosition) {
            console.error(`Position for current player ${gameState.currentPlayer} not found`);
            gameState.availableMoves = [];
            return gameState;
        }

        console.log(`Player ${gameState.currentPlayer} is at position (${playerPosition.x}, ${playerPosition.y})`);

        const currentPlayer = gameState.players[playerIndex];
        gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(currentPlayer);

        console.log(`Player ${gameState.currentPlayer} has ${gameState.currentPlayerMovementPoints} movement points`);

        const availableMoves = this.findAllPaths(gameState, playerPosition);

        gameState.availableMoves = availableMoves;

        console.log(`Calculated ${gameState.availableMoves.length} available moves for player ${gameState.currentPlayer}`);
        console.log(`Available moves: ${JSON.stringify(gameState.availableMoves)}`);

        return gameState;
    }

    findShortestPath(gameState: GameState, start: Coordinates, end: Coordinates): Coordinates[] | null {
        return this.pathfindingService.findShortestPath(gameState, start, end, gameState.currentPlayerMovementPoints);
    }

    handleMovement(gameState: GameState, targetCoordinate: Coordinates): GameState {
        console.log(`Handling movement to (${targetCoordinate.x}, ${targetCoordinate.y})`);

        const playerPosition = gameState.playerPositions.get(gameState.currentPlayer);
        if (!playerPosition) {
            console.error(`Player position not found for ${gameState.currentPlayer}`);
            return gameState;
        }

        console.log(`Player ${gameState.currentPlayer} current position: (${playerPosition.x}, ${playerPosition.y})`);

        const isValidMove =
            gameState.availableMoves && gameState.availableMoves.some((move) => move.x === targetCoordinate.x && move.y === targetCoordinate.y);

        if (!isValidMove) {
            console.error(`Invalid move to (${targetCoordinate.x}, ${targetCoordinate.y}). Not in available moves.`);
            return gameState;
        }

        const path = this.pathfindingService.findShortestPath(gameState, playerPosition, targetCoordinate, gameState.currentPlayerMovementPoints);

        if (!path) {
            console.error(`No valid path found to (${targetCoordinate.x}, ${targetCoordinate.y})`);
            return gameState;
        }

        console.log(`Path found with ${path.length} steps`);

        let movementCost = 0;
        for (let i = 1; i < path.length; i++) {
            const tileCost = this.pathfindingService.getMovementCost(gameState, path[i]);
            movementCost += tileCost;
            console.log(`Step ${i} to (${path[i].x}, ${path[i].y}) costs ${tileCost}, total cost: ${movementCost}`);
        }

        gameState.playerPositions.set(gameState.currentPlayer, targetCoordinate);
        console.log(`Updated player ${gameState.currentPlayer} position to (${targetCoordinate.x}, ${targetCoordinate.y})`);

        gameState.currentPlayerMovementPoints -= movementCost;
        console.log(`Player has ${gameState.currentPlayerMovementPoints} movement points remaining`);

        if (gameState.currentPlayerMovementPoints > 0) {
            gameState.availableMoves = this.findAllPaths(gameState, targetCoordinate);
            console.log(`Player can still move. Found ${gameState.availableMoves.length} new available moves`);
        } else {
            gameState.availableMoves = [];
            console.log(`Player has no movement points left. No more moves available.`);
        }

        return gameState;
    }

    handleEndTurn(gameState: GameState): GameState {
        if (gameState.players.length === 0) return gameState;

        gameState.turnCounter++;

        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (currentPlayerIndex === -1) return gameState;

        const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;

        gameState.currentPlayer = gameState.players[nextPlayerIndex].id;

        gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(gameState.players[nextPlayerIndex]);

        return this.handleTurn(gameState);
    }

    private findAllPaths(gameState: GameState, startPosition: Coordinates): Coordinates[] {
        console.log(`Finding all paths from position (${startPosition.x}, ${startPosition.y})`);

        if (!gameState || !startPosition) {
            console.error('Invalid gameState or startPosition in findAllPaths');
            return [];
        }

        if (!gameState.currentPlayerMovementPoints || gameState.currentPlayerMovementPoints <= 0) {
            console.warn(`Player has no movement points (${gameState.currentPlayerMovementPoints}), returning empty array`);
            return [];
        }

        try {
            const reachablePositions = this.pathfindingService.findReachablePositions(
                gameState,
                startPosition,
                gameState.currentPlayerMovementPoints,
            );

            console.log(`Found ${reachablePositions.length} reachable positions`);
            return reachablePositions || [];
        } catch (error) {
            console.error('Error in findAllPaths:', error);
            return [];
        }
    }

    private getPlayerMovementPoints(player: Player): number {
        const speedBonus = (player.speed || 0) + (player.bonus?.speed || 0);

        console.log(`Player ${player.name} movement points: speedBonus(${speedBonus})`);

        return Math.max(1, speedBonus);
    }

    private async assignSpawnPoints(gameState: GameState): Promise<void> {
        const spawnPoints: Coordinates[] = [];
        const boardSize = gameState.gameBoard.length;

        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                if (Math.floor(gameState.gameBoard[x][y] / 10) === ObjectsTypes.SPAWN) {
                    spawnPoints.push({ x, y });
                }
            }
        }

        this.shuffleArray(spawnPoints);

        const assignedPoints = spawnPoints.slice(0, gameState.players.length);
        for (let i = 0; i < gameState.players.length; i++) {
            if (i < assignedPoints.length) {
                gameState.playerPositions.set(gameState.players[i].id, assignedPoints[i]);
            }
        }

        if (spawnPoints.length > gameState.players.length) {
            for (let i = gameState.players.length; i < spawnPoints.length; i++) {
                const { x, y } = spawnPoints[i];
                gameState.gameBoard[x][y] = gameState.gameBoard[x][y] % 10;
            }
        }
    }

    private shuffleArray(array: Coordinates[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private sortPlayersBySpeed(gameState: GameState): void {
        gameState.players.sort((a, b) => {
            const speedA = a.speed + (a.bonus?.speed || 0);
            const speedB = b.speed + (b.bonus?.speed || 0);
            return speedB - speedA;
        });
    }
}
