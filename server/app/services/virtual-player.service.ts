import { VirtualMovementConfig } from '@app/interfaces/virtual-player.interface';
import { MovementStrategy } from '@app/services/virtual-player/interfaces/movement-strategy';
import { AggressiveMovementStrategy } from '@app/services/virtual-player/strategies/aggressive-movement-strategy';
import { DefaultMovementStrategy } from '@app/services/virtual-player/strategies/default-movement-strategy';
import { DefensiveMovementStrategy } from '@app/services/virtual-player/strategies/defensive-movement-strategy';
import { Coordinates } from '@common/coordinates';
import { GameState } from '@common/game-state';
import { ObjectsTypes, Tile, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Socket } from 'socket.io';
import { Service } from 'typedi';

const MIN_TURN_DELAY_MS = 1000;
const TURN_DELAY_MS = 2000;
const DOOR_ACTION_DELAY_MS = 500;
const ADJACENT_DISTANCE_THRESHOLD = 1.5;

@Service()
export class VirtualPlayerService {
    private aggressiveMovementStrategy: MovementStrategy = new AggressiveMovementStrategy(this);
    private defaultMovementStrategy: MovementStrategy = new DefaultMovementStrategy(this);
    private defensiveMovementStrategy: MovementStrategy = new DefensiveMovementStrategy(this);

    async handleVirtualMovement(config: VirtualMovementConfig): Promise<void> {
        const preparationResult = await this.prepareTurn(config);
        if (!preparationResult) {
            config.callbacks.handleEndTurn({ id: config.virtualPlayer.id } as Socket, config.lobbyId);
            return;
        }
        const { currentGameState, playerIndex } = preparationResult;
        config = { ...config, gameState: currentGameState };
        const planningResult = this.planMovement(config, playerIndex);
        if (!planningResult) {
            config.callbacks.handleEndTurn({ id: config.virtualPlayer.id } as Socket, config.lobbyId);
            return;
        }
        const { target } = planningResult;

        await this.executeMovementSequence(config, target, playerIndex);

        await this.completeTurn(config, playerIndex);
    }
    async performTurn(actionCallback: () => void): Promise<void> {
        const delay = MIN_TURN_DELAY_MS + Math.random() * TURN_DELAY_MS;
        return new Promise((resolve) => {
            setTimeout(() => {
                actionCallback();
                resolve();
            }, delay);
        });
    }

    getNearestOpponent(gameState: GameState, virtualPlayer: Player, currentPos: Coordinates): { player: Player; pos: Coordinates } | null {
        const opponents = gameState.players
            .map((p, idx) => ({ player: p, pos: gameState.playerPositions[idx] }))
            .filter((item) => item.player.id !== virtualPlayer.id && this.isOpponent(virtualPlayer, item.player, gameState));
        if (!opponents.length) return null;
        const nearestByDistance = opponents.reduce((prev, curr) =>
            this.distance(curr.pos, currentPos) < this.distance(prev.pos, currentPos) ? curr : prev,
        );

        const adjacents = this.getAdjacentPositions(nearestByDistance.pos, gameState.board);
        if (adjacents.length === 0) return nearestByDistance;

        const closestAdjacent = adjacents.reduce((prev, curr) => (this.distance(curr, currentPos) < this.distance(prev, currentPos) ? curr : prev));

        if (this.distance(closestAdjacent, currentPos) < this.distance(nearestByDistance.pos, currentPos)) {
            return { player: nearestByDistance.player, pos: closestAdjacent };
        }

        return nearestByDistance;
    }

    getClosest(target: Coordinates, positions: Coordinates[]): Coordinates {
        if (!positions || positions.length === 0) {
            throw new Error('Cannot find closest position from an empty list.');
        }
        return positions.reduce((prev, curr) => (this.distance(curr, target) < this.distance(prev, target) ? curr : prev));
    }

