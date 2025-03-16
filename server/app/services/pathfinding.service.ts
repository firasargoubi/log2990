import { GameState } from '@app/interface/game-state';
import { Coordinates } from '@common/coordinates';
import { TileTypes } from '@common/game.interface';
import { Service } from 'typedi';

interface Node {
    x: number;
    y: number;
    g: number; // Movement cost from start to this node
    h: number; // Estimated cost from this node to end
    f: number; // Total cost (g + h)
    parent: Node | null;
}

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

    isPositionInBounds(gameState: GameState, position: Coordinates): boolean {
        const boardSize = gameState.gameBoard.length;
        return position.x >= 0 && position.x < boardSize && position.y >= 0 && position.y < boardSize;
    }

    isPositionOccupied(gameState: GameState, position: Coordinates): boolean {
        for (const [playerId, playerPos] of gameState.playerPositions.entries()) {
            if (playerId !== gameState.currentPlayer && playerPos.x === position.x && playerPos.y === position.y) {
                return true;
            }
        }
        return false;
    }

    isValidPosition(gameState: GameState, position: Coordinates): boolean {
        if (!this.isPositionInBounds(gameState, position)) {
            console.log(`Position (${position.x}, ${position.y}) is out of bounds`);
            return false;
        }

        if (this.isPositionOccupied(gameState, position)) {
            console.log(`Position (${position.x}, ${position.y}) is occupied by another player`);
            return false;
        }

        const movementCost = this.getMovementCost(gameState, position);
        const isValid = movementCost !== Infinity;

        if (!isValid) {
            console.log(`Position (${position.x}, ${position.y}) has infinite movement cost (blocked)`);
        }

        return isValid;
    }

    findShortestPath(gameState: GameState, start: Coordinates, end: Coordinates, maxMovementPoints = Infinity): Coordinates[] | null {
        if (!this.isPositionInBounds(gameState, end) || !this.isValidPosition(gameState, end)) {
            return null;
        }

        const openSet: Node[] = [];
        const closedSet = new Set<string>();

        const startNode: Node = {
            x: start.x,
            y: start.y,
            g: 0,
            h: this.heuristic(start, end),
            f: 0,
            parent: null,
        };

        startNode.f = startNode.g + startNode.h;
        openSet.push(startNode);

        while (openSet.length > 0) {
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIndex].f) {
                    currentIndex = i;
                }
            }

            const current = openSet.splice(currentIndex, 1)[0];
            const currentKey = `${current.x},${current.y}`;

            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(current);
            }

            closedSet.add(currentKey);

            const directions = [
                { x: 0, y: -1 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
            ];

            for (const dir of directions) {
                const neighborPos = { x: current.x + dir.x, y: current.y + dir.y };
                const neighborKey = `${neighborPos.x},${neighborPos.y}`;

                if (closedSet.has(neighborKey) || !this.isValidPosition(gameState, neighborPos)) {
                    continue;
                }

                const movementCost = this.getMovementCost(gameState, neighborPos);
                const gScore = current.g + movementCost;

                if (gScore > maxMovementPoints) {
                    continue;
                }

                let neighborNode = openSet.find((n) => n.x === neighborPos.x && n.y === neighborPos.y);

                if (!neighborNode) {
                    neighborNode = {
                        x: neighborPos.x,
                        y: neighborPos.y,
                        g: gScore,
                        h: this.heuristic(neighborPos, end),
                        f: 0,
                        parent: current,
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openSet.push(neighborNode);
                } else if (gScore < neighborNode.g) {
                    neighborNode.g = gScore;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }

        return null;
    }

    private heuristic(a: Coordinates, b: Coordinates): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private reconstructPath(endNode: Node): Coordinates[] {
        const path: Coordinates[] = [];
        let current: Node | null = endNode;

        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }

        return path;
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
