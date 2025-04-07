import { game } from '@app/classes/game.model';
import { Game } from '@common/game.interface';
import { Service } from 'typedi';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class GameService {
    async createGame(gameData: Game) {
        if (!gameData.id) {
            gameData.id = uuidv4();
        }
        const newgame = new game(gameData);
        return await newgame.save();
    }

    async getAllGames() {
        return await game.find();
    }

    async editGame(id: string, updates: Partial<Game>) {
        return await game.findOneAndUpdate({ id }, updates, { new: true });
    }

    async getGameById(id: string) {
        return await game.findOne({ id });
    }

    async deleteGame(id: string) {
        const deletedGame = await game.findOneAndDelete({ id });
        return deletedGame ? true : null;
    }

    async getVisibleGames() {
        return await game.find({ isVisible: true });
    }
}
