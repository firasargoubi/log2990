import { BoardSocketConstants, ERROR_MESSAGES } from '@app/constants/board-const';
import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Game, ITEM_EFFECTS, ObjectsTypes, RANDOM_SPEED, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Service } from 'typedi';
import { GameService } from './game.service';
import { ItemService } from './item.service';
import { PathfindingService } from './pathfinding.service';

@Service()
export class BoardService {
    constructor(
        private gameService: GameService,
        private pathfindingService: PathfindingService,
        private itemService: ItemService,
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
            gameMode: gameData.mode,
        };

        this.randomizeItem(gameState);
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
        return this.updatePlayerMoves(gameState);
    }

    handleBoardChange(gameState: GameState): GameState {
        const playerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (playerIndex === -1) return gameState;
        return this.updatePlayerMoves(gameState);
    }

    findShortestPath(gameState: GameState, start: Coordinates, end: Coordinates): Coordinates[] | null {
        return this.pathfindingService.findShortestPath(gameState, start, end, gameState.currentPlayerMovementPoints);
    }

    handleMovement(gameState: GameState, targetCoordinate: Coordinates): { gameState: GameState; shouldStop: boolean } {
        const indexPlayer = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (indexPlayer === -1) return { gameState, shouldStop: false };
        const playerPosition = gameState.playerPositions[indexPlayer];
        if (!playerPosition) return { gameState, shouldStop: false };

        gameState.playerPositions[indexPlayer] = targetCoordinate;

        gameState.currentPlayerMovementPoints -= this.pathfindingService.getMovementCost(gameState, targetCoordinate);

        gameState.players[indexPlayer].currentMP = gameState.currentPlayerMovementPoints;

        const player = gameState.players[indexPlayer];

        const tileValue = gameState.board[targetCoordinate.x][targetCoordinate.y];
        const item = Math.floor(tileValue / TILE_DELIMITER);
        const tile = tileValue % TILE_DELIMITER;

        if (item !== ObjectsTypes.EMPTY && item !== ObjectsTypes.SPAWN) {
            player.items ??= [];
            if (player.items.length >= 2) {
                player.pendingItem = item;
            } else {
                player.items.push(item);
                gameState.board[targetCoordinate.x][targetCoordinate.y] = tile;
            }
            if (ITEM_EFFECTS[item as ObjectsTypes]) {
                this.itemService.applyAttributeEffects(player, item);
            }
            return { gameState, shouldStop: true };
        }

        return { gameState, shouldStop: false };
    }

    handleEndTurn(gameState: GameState): GameState {
        if (gameState.players.length === 0) return gameState;

        gameState.turnCounter++;

        const currentPlayerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (currentPlayerIndex === -1) return gameState;

        gameState.players[currentPlayerIndex].currentMP = this.getPlayerMovementPoints(gameState.players[currentPlayerIndex]);

        const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;

        gameState.currentPlayer = gameState.players[nextPlayerIndex].id;

        const hasOrb = this.verifyOrb(gameState);

        gameState.currentPlayerMovementPoints = this.getPlayerMovementPoints(gameState.players[nextPlayerIndex], hasOrb);

        gameState.players[currentPlayerIndex].currentMP = gameState.currentPlayerMovementPoints;

        gameState.currentPlayerActionPoints = 1;

        gameState.players[currentPlayerIndex].currentAP = gameState.currentPlayerActionPoints;

        return gameState;
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

    updatePlayerMoves(gameState: GameState): GameState {
        const playerIndex = gameState.players.findIndex((p) => p.id === gameState.currentPlayer);
        if (playerIndex === -1) {
            return gameState;
        }
        const playerPosition = gameState.playerPositions[playerIndex];
        gameState.availableMoves = [];
        gameState.shortestMoves = [];

        if (!playerPosition) {
            return gameState;
        }

        const availableMoves = this.findAllPaths(gameState, playerPosition);
        gameState.availableMoves = availableMoves;
        gameState.shortestMoves = this.calculateShortestMoves(gameState, playerPosition, availableMoves);

        return gameState;
    }

    findAllPaths(gameState: GameState, startPosition: Coordinates): Coordinates[] {
        if (!gameState || !startPosition) {
            return [];
        }

        if (gameState.currentPlayerMovementPoints < 0) {
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

    calculateShortestMoves(gameState: GameState, playerPosition: Coordinates, availableMoves: Coordinates[]): Coordinates[][] {
        const shortestMoves: Coordinates[][] = [];
        for (const move of availableMoves) {
            const path = this.pathfindingService.findShortestPath(gameState, playerPosition, move, gameState.currentPlayerMovementPoints);
            if (path && path.length > 0) {
                shortestMoves.push(path);
            }
        }
        return shortestMoves;
    }

    private getPlayerMovementPoints(player: Player, hasOrb: boolean = false): number {
        if (hasOrb) {
            return Math.floor(Math.random() * RANDOM_SPEED) + 1;
        }
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

    private randomizeItem(gameState: GameState): void {
        const randomObjects: { x: number; y: number }[] = [];
        let objectsTypes = [ObjectsTypes.BOOTS, ObjectsTypes.SWORD, ObjectsTypes.POTION, ObjectsTypes.WAND, ObjectsTypes.JUICE, ObjectsTypes.CRYSTAL];

        gameState.board.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const objectValue = Math.floor(tile / TILE_DELIMITER);
                if (objectsTypes.includes(objectValue)) {
                    objectsTypes = objectsTypes.filter((obj) => obj !== objectValue);
                }
                if (objectValue === ObjectsTypes.RANDOM) {
                    randomObjects.push({ x: rowIndex, y: colIndex });
                }
            });
        });

        randomObjects.forEach((tile) => {
            const randomIndex = Math.floor(Math.random() * objectsTypes.length);
            const tileType = gameState.board[tile.x][tile.y] % TILE_DELIMITER;
            gameState.board[tile.x][tile.y] = objectsTypes[randomIndex] * TILE_DELIMITER + tileType;
        });
    }

    private verifyOrb(gameState: GameState): boolean {
        for (const player of gameState.players) {
            if (!player.items) continue;
            for (const item of player.items) {
                if (item === ObjectsTypes.CRYSTAL) {
                    if (player.id === gameState.currentPlayer) {
                        return false;
                    }
                    return true;
                }
            }
        }
        return false;
    }
}
