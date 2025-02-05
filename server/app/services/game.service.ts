import { v4 as uuidv4 } from 'uuid';
import { Service } from 'typedi';
import { game } from '@app/classes/game.model';

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
        const newgame = new game(gameData);
        return await newgame.save();
    }

    async getAllGames() {
        return await game.find();
    }

    async editGame(id: string, updates: Partial<GameData>) {
        return await game.findOneAndUpdate({ id }, updates, { new: true });
    }

    async deleteGame(id: string) {
        const deletedGame = await game.findOneAndDelete({ id });
        return deletedGame ? true : null;
    }

    async getVisibleGames() {
        return await game.find({ isVisible: true });
    }
}