    findNearestItemTile(gameState: GameState, currentPos: Coordinates, itemTypes: ObjectsTypes[]): Coordinates | null {
        let nearestItemPos: Coordinates | null = null;
        let minDistance = Infinity;

        for (let x = 0; x < gameState.board.length; x++) {
            for (let y = 0; y < gameState.board[x].length; y++) {
                const tileValue = gameState.board[x][y];
                const itemOnTile = Math.floor(tileValue / TILE_DELIMITER);

                if (itemTypes.includes(itemOnTile)) {
                    const itemPos = { x, y };
                    const dist = this.distance(currentPos, itemPos);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestItemPos = itemPos;
                    }
                }
            }
        }
        return nearestItemPos;
    }

    getAdjacentPositions(pos: Coordinates, board: number[][]): Coordinates[] {
        const adjacent: Coordinates[] = [];
        const directions = [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
        ];
        const rows = board.length;
        const cols = board[0].length;
        directions.forEach((d) => {
            const newX = pos.x + d.x;
            const newY = pos.y + d.y;
            if (newX >= 0 && newY >= 0 && newX < rows && newY < cols) {
                adjacent.push({ x: newX, y: newY });
            }
        });
        return adjacent;
    }

    distance(a: Coordinates, b: Coordinates): number {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    findFlagPosition(gameState: GameState): Coordinates | null {
        if (gameState.gameMode !== 'capture') return null;
        for (let x = 0; x < gameState.board.length; x++) {
            for (let y = 0; y < gameState.board[x].length; y++) {
                const tileValue = gameState.board[x][y];
                const objectType = Math.floor(tileValue / TILE_DELIMITER);
                if (objectType === ObjectsTypes.FLAG) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    findFlagCarrier(gameState: GameState): Player | null {
        if (gameState.gameMode !== 'capture') return null;
        for (const player of gameState.players) {
            if (player.items?.includes(ObjectsTypes.FLAG)) {
                return player;
            }
        }
        return null;
    }

    isTeammate(player1: Player, player2: Player, gameState: GameState): boolean {
        if (gameState.gameMode !== 'capture' || !gameState.teams) return false;
        const team1Ids = new Set(gameState.teams.team1.map((p) => p.id));
        const team2Ids = new Set(gameState.teams.team2.map((p) => p.id));
        return (team1Ids.has(player1.id) && team1Ids.has(player2.id)) || (team2Ids.has(player1.id) && team2Ids.has(player2.id));
    }

    isOpponent(player1: Player, player2: Player, gameState: GameState): boolean {
        if (gameState.gameMode !== 'capture' || !gameState.teams) {
            return player1.id !== player2.id;
        }
        const team1Ids = new Set(gameState.teams.team1.map((p) => p.id));
        const team2Ids = new Set(gameState.teams.team2.map((p) => p.id));
        return (team1Ids.has(player1.id) && team2Ids.has(player2.id)) || (team2Ids.has(player1.id) && team1Ids.has(player2.id));
    }

    getOpponentsNearTarget(
        gameState: GameState,
        perspectivePlayer: Player,
        targetPos: Coordinates,
        maxDistance: number,
    ): { player: Player; pos: Coordinates }[] {
        const nearbyOpponents: { player: Player; pos: Coordinates }[] = [];
        gameState.players.forEach((player, index) => {
            if (player.id === perspectivePlayer.id) return;

            const playerPos = gameState.playerPositions[index];
            if (playerPos && this.isOpponent(perspectivePlayer, player, gameState) && this.distance(playerPos, targetPos) <= maxDistance) {
                nearbyOpponents.push({ player, pos: playerPos });
            }
        });
        return nearbyOpponents;
    }

    private async prepareTurn(config: VirtualMovementConfig): Promise<{ currentGameState: GameState; playerIndex: number } | null> {
        let currentGameState = config.getGameState();
        if (!currentGameState) return null;

        const playerIndex = currentGameState.players.findIndex((p) => p.id === config.virtualPlayer.id);
        if (playerIndex === -1) return null;

        const currentPos = currentGameState.playerPositions[playerIndex];
        const currentPlayer = currentGameState.players[playerIndex];

        if (currentPlayer.currentAP > 0) {
            currentGameState = await this.checkAndHandleAdjacentDoors(config, currentPos, currentGameState);
            const refreshedPlayerIndex = currentGameState.players.findIndex((p) => p.id === config.virtualPlayer.id);
            if (refreshedPlayerIndex === -1) return null;
            return { currentGameState, playerIndex: refreshedPlayerIndex };
        }

        return { currentGameState, playerIndex };
    }

    private planMovement(config: VirtualMovementConfig, playerIndex: number): { target: Coordinates } | null {
        const { boardService, virtualPlayer, gameState } = config;
        const currentPos = gameState.playerPositions[playerIndex];

        let availableMoves = boardService.findAllPaths(gameState, currentPos);
        if (!availableMoves || availableMoves.length === 0) {
            return null;
        }

        const inventoryFull = virtualPlayer.items?.length >= 2;
        if (inventoryFull) {
            availableMoves = availableMoves.filter((move) => {
                const tileValue = gameState.board[move.x]?.[move.y];
                if (tileValue === undefined) return false;
                const itemOnTile = Math.floor(tileValue / TILE_DELIMITER);
                return itemOnTile === ObjectsTypes.EMPTY || itemOnTile === ObjectsTypes.SPAWN;
            });

            if (availableMoves.length === 0) {
                return null;
            }
        }

        const movementStrategy = this.getMovementStrategy(virtualPlayer);
        const target = movementStrategy.determineTarget(config, availableMoves, playerIndex);
        return { target };
    }

    private async executeMovementSequence(config: VirtualMovementConfig, target: Coordinates, playerIndex: number): Promise<void> {
        const { boardService, gameState } = config;
        const currentPos = gameState.playerPositions[playerIndex];

        let path = boardService.findShortestPath(gameState, currentPos, target);

        if (!path || path.length <= 1) {
            const availableMoves = boardService.findAllPaths(gameState, currentPos);
            if (availableMoves.length > 0) {
                const fallbackTarget = this.getClosest(target, availableMoves);
                path = boardService.findShortestPath(gameState, currentPos, fallbackTarget);
            }
        }

        if (!path || path.length <= 1) {
            return;
        }

        await this.followPath(path, config);
    }

    private async completeTurn(config: VirtualMovementConfig, playerIndex: number): Promise<void> {
        const finalState = config.getGameState();
        if (!finalState) {
            config.callbacks.handleEndTurn({ id: config.virtualPlayer.id } as Socket, config.lobbyId);
            return;
        }
        await this.handlePostMovement({ ...config, gameState: finalState }, playerIndex);
    }

    private async handlePostMovement(config: VirtualMovementConfig, playerIndex: number): Promise<void> {
        const { gameState, virtualPlayer, callbacks, lobbyId, boardService } = config;

        const finalPos = gameState.playerPositions[playerIndex];

        if (finalPos) {
            const opponents = gameState.players
                .map((p, idx) => ({ player: p, pos: gameState.playerPositions[idx] }))
                .filter((item) => item.player.id !== virtualPlayer.id);
            const adjacentPlayer = opponents.find((item) => this.distance(finalPos, item.pos) <= ADJACENT_DISTANCE_THRESHOLD);

            if (adjacentPlayer && this.isOpponent(virtualPlayer, adjacentPlayer.player, gameState)) {
                callbacks.startBattle(lobbyId, virtualPlayer, adjacentPlayer.player);
                return;
            }
        }

        const finalPlayer = gameState.players.find((p) => p.id === virtualPlayer.id);
        const hasActionPoints = finalPlayer?.currentAP > 0;
        const hasMovementPoints = finalPlayer?.currentMP > 0;

        const canOpenAdjacentDoor =
            hasActionPoints &&
            this.getAdjacentPositions(finalPos, gameState.board).some(
                (pos) => gameState.board[pos.x][pos.y] % TILE_DELIMITER === TileTypes.DoorClosed,
            );

        const canMoveFurther = hasMovementPoints && boardService.findAllPaths(gameState, finalPos).length > 0;

        if (canOpenAdjacentDoor || canMoveFurther) {
            this.performTurn(async () => this.handleVirtualMovement({ ...config, gameState }));
            return;
        }

        callbacks.handleEndTurn({ id: virtualPlayer.id } as Socket, lobbyId);
    }

    private getMovementStrategy(player: Player): MovementStrategy {
        switch (player.virtualPlayerData?.profile) {
            case 'aggressive':
                return this.aggressiveMovementStrategy;
            case 'defensive':
                return this.defensiveMovementStrategy;
            default:
                return this.defaultMovementStrategy;
        }
    }

    private async checkAndHandleAdjacentDoors(config: VirtualMovementConfig, currentPos: Coordinates, gameState: GameState): Promise<GameState> {
        const adjacentPositions = this.getAdjacentPositions(currentPos, gameState.board);
        const player = gameState.players.find((p) => p.id === config.virtualPlayer.id);

        if (!player || player.currentAP <= 0) {
            return gameState;
        }

        for (const pos of adjacentPositions) {
            const tileValue = gameState.board[pos.x][pos.y];
            const tileType = tileValue % TILE_DELIMITER;
            if (tileType === TileTypes.DoorClosed) {
                await this.handleDoor(config, pos);
                await config.callbacks.delay(DOOR_ACTION_DELAY_MS);
                const newGameState = config.getGameState();
                if (newGameState) return newGameState;
                break;
            }
        }
        return gameState;
    }

    private async followPath(path: Coordinates[], context: VirtualMovementConfig): Promise<void> {
        const { virtualPlayer, callbacks, lobbyId } = context;
        let currentGameState = context.getGameState();
        if (!currentGameState) return;

        const player = currentGameState.players.find((p) => p.id === virtualPlayer.id);
        if (!player) return;

        for (let i = 1; i < path.length; i++) {
            const nextPosition = path[i];
            const tileValue = currentGameState.board[nextPosition.x][nextPosition.y];
            const tileType = tileValue % TILE_DELIMITER;

            if (tileType === TileTypes.DoorClosed && player.currentAP > 0) {
                const tile: Tile = { x: nextPosition.x, y: nextPosition.y, type: TileTypes.DoorClosed, object: 0 };
                await callbacks.handleOpenDoor({ id: virtualPlayer.id } as Socket, tile, lobbyId);
                await callbacks.delay(DOOR_ACTION_DELAY_MS);

                currentGameState = context.getGameState();
                if (!currentGameState) return;
            }
        }
        await callbacks.handleRequestMovement({ id: virtualPlayer.id } as Socket, lobbyId, path);
    }
    private async handleDoor(context: VirtualMovementConfig, doorPosition: Coordinates): Promise<void> {
        const gameState = context.gameState;
        const player = gameState?.players.find((p) => p.id === context.virtualPlayer.id);

        if (player && player.currentAP > 0) {
            const tile: Tile = { x: doorPosition.x, y: doorPosition.y, type: TileTypes.DoorClosed, object: 0 };
            await context.callbacks.handleOpenDoor({ id: context.virtualPlayer.id } as Socket, tile, context.lobbyId);
        }
    }
}
