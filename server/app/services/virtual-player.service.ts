import { Service } from 'typedi';
import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';
import { BoardService } from './board.service';
import { GameState } from '@common/game-state';
import { Socket } from 'socket.io';

interface VirtualPlayerCallbacks {
    handleRequestMovement: (socket: Socket, lobbyId: string, coordinates: Coordinates[]) => Promise<void>;
    handleEndTurn: (socket: Socket, lobbyId: string) => void;
    startBattle: (lobbyId: string, vp: Player, opponent: Player) => void;
    delay: (ms: number) => Promise<void>;
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
        const { lobbyId, virtualPlayer, getGameState, boardService, callbacks } = config;
        const gameState = getGameState();
        if (!gameState) return;

        const playerIndex = gameState.players.findIndex((p) => p.id === virtualPlayer.id);
        if (playerIndex === -1) return;

        const currentPlayer = gameState.players[playerIndex];
        if (currentPlayer.currentAP <= 0) {
            callbacks.handleEndTurn({ id: virtualPlayer.id } as Socket, lobbyId);
            return;
        }

        const currentPos = gameState.playerPositions[playerIndex];
        const availableMoves = boardService.findAllPaths(gameState, currentPos);
        if (!availableMoves?.length) {
            callbacks.handleEndTurn({ id: virtualPlayer.id } as Socket, lobbyId);
            return;
        }

        const target = this.determineTarget(gameState, virtualPlayer, currentPos, availableMoves, playerIndex);
        await this.executeMovement(config, currentPos, target, playerIndex);
    }

    private determineTarget(
        gameState: GameState,
        virtualPlayer: Player,
        currentPos: Coordinates,
        availableMoves: Coordinates[],
        playerIndex: number,
    ): Coordinates {
        if (virtualPlayer.virtualPlayerData.profile === 'aggressive') {
            const opponents = gameState.players
                .map((p, idx) => ({ player: p, pos: gameState.playerPositions[idx] }))
                .filter((item) => item.player.id !== virtualPlayer.id);

            if (opponents.length > 0) {
                const nearest = opponents.reduce((prev, curr) =>
                    this.distance(curr.pos, currentPos) < this.distance(prev.pos, currentPos) ? curr : prev,
                );
                return nearest.pos;
            }
        }

        const spawn = gameState.spawnPoints[playerIndex];
        return availableMoves.reduce((prev, curr) => (this.distance(curr, spawn) < this.distance(prev, spawn) ? curr : prev), availableMoves[0]);
    }

    private async executeMovement(config: VirtualMovementConfig, currentPos: Coordinates, target: Coordinates, playerIndex: number): Promise<void> {
        let path = config.boardService.findShortestPath(config.getGameState(), currentPos, target);

        if (!path || path.length <= 1) {
            const availableMoves = config.boardService.findAllPaths(config.getGameState(), currentPos);
            const fallback = availableMoves.reduce(
                (prev, curr) => (this.distance(curr, target) < this.distance(prev, target) ? curr : prev),
                availableMoves[0],
            );
            path = [currentPos, fallback];
        }

        await this.moveAlongPath(path.slice(1), config, playerIndex);
        await this.handlePostMovement(config, playerIndex);
    }

    private async moveAlongPath(steps: Coordinates[], config: VirtualMovementConfig, playerIndex: number): Promise<void> {
        const { getGameState, callbacks } = config;
        let currentPos = getGameState()?.playerPositions[playerIndex];
        if (!currentPos) return;

        for (const step of steps) {
            const refreshedState = getGameState();
            const refreshedPlayer = refreshedState?.players[playerIndex];
            if (!refreshedPlayer || refreshedPlayer.currentAP <= 0) break;

            await callbacks.handleRequestMovement({ id: refreshedPlayer.id } as Socket, config.lobbyId, [currentPos, step]);
            currentPos = getGameState()?.playerPositions[playerIndex];
            if (!currentPos) break;

            await callbacks.delay(150);
        }
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
}
