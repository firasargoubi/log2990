import { Service } from 'typedi';
import { Coordinates } from '@common/coordinates';
import { Player } from '@common/player';
import { BoardService } from './board.service';
import { GameSocketHandlerService } from './game-socket-handler.service';
import { GameState } from '@common/game-state';
import { Server, Socket } from 'socket.io';
import { TileTypes } from '@common/game.interface';
@Service()
export class VirtualPlayerService {
    private io: Server;
    private gameState: GameState;
    constructor(
        private boardService: BoardService,
        private gameSocketHandlerService: GameSocketHandlerService,
    ) {}
    startTurn(io: Server, gameState: GameState): void {
        this.io = io;
        this.gameState = gameState;
        this.handleActionForTurn();
        return;
    }

    updateVirtualPlayer(gameState: GameState): void {
        this.gameState = gameState;
        this.handleActionForTurn();
    }

    private handleActionForTurn(): void {
        const currentPlayerIndex = this.gameState.players.findIndex((p) => {
            return p.id === this.gameState.currentPlayer;
        });
        const listOfPlayers = this.gameState.playerPositions.filter((currentValue, index) => {
            return index !== currentPlayerIndex;
        });
        const reachablePlayer = new Set();
        for (const position of listOfPlayers) {
            this.getAdjacentPositions(position, this.gameState.board).forEach((pos) => {
                reachablePlayer.add(pos);
            });
        }
        console.log(reachablePlayer);
        let lastMove;
        for (const move of this.gameState.availableMoves) {
            if (reachablePlayer.has(move)) {
                console.log('This is the best move : ', move);
                break;
            }
        }
        console.log('No moves found, last move : ', lastMove);
        // this.gameSocketHandlerService.handleRequestMovement({ id: currentPlayer } as Socket, this.gameState.lobbyId, lastMove);
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
}
