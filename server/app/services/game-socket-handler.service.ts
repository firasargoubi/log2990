import { Coordinates } from '@common/coordinates';
import { GameLobby } from '@common/game-lobby';
import { GameState } from '@common/game-state';
import { Tile, TILE_DELIMITER, TileTypes } from '@common/game.interface';
import { Player } from '@common/player';
import { Server, Socket } from 'socket.io';
import { Service } from 'typedi';
import { BoardService } from './board.service';
import { LobbySocketHandlerService } from './lobby-socket-handler.service';

@Service()
export class GameSocketHandlerService {
    private io: Server;
    constructor(
        private lobbies: Map<string, GameLobby>,
        private gameStates: Map<string, GameState>,
        private boardService: BoardService,
        private lobbySocketHandlerService: LobbySocketHandlerService,
    ) {}
    setServer(server: Server) {
        this.io = server;
    }

    async handleRequestStart(socket: Socket, lobbyId: string) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', 'Lobby not found.');
            return;
        }

        const player = lobby.players.find((p) => p.id === socket.id);
        if (!player || !player.isHost) {
            socket.emit('error', 'Only the host can start the game.');
            return;
        }

        try {
            const gameState = await this.boardService.initializeGameState(lobby);

            this.gameStates.set(lobbyId, gameState);

            lobby.isLocked = true;
            this.lobbySocketHandlerService.updateLobby(lobbyId);

            this.io.to(lobbyId).emit('gameStarted', { gameState });

            this.startTurn(lobbyId);
        } catch (error) {
            socket.emit('error', `Failed to start game: ${error.message}`);
        }
    }

    handleEndTurn(socket: Socket, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }

        if (socket.id !== gameState.currentPlayer) {
            socket.emit('error', "It's not your turn.");
            return;
        }

        try {
            const updatedGameState = this.boardService.handleEndTurn(gameState);

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit('turnEnded', { gameState });

            this.startTurn(lobbyId);
        } catch (error) {
            socket.emit('error', `Failed to end turn: ${error.message}`);
        }
    }

    handleRequestMovement(socket: Socket, lobbyId: string, coordinates: Coordinates[]) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }

        try {
            let updatedGameState = gameState;
            for (const coordinate of coordinates) {
                updatedGameState = this.boardService.handleMovement(gameState, coordinate);
            }

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit('movementProcessed', { gameState });

            if (updatedGameState.availableMoves.length === 0) {
                this.handleEndTurn(socket, lobbyId);
            }
        } catch (error) {
            socket.emit('error', `Movement error: ${error.message}`);
        }
    }

    startTurn(lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            return;
        }

        try {
            const updatedGameState = this.boardService.handleTurn(gameState);

            this.gameStates.set(lobbyId, updatedGameState);

            this.io.to(lobbyId).emit('turnStarted', { gameState });
        } catch (error) {
            this.io.to(lobbyId).emit('error', `Turn error: ${error.message}`);
        }
    }

    handleEndTurnInternally(gameState: GameState): GameState {
        return this.boardService.handleEndTurn(gameState);
    }

    closeDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }
        const newGameBoard = gameState.board.map((row) => [...row]);
        newGameBoard[tile.x][tile.y] = TileTypes.DoorClosed;
        const updatedGameState: GameState = {
            ...gameState,
            board: newGameBoard,
        };
        const newGameState = this.boardService.handleBoardChange(updatedGameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit('boardModified', { gameState: newGameState });
    }

    openDoor(socket: Socket, tile: Tile, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }
        const newGameBoard = gameState.board.map((row) => [...row]);
        newGameBoard[tile.x][tile.y] = TileTypes.DoorOpen;
        const updatedGameState = {
            ...gameState,
            board: newGameBoard,
        };

        const newGameState = this.boardService.handleBoardChange(updatedGameState);
        this.gameStates.set(lobbyId, newGameState);
        this.io.to(lobbyId).emit('boardModified', { gameState: newGameState });
    }

    initializeBattle(socket: Socket, currentPlayer: Player, opponent: Player) {
        this.io.to(currentPlayer.id).to(opponent.id).emit('playersBattling', { isInCombat: true });
    }

    startBattle(socket: Socket, currentPlayer: Player, opponent: Player, gameState: GameState) {
        const currentIndex = gameState.players.findIndex((p) => p.id === currentPlayer.id);
        const opponentIndex = gameState.players.findIndex((p) => p.id === opponent.id);
        const playerTurn = currentIndex < opponentIndex ? currentPlayer.id : opponent.id;
        const player = gameState.players.find((p) => p.id === playerTurn);
        const countDown = player.amountEscape === 2 ? 3 : 5;
        this.io.to(currentPlayer.id).to(opponent.id).emit('PlayerTurn', { playerTurn, countDown });
    }

    changeTurnEnd(currentPlayer: Player, opponent: Player, playerTurn: string, gameState: GameState) {
        const player = gameState.players.find((p) => p.id === playerTurn);
        const newPlayerTurn = player.id === currentPlayer.id ? opponent.id : currentPlayer.id;
        const newPlayer = gameState.players.find((p) => p.id === newPlayerTurn);
        const countDown = newPlayer.amountEscape === 2 ? 3 : 5;
        this.io.to(currentPlayer.id).to(opponent.id).emit('PlayerSwitch', { newPlayerTurn, countDown });
    }

    handlePlayersUpdate(socket: Socket, lobbyId: string, players: Player[]) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', 'Game not found.');
            return;
        }
        let deletedPlayer: Player;
        for (const player of gameState.players) {
            if (!players.find((p) => p.id === player.id)) {
                deletedPlayer = player;
            }
        }
        if (deletedPlayer) {
            const playerIndex = gameState.players.findIndex((p) => p.id === deletedPlayer.id);
            gameState.currentPlayer = gameState.players[(playerIndex + 1) % gameState.players.length].id;
            gameState.players.splice(playerIndex, 1);
            const spawnPoint = gameState.spawnPoints[playerIndex];
            gameState.board[spawnPoint.x][spawnPoint.y] = gameState.board[spawnPoint.x][spawnPoint.y] % TILE_DELIMITER;
            gameState.spawnPoints.splice(playerIndex, 1);
            gameState.playerPositions.splice(playerIndex, 1);
            if (!gameState.deletedPlayers) {
                gameState.deletedPlayers = [];
            }
            gameState.deletedPlayers.push(deletedPlayer);
        }
        const newGameState = this.boardService.handleBoardChange(gameState);
        console.log('New Game State', newGameState);
        this.gameStates.set(lobbyId, gameState);
        this.io.to(lobbyId).emit('boardModified', { gameState: newGameState });
    }

    handleDefeat(player: Player, lobbyId: string) {
        const gameState = this.gameStates.get(lobbyId);
        const playerIndex = gameState.players.findIndex((p) => p.id === player.id);
        if (playerIndex === -1) return;
        const newSpawn = gameState.spawnPoints[playerIndex];
        gameState.playerPositions[playerIndex] = newSpawn;
        this.io.to(lobbyId).emit('changedSpawnPoint', { player, newSpawn });
    }

    handleAttackAction(lobbyId: string, opponent: Player, damage: number) {
        const gameState = this.gameStates.get(lobbyId);
        const opponentGame = gameState.players.find((p) => p.id === opponent.id);
        if (!opponentGame) return;
        if (damage > 0) {
            opponentGame.life -= damage;
        }
        this.io.to(lobbyId).emit('update-health', { player: opponentGame, remainingHealth: opponentGame.life });
    }
}
