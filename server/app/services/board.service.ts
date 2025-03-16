import { GameState } from '@common/game-state';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { Game, ObjectsTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Service } from 'typedi';
import { GameService } from './game.service';
import { PathfindingService } from './pathfinding.service';

@Service()
export class BoardService {
    constructor(
        private gameService: GameService,
        private pathfindingService: PathfindingService,
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
            playerPositions: [],
            availableMoves: [],
            spawnPoints: [],
            board: gameData.board,
            currentPlayerMovementPoints: 0,
            combat: {
                playerId: '',
            },
        };

        this.sortPlayersBySpeed(gameState);

        await this.assignSpawnPoints(gameState);

        if (gameState.players.length > 0) {
            gameState.currentPlayer = gameState.players[0].id;
            gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(gameState.players[0]);
        }

        return gameState;
    }

    handleTurn(gameState: GameState): GameState {
        const playerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (playerIndex === -1) {
            gameState.availableMoves = [];
            return gameState;
        }

        const playerPosition = gameState.playerPositions.get(gameState.currentPlayer);
        if (!playerPosition) {
            gameState.availableMoves = [];
            return gameState;
        }

        const currentPlayer = gameState.players[playerIndex];
        gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(currentPlayer);

        const availableMoves = this.findAllPaths(gameState, playerPosition);

        gameState.availableMoves = availableMoves;

        return gameState;
    }

    findShortestPath(gameState: GameState, start: Coordinates, end: Coordinates): Coordinates[] | null {
        return this.pathfindingService.findShortestPath(gameState, start, end, gameState.currentPlayerMovementPoints);
    }

    handleMovement(gameState: GameState, targetCoordinate: Coordinates): GameState {
        const indexPlayer = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);

        if (indexPlayer === -1) {
            return gameState;
        }
        const playerPosition = gameState.playerPositions[indexPlayer];
        if (!playerPosition) {
            return gameState;
        }

        const isValidMove =
            gameState.availableMoves && gameState.availableMoves.some((move) => move.x === targetCoordinate.x && move.y === targetCoordinate.y);

        if (!isValidMove) {
            return gameState;
        }

        const path = this.pathfindingService.findShortestPath(gameState, playerPosition, targetCoordinate, gameState.currentPlayerMovementPoints);

        if (!path) {
            return gameState;
        }

        let movementCost = 0;
        for (let i = 1; i < path.length; i++) {
            const tileCost = this.pathfindingService.getMovementCost(gameState, path[i]);
            movementCost += tileCost;
        }

        gameState.playerPositions[indexPlayer] = targetCoordinate;

        gameState.currentPlayerMovementPoints -= movementCost;

        if (gameState.currentPlayerMovementPoints >= 0) {
            gameState.availableMoves = this.findAllPaths(gameState, targetCoordinate);
        } else {
            gameState.availableMoves = [];
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
        if (!gameState || !startPosition) {
            return [];
        }

        if (!gameState.currentPlayerMovementPoints || gameState.currentPlayerMovementPoints < 0) {
            return [];
        }

        try {
            const reachablePositions = this.pathfindingService.findReachablePositions(
                gameState,
                startPosition,
                gameState.currentPlayerMovementPoints,
            );

            return reachablePositions || [];
        } catch (error) {
            return [];
        }
    }

    private getPlayerMovementPoints(player: Player): number {
        const speedBonus = (player.speed || 0) + (player.bonus?.speed || 0);

        return speedBonus;
    }

    private async assignSpawnPoints(gameState: GameState): Promise<void> {
        const spawnPoints: Coordinates[] = [];
        const boardSize = gameState.board.length;

        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                if (Math.floor(gameState.board[x][y] / 10) === ObjectsTypes.SPAWN) {
                    spawnPoints.push({ x, y });
                }
            }
        }

        this.shuffleArray(spawnPoints);

        const assignedPoints = spawnPoints.slice(0, gameState.players.length);
        for (let i = 0; i < gameState.players.length; i++) {
            if (i < assignedPoints.length) {
                gameState.playerPositions.push(assignedPoints[i]);
                gameState.spawnPoints.push(assignedPoints[i]);
            }
        }

        if (spawnPoints.length > gameState.players.length) {
            for (let i = gameState.players.length; i < spawnPoints.length; i++) {
                const { x, y } = spawnPoints[i];
                gameState.board[x][y] = gameState.board[x][y] % 10;
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
