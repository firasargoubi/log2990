import { GameService } from '@app/services/game.service';
import { game } from '@app/classes/game.model';
import { expect } from 'chai';
import { SinonSandbox, createSandbox } from 'sinon';
import { v4 as uuidv4 } from 'uuid';

describe('GameService', () => {
    let gameService: GameService;
    let sandbox: SinonSandbox;

    beforeEach(() => {
        gameService = new GameService();
        sandbox = createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should create a new game with a unique ID if none is provided', async () => {
        const gameData = {
            name: 'Test Game',
            description: 'A test game',
            mode: 'Classic',
            mapSize: 'Medium',
            isVisible: true,
            board: [
                [0, 0],
                [0, 0],
            ],
        };

        const savedGame = { ...gameData, id: uuidv4(), save: sandbox.stub().resolves(gameData) };
        sandbox.stub(game.prototype, 'save').resolves(savedGame);

        const result = await gameService.createGame(gameData);
        expect(result).to.have.property('id').that.is.a('string');
        expect(result.name).to.equal('Test Game');
    });

    it('should return all games', async () => {
        const games = [{ name: 'Game1' }, { name: 'Game2' }];
        sandbox.stub(game, 'find').resolves(games);

        const result = await gameService.getAllGames();
        expect(result).to.equal(games);
    });

    it('should edit an existing game', async () => {
        const gameId = uuidv4();
        const updates = { name: 'Updated Game' };
        const updatedGame = { id: gameId, ...updates };

        sandbox.stub(game, 'findOneAndUpdate').resolves(updatedGame);
        const result = await gameService.editGame(gameId, updates);

        expect(result).to.equal(updatedGame);
    });

    it('should delete a game by ID', async () => {
        const gameId = uuidv4();
        const deletedGame = { id: gameId, name: 'Deleted Game' };

        sandbox.stub(game, 'findOneAndDelete').resolves(deletedGame);
        const result = await gameService.deleteGame(gameId);

        expect(result).to.equal(deletedGame);
    });

    it('should get only visible games', async () => {
        const visibleGames = [{ name: 'Game1', isVisible: true }];
        sandbox.stub(game, 'find').withArgs().resolves(visibleGames);

        const result = await gameService.getVisibleGames();
        expect(result).to.equal(visibleGames);
    });

    it('should return null if trying to edit a non-existent game', async () => {
        const gameId = uuidv4();
        const updates = { name: 'Non-existent Game' };

        sandbox.stub(game, 'findOneAndUpdate').resolves(null);
        const result = await gameService.editGame(gameId, updates);

        expect(result).to.equal(null);
    });

    it('should return null if trying to delete a non-existent game', async () => {
        const gameId = uuidv4();

        sandbox.stub(game, 'findOneAndDelete').resolves(null);
        const result = await gameService.deleteGame(gameId);

        expect(result).to.equal(null);
    });
});
