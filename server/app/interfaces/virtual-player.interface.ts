import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';
import { GameState } from '@common/game-state';
import { Socket } from 'socket.io';
import { Tile } from '@common/game.interface';
import { BoardService } from '@app/services/board.service';

export interface VirtualPlayerCallbacks {
    handleRequestMovement: (socket: Socket, lobbyId: string, coordinates: Coordinates[]) => Promise<void>;
    handleEndTurn: (socket: Socket, lobbyId: string) => void;
    startBattle: (lobbyId: string, vp: Player, opponent: Player) => void;
    delay: (ms: number) => Promise<void>;
    handleOpenDoor: (socket: Socket, tile: Tile, lobbyId: string) => Promise<void>;
}

export interface VirtualMovementConfig {
    lobbyId: string;
    virtualPlayer: Player;
    getGameState: () => GameState | undefined;
    boardService: BoardService;
    callbacks: VirtualPlayerCallbacks;
    gameState: GameState;
}
