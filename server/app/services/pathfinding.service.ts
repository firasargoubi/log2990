import { Service } from 'typedi';
import { GameState } from '@app/interface/game-state';
import { Coordinates } from '@common/coordinates';
import { TileTypes } from '@common/game.interface';
import { Node } from '@app/interface/node';

@Service()
export class PathfindingService {
    getMovementCost(gameState: GameState, position: Coordinates): number {
        const { x, y } = position;

        if (!gameState) {
            return Infinity;
        }

        if (!gameState.board) {
            return Infinity;
        }

        if (!this.isPositionInBounds(gameState, position)) {
            return Infinity;
        }

        if (this.isPositionOccupied(gameState, position)) {
            return Infinity;
        }

        try {
            const tileValue = gameState.board[x][y];
            const tileType = tileValue % 10;
            const cost = this.getTileCost(tileType);

            return cost;
        } catch (error) {
            return Infinity;
        }
    }

    findReachablePositions(gameState: GameState, startPosition: Coordinates, movementPoints: number): Coordinates[] {
        const reachable: Coordinates[] = [];
        const visited = new Set<string>();
        const queue: { pos: Coordinates; cost: number }[] = [{ pos: startPosition, cost: 0 }];

        visited.add(`${startPosition.x},${startPosition.y}`);

        while (queue.length > 0) {
            const current = queue.shift();
            const { pos, cost } = current;

            if (pos.x !== startPosition.x || pos.y !== startPosition.y) {
                reachable.push(pos);
            }

            const directions = [
                { x: 0, y: -1 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
            ];

            for (const dir of directions) {
                const nextPos = { x: pos.x + dir.x, y: pos.y + dir.y };
                const posKey = `${nextPos.x},${nextPos.y}`;

                if (visited.has(posKey)) {
                    continue;
                }

                if (!this.isValidPosition(gameState, nextPos)) {
                    continue;
                }

                const tileCost = this.getMovementCost(gameState, nextPos);
                const newCost = cost + tileCost;

                if (newCost <= movementPoints) {
                    queue.push({ pos: nextPos, cost: newCost });
                    visited.add(posKey);
                }
            }
        }
        return reachable;
    }

    findShortestPath(gameState: GameState, startPosition: Coordinates, endPosition: Coordinates, reachable: Coordinates[]): Map<string, Node> {
        const shortestPath = new Map<string, Node>();
        const openSet: Node[] = [];

        const startNode: Node = {
            x: startPosition.x,
            y: startPosition.y,
            cost: 0,
            distance: 0,
            pastX: -1,
            pastY: -1,
        };

        shortestPath.set(`${startPosition.x},${startPosition.y}`, startNode);

        openSet.push(startNode);

        while (openSet.length > 0) {
            openSet.sort((a, b) => {
                if (a.cost !== b.cost) {
                    return a.cost - b.cost;
                }
                return a.distance - b.distance;
            });

            const current = openSet.shift();

            if (!current) continue;

            const directions = [
                { x: 0, y: -1 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
            ];

            for (const dir of directions) {
                const nextX = current.x + dir.x;
                const nextY = current.y + dir.y;
                const nextPosKey = `${nextX},${nextY}`;

                if (!reachable.some((pos) => pos.x === nextX && pos.y === nextY) && !(nextX === startPosition.x && nextY === startPosition.y)) {
                    continue;
                }

                const tileCost = this.getMovementCost(gameState, { x: nextX, y: nextY });
                const newCost = current.cost + tileCost;
                const newDistance = current.distance + 1;

                const existingNode = shortestPath.get(nextPosKey);
                let shouldUpdate = false;

                if (!existingNode) {
                    shouldUpdate = true;
                } else if (newCost < existingNode.cost) {
                    shouldUpdate = true;
                } else if (newCost === existingNode.cost && newDistance < existingNode.distance) {
                    shouldUpdate = true;
                }

                if (shouldUpdate) {
                    const nextNode: Node = {
                        x: nextX,
                        y: nextY,
                        cost: newCost,
                        distance: newDistance,
                        pastX: current.x,
                        pastY: current.y,
                    };

                    shortestPath.set(nextPosKey, nextNode);

                    openSet.push(nextNode);
                }
            }
        }

        return shortestPath;
    }

    private getTileCost(tileType: number): number {
        switch (tileType) {
            case TileTypes.Ice:
                return 0;
            case 0:
            case TileTypes.Grass:
            case TileTypes.DoorOpen:
                return 1;
            case TileTypes.Water:
                return 2;
            case TileTypes.DoorClosed:
            case TileTypes.Wall:
                return Infinity;
            default:
                return Infinity;
        }
    }

    private isPositionInBounds(gameState: GameState, position: Coordinates): boolean {
        const boardSize = gameState.board.length;
        return position.x >= 0 && position.x < boardSize && position.y >= 0 && position.y < boardSize;
    }

    private isPositionOccupied(gameState: GameState, position: Coordinates): boolean {
        for (const [playerId, playerPos] of gameState.playerPositions.entries()) {
            if (playerId !== gameState.currentPlayer && playerPos.x === position.x && playerPos.y === position.y) {
                return true;
            }
        }
        return false;
    }

    private isValidPosition(gameState: GameState, position: Coordinates): boolean {
        if (!this.isPositionInBounds(gameState, position)) {
            return false;
        }

        if (this.isPositionOccupied(gameState, position)) {
            return false;
        }

        const movementCost = this.getMovementCost(gameState, position);
        const isValid = movementCost !== Infinity;

        return isValid;
    }

    private serializeShortestPath(shortestPath: Map<string, Node>): Coordinates[][] {
        const path: Coordinates[][] = [];

        const data = Object.fromEntries(shortestPath);
        if (!data) {
            return [];
        }
        for (const key in data.keys) {
            if (!data[key]) {
                continue;
            }
            const currentEntry = key.split(',').map(Number);
            const current: Coordinates = { x: currentEntry[0], y: currentEntry[1] };
            const shortestPathNode = data[key];
            const entry = [current, { x: shortestPathNode.x, y: shortestPathNode.y }];
            path.push(entry);
        }

        return path;
    }
}
