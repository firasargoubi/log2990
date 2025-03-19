import { GameState } from '@common/game-state';

export interface Node {
    x: number;
    y: number;
    cost: number;
    distance: number;
    parent: Node | null;
}

export interface PathContext {
    gameState: GameState;
    current: Node;
    visitedMap: Map<string, { cost: number; distance: number }>;
    openSet: Node[];
    maxMovementPoints: number;
}
