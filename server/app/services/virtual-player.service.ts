import { Service } from 'typedi';
import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';
import { BoardService } from './board.service';
import { GameState } from '@common/game-state';
import { Socket } from 'socket.io';
import { TileTypes } from '@common/game.interface';

interface VirtualPlayerCallbacks {
    handleRequestMovement: (socket: Socket, lobbyId: string, coordinates: Coordinates[]) => Promise<void>;
    handleEndTurn: (socket: Socket, lobbyId: string) => void;
    startBattle: (lobbyId: string, vp: Player, opponent: Player) => void;
    delay: (ms: number) => Promise<void>;
    handleOpenDoor: (socket: Socket, doorPosition: Coordinates, lobbyId: string) => Promise<void>;
}

interface VirtualMovementConfig {
    lobbyId: string;
    virtualPlayer: Player;
    getGameState: () => GameState | undefined;
    boardService: BoardService;
    callbacks: VirtualPlayerCallbacks;
}

@Service()
export class VirtualPlayerService {
    async performTurn(actionCallback: () => void): Promise<void> {
        const delay = 1000 + Math.random() * 2000;
        return new Promise((resolve) => {
            setTimeout(() => {
                actionCallback();
                resolve();
            }, delay);
        });
    }

    async handleVirtualMovement(config: VirtualMovementConfig): Promise<void> {
        const { virtualPlayer, getGameState, boardService } = config;
        let gameState = getGameState();
        if (!gameState) return;

        const playerIndex = gameState.players.findIndex((p) => p.id === virtualPlayer.id);
        if (playerIndex === -1) return;
        const currentPos = gameState.playerPositions[playerIndex];

        let availableMoves = boardService.findAllPaths(gameState, currentPos);
        if (!availableMoves?.length) {
            gameState = await this.checkAndHandleAdjacentDoors(config, currentPos, gameState);
            availableMoves = boardService.findAllPaths(gameState, currentPos);
            if (!availableMoves?.length) return;
        }

        const target = this.determineTarget(gameState, virtualPlayer, currentPos, availableMoves, playerIndex);

        const allowDoorHandling = this.isTargetReachable(gameState, target);
        await this.executeMovement(config, currentPos, target, playerIndex, allowDoorHandling);
    }

    private getAdjacentPositions(pos: Coordinates, board: number[][]): Coordinates[] {
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

    private getNearestOpponent(gameState: GameState, virtualPlayer: Player, currentPos: Coordinates): { player: Player; pos: Coordinates } | null {
        const opponents = gameState.players
            .map((p, idx) => ({ player: p, pos: gameState.playerPositions[idx] }))
            .filter((item) => item.player.id !== virtualPlayer.id);
        if (!opponents.length) return null;
        return opponents.reduce((prev, curr) => (this.distance(curr.pos, currentPos) < this.distance(prev.pos, currentPos) ? curr : prev));
    }

    private getClosest(target: Coordinates, positions: Coordinates[]): Coordinates {
        return positions.reduce((prev, curr) => (this.distance(curr, target) < this.distance(prev, target) ? curr : prev));
    }

    private isTargetReachable(gameState: GameState, target: Coordinates): boolean {
        const adjacent = this.getAdjacentPositions(target, gameState.board);
        for (const pos of adjacent) {
            const tileValue = gameState.board[pos.x][pos.y];
            const tileType = tileValue % 10;
            if (tileType !== TileTypes.Wall && tileType !== TileTypes.DoorClosed) {
                return true;
            }
        }
        return false;
    }

    private async checkAndHandleAdjacentDoors(config: VirtualMovementConfig, currentPos: Coordinates, gameState: GameState): Promise<GameState> {
        const adjacentPositions = this.getAdjacentPositions(currentPos, gameState.board);
        for (const pos of adjacentPositions) {
            const tileValue = gameState.board[pos.x][pos.y];
            const tileType = tileValue % 10;
            if (tileType === TileTypes.DoorClosed || tileValue === TileTypes.DoorClosed) {
                await this.handleDoor(config, pos);
                await config.callbacks.delay(500);
                const newGameState = config.getGameState();
                if (newGameState) return newGameState;
            }
        }
        return gameState;
    }

    private async executeMovement(
        config: VirtualMovementConfig,
        currentPos: Coordinates,
        target: Coordinates,
        playerIndex: number,
        allowDoorHandling: boolean,
    ): Promise<void> {
        let path = config.boardService.findShortestPath(config.getGameState(), currentPos, target);

        if (!path || path.length <= 1) {
            const availableMoves = config.boardService.findAllPaths(config.getGameState(), currentPos);
            const fallback = availableMoves.reduce(
                (prev, curr) => (this.distance(curr, target) < this.distance(prev, target) ? curr : prev),
                availableMoves[0],
            );
            path = [currentPos, fallback];
        }
        await this.followPath(path, config, allowDoorHandling);
        await this.handlePostMovement(config, playerIndex);
    }

    private async followPath(path: Coordinates[], context: VirtualMovementConfig, allowDoorHandling: boolean): Promise<void> {
        for (let i = 1; i < path.length; i++) {
            const nextPosition = path[i];
            const gameState = context.getGameState();
            if (!gameState) return;
            const tileValue = gameState.board[nextPosition.x][nextPosition.y];
            const tileType = tileValue % 10;
            if (allowDoorHandling && (tileType === TileTypes.DoorClosed || tileValue === TileTypes.DoorClosed)) {
                await this.handleDoor(context, nextPosition);
            }
            await context.callbacks.handleRequestMovement({ id: context.virtualPlayer.id } as Socket, context.lobbyId, path.slice(0, i + 1));
            await context.callbacks.delay(500);
        }
    }

    private determineTarget(
        gameState: GameState,
        virtualPlayer: Player,
        currentPos: Coordinates,
        availableMoves: Coordinates[],
        playerIndex: number,
    ): Coordinates {
        if (virtualPlayer.virtualPlayerData.profile === 'aggressive') {
            const nearest = this.getNearestOpponent(gameState, virtualPlayer, currentPos);
            if (nearest) return nearest.pos;
        }
        const spawn = gameState.spawnPoints[playerIndex];
        return this.getClosest(spawn, availableMoves);
    }

    private async handlePostMovement(config: VirtualMovementConfig, playerIndex: number): Promise<void> {
        const finalState = config.getGameState();
        if (!finalState) return;

        const finalPos = finalState.playerPositions[playerIndex];
        if (finalPos) {
            const opponents = finalState.players
                .map((p, idx) => ({ player: p, pos: finalState.playerPositions[idx] }))
                .filter((item) => item.player.id !== config.virtualPlayer.id);
            const adjacentOpponent = opponents.find((item) => this.distance(finalPos, item.pos) <= 1.5);
            if (adjacentOpponent) {
                config.callbacks.startBattle(config.lobbyId, config.virtualPlayer, adjacentOpponent.player);
                return;
            }
        }

        const finalPlayer = finalState.players.find((p) => p.id === config.virtualPlayer.id);
        if (finalPlayer?.currentAP > 0) {
            this.performTurn(async () => this.handleVirtualMovement(config));
        } else {
            config.callbacks.handleEndTurn({ id: config.virtualPlayer.id } as Socket, config.lobbyId);
        }
    }

    private distance(a: Coordinates, b: Coordinates): number {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    private async handleDoor(context: VirtualMovementConfig, doorPosition: Coordinates): Promise<void> {
        const tile = { x: doorPosition.x, y: doorPosition.y };
        await context.callbacks.handleOpenDoor({ id: context.virtualPlayer.id } as Socket, tile, context.lobbyId);
    }
}
