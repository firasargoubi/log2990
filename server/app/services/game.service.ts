import { v4 as uuidv4 } from 'uuid';
import { Service } from 'typedi';
import { Game } from '@app/classes/game.model';

interface GameData {
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
    async createGame(gameData: GameData) {
        if (!gameData.id) {
            gameData.id = uuidv4();
        }
        const game = new Game(gameData);
        return await game.save();
    }

    async getAllGames() {
        return await Game.find();
    }

    async editGame(id: string, updates: GameData) {
        return await Game.findByIdAndUpdate(id, updates, { new: true });
    }

    async deleteGame(id: string) {
        return await Game.findByIdAndDelete(id);
    }

    async getVisibleGames() {
        return await Game.find({ isVisible: true });
    }
}
