import { BoardSocketConstants, ERROR_MESSAGES } from '@app/constants/board-const';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game, ObjectsTypes, TILE_DELIMITER, TileTypes } from '@common/game.interface';
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
                throw new Error(`${ERROR_MESSAGES.gameNotFound}`);
            }
            return game;
        } catch (error) {
            throw new Error(`${ERROR_MESSAGES.fetchGameErrorPrefix} ${error.message}`);
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
            shortestMoves: [],
            spawnPoints: [],
            board: gameData.board,
            currentPlayerMovementPoints: BoardSocketConstants.DefaultMovementPoints,
            currentPlayerActionPoints: BoardSocketConstants.DefaultActionPoints,
            debug: false,
        };

        this.sortPlayersBySpeed(gameState);
        await this.assignSpawnPoints(gameState);

        if (gameState.players.length > 0) {
            gameState.players[0].currentMP = this.getPlayerMovementPoints(gameState.players[0]);
            gameState.players[0].currentAP = BoardSocketConstants.DefaultActionPoints;
            gameState.currentPlayer = gameState.players[0].id;
            gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(gameState.players[0]);
        }

        return gameState;
    }

    handleTurn(gameState: GameState): GameState {
        const playerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (playerIndex === -1) return gameState;
        return this.updatePlayerMoves(gameState, playerIndex);
    }

    handleBoardChange(gameState: GameState): GameState {
        const playerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (playerIndex === -1) return gameState;
        return this.updatePlayerMoves(gameState, playerIndex);
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

        if (!path || path.length < 2) {
            return gameState;
        }

        let movementCost = 0;
        for (let i = 1; i < path.length; i++) {
            const tileCost = this.pathfindingService.getMovementCost(gameState, path[i]);
            movementCost += tileCost;
        }
        gameState.playerPositions[indexPlayer] = targetCoordinate;

        const tileValue = gameState.board[targetCoordinate.x][targetCoordinate.y];
        const item = Math.floor(tileValue / TILE_DELIMITER);
        const tile = tileValue % TILE_DELIMITER;
        if (item !== ObjectsTypes.EMPTY && item !== ObjectsTypes.SPAWN) {
            gameState.players[indexPlayer].items ??= [];
            gameState.players[indexPlayer].items.push(item);
            gameState.board[targetCoordinate.x][targetCoordinate.y] = tile;
            gameState.availableMoves = [];
            gameState.shortestMoves = [];

            return gameState;
        }

        gameState.currentPlayerMovementPoints -= movementCost;
        gameState.players[indexPlayer].currentMP = gameState.currentPlayerMovementPoints;

        if (gameState.currentPlayerMovementPoints >= 0) {
            gameState.availableMoves = this.findAllPaths(gameState, targetCoordinate);
            gameState.shortestMoves = this.calculateShortestMoves(gameState, targetCoordinate, gameState.availableMoves);
        } else {
            gameState.availableMoves = [];
            gameState.shortestMoves = [];
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

        gameState.players[currentPlayerIndex].currentMP = gameState.currentPlayerMovementPoints;

        gameState.currentPlayerActionPoints = 1;

        gameState.players[currentPlayerIndex].currentAP = gameState.currentPlayerActionPoints;

        return this.handleTurn(gameState);
    }

    handleTeleport(gameState: GameState, targetCoordinate: Coordinates): GameState {
        const indexPlayer = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);

        if (indexPlayer === -1) {
            return gameState;
        }
        const playerPosition = gameState.playerPositions[indexPlayer];
        if (!playerPosition) {
            return gameState;
        }

        if (this.isOccupied(gameState, targetCoordinate, indexPlayer)) {
            return gameState;
        }

        gameState.playerPositions[indexPlayer] = targetCoordinate;

        if (gameState.currentPlayerMovementPoints >= 0) {
            gameState.availableMoves = this.findAllPaths(gameState, targetCoordinate);
            gameState.shortestMoves = this.calculateShortestMoves(gameState, targetCoordinate, gameState.availableMoves);
        } else {
            gameState.availableMoves = [];
            gameState.shortestMoves = [];
        }

        return gameState;
    }

    private updatePlayerMoves(gameState: GameState, playerIndex: number): GameState {
        const playerPosition = gameState.playerPositions[playerIndex];
        gameState.availableMoves = [];
        gameState.shortestMoves = [];

        if (!playerPosition) {
            return gameState;
        }

        const currentPlayer = gameState.players[playerIndex];
        gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(currentPlayer);

        const availableMoves = this.findAllPaths(gameState, playerPosition);
        gameState.availableMoves = availableMoves;
        gameState.shortestMoves = this.calculateShortestMoves(gameState, playerPosition, availableMoves);

        return gameState;
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
        return player.speed || 0;
    }

    private async assignSpawnPoints(gameState: GameState): Promise<void> {
        const spawnPoints: Coordinates[] = [];
        const boardSize = gameState.board.length;

        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                if (Math.floor(gameState.board[x][y] / BoardSocketConstants.TileDivisor) === ObjectsTypes.SPAWN) {
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
                gameState.board[x][y] = gameState.board[x][y] % BoardSocketConstants.TileDivisor;
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

    private calculateShortestMoves(gameState: GameState, playerPosition: Coordinates, availableMoves: Coordinates[]): Coordinates[][] {
        const shortestMoves: Coordinates[][] = [];
        for (const move of availableMoves) {
            const path = this.pathfindingService.findShortestPath(gameState, playerPosition, move, gameState.currentPlayerMovementPoints);
            if (path && path.length > 0) {
                shortestMoves.push(path);
            }
        }
        return shortestMoves;
    }

    private isOccupied(gameState: GameState, position: Coordinates, index: number): boolean {
        for (const [playerIndex, playerPosition] of gameState.playerPositions.entries()) {
            if (playerIndex === index) {
                continue;
            }
            if (playerPosition.x === position.x && playerPosition.y === position.y) {
                return true;
            }
        }
        const item = Math.floor(gameState.board[position.x][position.y] / TILE_DELIMITER);
        const tile = gameState.board[position.x][position.y] % TILE_DELIMITER;
        if (item !== ObjectsTypes.SPAWN && item !== ObjectsTypes.EMPTY) {
            return true;
        }
        if (tile === TileTypes.Wall || tile === TileTypes.DoorClosed) {
            return true;
        }

        return false;
    }
}
