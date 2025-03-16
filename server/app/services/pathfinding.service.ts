import { Service } from 'typedi';
import { GameState } from '@common/game-state';
import { Coordinates } from '@common/coordinates';
import { TileTypes } from '@common/game.interface';

interface Node {
    x: number;
    y: number;
    cost: number;
    distance: number;
    parent: Node | null;
}

interface PathContext {
    gameState: GameState;
    current: Node;
    visitedMap: Map<string, { cost: number; distance: number }>;
    openSet: Node[];
    maxMovementPoints: number;
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

        try {
            const tileValue = gameState.board[x][y];
            const tileType = tileValue % 10;
            const cost = this.getTileCost(tileType);

            return cost;
        } catch (error) {
            return Infinity;
        }
    }

    isPositionInBounds(gameState: GameState, position: Coordinates): boolean {
        const boardSize = gameState.board.length;
        return position.x >= 0 && position.x < boardSize && position.y >= 0 && position.y < boardSize;
    }

    isPositionOccupied(gameState: GameState, position: Coordinates): boolean {
        for (const [indexPlayer, playerPos] of gameState.playerPositions.entries()) {
            if (gameState.players[indexPlayer].id !== gameState.currentPlayer && playerPos.x === position.x && playerPos.y === position.y) {
                return true;
            }
        }
        return false;
    }

    isValidPosition(gameState: GameState, position: Coordinates): boolean {
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

    findShortestPath(gameState: GameState, start: Coordinates, end: Coordinates, maxMovementPoints = Infinity): Coordinates[] {
        if (!this.isPositionInBounds(gameState, end) || !this.isValidPosition(gameState, end)) {
            return [];
        }

        const openSet: Node[] = [];
        const visitedMap = new Map<string, { cost: number; distance: number }>();
        const startNode = this.createNode(start.x, start.y, 0, 0, null);

        openSet.push(startNode);

        const directions = [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
        ];

        while (openSet.length > 0) {
            openSet.sort(this.compareNodes);
            const current = openSet.shift();

            if (!current) {
                continue;
            }

            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(current);
            }

            const currentKey = this.getNodeKey(current);
            const visitedNode = visitedMap.get(currentKey);

            if (visitedNode && (visitedNode.cost < current.cost || (visitedNode.cost === current.cost && visitedNode.distance <= current.distance))) {
                continue;
            }

            visitedMap.set(currentKey, {
                cost: current.cost,
                distance: current.distance,
            });

            const context = {
                gameState,
                current,
                visitedMap,
                openSet,
                maxMovementPoints,
            };

            for (const dir of directions) {
                this.processPotentialNode(context, dir);
            }
        }

        return [];
    }

    findReachablePositions(gameState: GameState, startPosition: Coordinates, movementPoints: number): Coordinates[] {
        if (!startPosition || movementPoints <= 0) {
            return [];
        }

        const reachable: Coordinates[] = [];
        const visited = new Set<string>();

        const queue: { pos: Coordinates; cost: number; distance: number }[] = [{ pos: startPosition, cost: 0, distance: 0 }];

        visited.add(`${startPosition.x},${startPosition.y}`);

        while (queue.length > 0) {
            queue.sort((a, b) => {
                if (a.cost !== b.cost) {
                    return a.cost - b.cost;
                }
                return a.distance - b.distance;
            });

            const current = queue.shift();
            const { pos, cost, distance } = current;

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
                const newDistance = distance + 1;

                if (newCost <= movementPoints) {
                    queue.push({
                        pos: nextPos,
                        cost: newCost,
                        distance: newDistance,
                    });
                    visited.add(posKey);
                }
            }
        }

        return reachable;
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

    private reconstructPath(endNode: Node): Coordinates[] {
        const path: Coordinates[] = [];
        let current: Node | null = endNode;

        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }

        return path;
    }

    private processPotentialNode(context: PathContext, dir: { x: number; y: number }): void {
        const { gameState, current, visitedMap, openSet, maxMovementPoints } = context;
        const neighborPos = { x: current.x + dir.x, y: current.y + dir.y };

        if (!this.isValidPosition(gameState, neighborPos)) {
            return;
        }

        const tileCost = this.getMovementCost(gameState, neighborPos);
        const newCost = current.cost + tileCost;
        const newDistance = current.distance + 1;

        if (newCost > maxMovementPoints) {
            return;
        }

        const neighborKey = this.getNodeKey(neighborPos);
        const visitedNeighbor = visitedMap.get(neighborKey);

        if (visitedNeighbor && (visitedNeighbor.cost < newCost || (visitedNeighbor.cost === newCost && visitedNeighbor.distance <= newDistance))) {
            return;
        }

        const neighborNode = this.createNode(neighborPos.x, neighborPos.y, newCost, newDistance, current);
        openSet.push(neighborNode);
    }

    private getNodeKey(node: { x: number; y: number }): string {
        return `${node.x},${node.y}`;
    }

    private createNode(x: number, y: number, cost: number, distance: number, parent: Node | null): Node {
        return { x, y, cost, distance, parent };
    }

    private compareNodes(a: Node, b: Node): number {
        if (a.cost !== b.cost) {
            return a.cost - b.cost;
        }
        return a.distance - b.distance;
    }
}
