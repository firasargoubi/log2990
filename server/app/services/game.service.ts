import { v4 as uuidv4 } from 'uuid';
import { Service } from 'typedi';
import { game } from '@app/classes/game.model';
import { Server as SocketIOServer } from 'socket.io';

export interface GameData {
    id?: string;
    name: string;
    description: string;
    mode: string;
    mapSize: string;
    lastModified?: Date;
    isVisible: boolean;
    board: number[][];
}

@Service()
export class GameService {
    private io: SocketIOServer;
    constructor(io: SocketIOServer) {
        this.io = io;
    }
    async createGame(gameData: GameData) {
        if (!gameData.id) {
            gameData.id = uuidv4();
        }
        const newgame = new game(gameData);
        await newgame.save();
        this.io.emit('gameCreated', newgame);
        return newgame;
    }

    async getAllGames() {
        return await game.find();
    }

    async editGame(id: string, updates: GameData) {
        const updateGame = await game.findOneAndUpdate({ id }, updates, { new: true });
        this.io.emit('gameUpdated', updateGame);
    }

    async deleteGame(id: string) {
        const deleteGame = await game.findOneAndDelete({ id });
        if (deleteGame) {
            this.io.emit('gameDeleted', deleteGame.id);
        }
    }

    async getVisibleGames() {
        return await game.find({ isVisible: true });
    }
}
