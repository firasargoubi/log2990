import { Service } from 'typedi';
import { GameState } from '@app/interface/game-state';
import { Coordinates } from '@common/coordinates';
import { TileTypes } from '@common/game.interface';

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
    // Movement costs for different tile types
    getMovementCost(gameState: GameState, position: Coordinates): number {
        const { x, y } = position;
        if (!this.isPositionInBounds(gameState, position)) {
            return Infinity;
        }

        // Extract the tile type (ignoring objects, which are in tens place)
        const tileType = gameState.gameBoard[x][y] % 10;
        return this.getTileCost(tileType);
    }

    // Get movement cost based on tile type
    private getTileCost(tileType: number): number {
        switch (tileType) {
            case TileTypes.Ice:
                return 0; // Ice has no movement cost (slide)
            case TileTypes.Grass:
            case TileTypes.DoorOpen:
                return 1; // Normal cost
            case TileTypes.Water:
                return 2; // Water is harder to move through
            case TileTypes.DoorClosed:
            case TileTypes.Wall:
                return Infinity; // Can't move through walls or closed doors
            default:
                return Infinity; // Unknown tile types are impassable
        }
    }

    // Check if a position is within board boundaries
    isPositionInBounds(gameState: GameState, position: Coordinates): boolean {
        const boardSize = gameState.gameBoard.length;
        return position.x >= 0 && position.x < boardSize && position.y >= 0 && position.y < boardSize;
    }

    // Check if a position is occupied by another player
    isPositionOccupied(gameState: GameState, position: Coordinates): boolean {
        for (const [playerId, playerPos] of gameState.playerPositions.entries()) {
            // Skip the current player
            if (playerId !== gameState.currentPlayer && playerPos.x === position.x && playerPos.y === position.y) {
                return true;
            }
        }
        return false;
    }

    // Check if a position is valid for movement
    isValidPosition(gameState: GameState, position: Coordinates): boolean {
        if (!this.isPositionInBounds(gameState, position)) {
            return false;
        }

        if (this.isPositionOccupied(gameState, position)) {
            return false;
        }

        const movementCost = this.getMovementCost(gameState, position);
        return movementCost !== Infinity;
    }

    // A* algorithm to find the shortest path between two points
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
            // Find node with lowest f score
            let currentIndex = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIndex].f) {
                    currentIndex = i;
                }
            }

            const current = openSet.splice(currentIndex, 1)[0];
            const currentKey = `${current.x},${current.y}`;

            // If we've reached the end position
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(current);
            }

            closedSet.add(currentKey);

            // Check neighbors
            const directions = [
                { x: 0, y: -1 }, // Up
                { x: 1, y: 0 }, // Right
                { x: 0, y: 1 }, // Down
                { x: -1, y: 0 }, // Left
            ];

            for (const dir of directions) {
                const neighborPos = { x: current.x + dir.x, y: current.y + dir.y };
                const neighborKey = `${neighborPos.x},${neighborPos.y}`;

                // Skip if already processed or not valid
                if (closedSet.has(neighborKey) || !this.isValidPosition(gameState, neighborPos)) {
                    continue;
                }

                const movementCost = this.getMovementCost(gameState, neighborPos);
                const gScore = current.g + movementCost;

                // Skip if exceeds max movement points
                if (gScore > maxMovementPoints) {
                    continue;
                }

                // Check if this path is better or if neighbor is not in open set
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
                    // Found a better path
                    neighborNode.g = gScore;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    neighborNode.parent = current;
                }
            }
        }

        // No path found
        return null;
    }

    // Manhattan distance heuristic
    private heuristic(a: Coordinates, b: Coordinates): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // Reconstruct path from end node to start node
    private reconstructPath(endNode: Node): Coordinates[] {
        const path: Coordinates[] = [];
        let current: Node | null = endNode;

        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }

        return path;
    }

    // Find all reachable positions within movement points
    findReachablePositions(gameState: GameState, startPosition: Coordinates, movementPoints: number): Coordinates[] {
        const reachable: Coordinates[] = [];
        const visited = new Set<string>();
        const queue: { pos: Coordinates; cost: number }[] = [{ pos: startPosition, cost: 0 }];

        visited.add(`${startPosition.x},${startPosition.y}`);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const { pos, cost } = current;

            // If not the starting position, add to reachable
            if (pos.x !== startPosition.x || pos.y !== startPosition.y) {
                reachable.push(pos);
            }

            // Explore neighbors
            const directions = [
                { x: 0, y: -1 }, // Up
                { x: 1, y: 0 }, // Right
                { x: 0, y: 1 }, // Down
                { x: -1, y: 0 }, // Left
            ];

            for (const dir of directions) {
                const nextPos = { x: pos.x + dir.x, y: pos.y + dir.y };
                const posKey = `${nextPos.x},${nextPos.y}`;

                if (visited.has(posKey) || !this.isValidPosition(gameState, nextPos)) {
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
}
