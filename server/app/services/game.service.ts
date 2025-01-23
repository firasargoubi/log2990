import { Game } from '../classes/game.model'; // Ajustez le chemin si nécessaire

//interagir avec le modèle Game ()
export class GameService{
    async createGame(gameData : any){
        const game = new Game(gameData);
        return await game.save();
    }

    async getAllGames(){
        return await Game.find();
    }

    async editGame(id: string, updates: any){
        return await Game.findByIdAndUpdate(id, updates, {new : true}) //new : true pour assurer la mise à jour
    }

    async deleteGame(id: string) {
        return await Game.findByIdAndDelete(id);
    }
    
    async getVisibleGames() {
        return await Game.find({ isVisible: true }); 
    }
}