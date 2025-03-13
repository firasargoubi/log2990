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

        // Create an initial game state
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

        // Assign spawn points to players
        await this.assignSpawnPoints(gameState);

        // Sort players by speed
        this.sortPlayersBySpeed(gameState);

        // Set the first player as the current player
        if (gameState.players.length > 0) {
            gameState.currentPlayer = gameState.players[0].id;
            gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(gameState.players[0]);
        }

        return gameState;
    }

    handleTurn(gameState: GameState): GameState {
        const playerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (playerIndex === -1) return gameState;

        const playerPosition = gameState.playerPositions.get(gameState.currentPlayer);
        if (!playerPosition) return gameState;

        // Reset movement points for the current player
        const currentPlayer = gameState.players[playerIndex];
        gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(currentPlayer);

        // Find all reachable positions
        gameState.availableMoves = this.findAllPaths(gameState, playerPosition);

        return gameState;
    }

    public findShortestPath(gameState: GameState, start: Coordinates, end: Coordinates): Coordinates[] | null {
        return this.pathfindingService.findShortestPath(gameState, start, end, gameState.currentPlayerMovementPoints);
    }

    handleMovement(gameState: GameState, targetCoordinate: Coordinates): GameState {
        const playerPosition = gameState.playerPositions.get(gameState.currentPlayer);
        if (!playerPosition) return gameState;

        // Calculate the path and movement cost
        const path = this.pathfindingService.findShortestPath(gameState, playerPosition, targetCoordinate, gameState.currentPlayerMovementPoints);

        if (!path) {
            return gameState; // Invalid move
        }

        // Calculate total movement cost
        let movementCost = 0;
        for (let i = 1; i < path.length; i++) {
            // Skip the start position
            movementCost += this.pathfindingService.getMovementCost(gameState, path[i]);
        }

        // Update the player's position
        gameState.playerPositions.set(gameState.currentPlayer, targetCoordinate);

        // Reduce remaining movement points
        gameState.currentPlayerMovementPoints -= movementCost;

        // Find new available moves with remaining points
        if (gameState.currentPlayerMovementPoints > 0) {
            gameState.availableMoves = this.findAllPaths(gameState, targetCoordinate);
        } else {
            gameState.availableMoves = [];
        }

        return gameState;
    }

    handleEndTurn(gameState: GameState): GameState {
        if (gameState.players.length === 0) return gameState;

        gameState.turnCounter++;

        // Find the current player index
        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (currentPlayerIndex === -1) return gameState;

        // Calculate the next player index using modulo to wrap around
        const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;

        // Set the next player as current
        gameState.currentPlayer = gameState.players[nextPlayerIndex].id;

        // Reset movement points for the next player
        gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(gameState.players[nextPlayerIndex]);

        // Calculate available moves for the new current player
        return this.handleTurn(gameState);
    }

    private findAllPaths(gameState: GameState, startPosition: Coordinates): Coordinates[] {
        // Use the pathfinding service to find all reachable positions within movement points
        return this.pathfindingService.findReachablePositions(gameState, startPosition, gameState.currentPlayerMovementPoints);
    }

    private getPlayerMovementPoints(player: Player): number {
        // Base movement points plus any bonuses from speed
        const baseMovementPoints = 3; // Default value
        const speedBonus = (player.speed || 0) + (player.bonus?.speed || 0);
        return baseMovementPoints + speedBonus;
    }

    private async assignSpawnPoints(gameState: GameState): Promise<void> {
        // Find all spawn points on the board (Value = SPAWN * 10 + tileType)
        const spawnPoints: Coordinates[] = [];
        const boardSize = gameState.gameBoard.length;

        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                // Check if this is a spawn point (object type 6 as per your constants)
                if (Math.floor(gameState.gameBoard[x][y] / 10) === ObjectsTypes.SPAWN) {
                    spawnPoints.push({ x, y });
                }
            }
        }

        // Shuffle spawn points for random assignment
        this.shuffleArray(spawnPoints);

        // Assign spawn points to players
        const assignedPoints = spawnPoints.slice(0, gameState.players.length);
        for (let i = 0; i < gameState.players.length; i++) {
            if (i < assignedPoints.length) {
                gameState.playerPositions.set(gameState.players[i].id, assignedPoints[i]);
            }
        }

        // Remove unused spawn points from the board
        if (spawnPoints.length > gameState.players.length) {
            for (let i = gameState.players.length; i < spawnPoints.length; i++) {
                const { x, y } = spawnPoints[i];
                // Keep the tile type (modulo 10) but remove the object
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
        // Sort players by speed (base + bonus) in descending order
        gameState.players.sort((a, b) => {
            const speedA = a.speed + (a.bonus?.speed || 0);
            const speedB = b.speed + (b.bonus?.speed || 0);
            return speedB - speedA; // Descending order (fastest first)
        });
    }
}
