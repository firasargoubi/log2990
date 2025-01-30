import 'reflect-metadata';
import { GameService } from './game.service';
import { game } from '@app/classes/game.model';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as sinon from 'sinon';

const mockGameData = {
    id: '1234',
    name: 'Test Game',
    description: 'Test Description',
    mode: 'Survival',
    mapSize: 'Large',
    lastModified: new Date(),
    isVisible: true,
    board: [[0, 1], [1, 0]],
};

describe('GameService', () => {
    let gameService: GameService;
    let findStub: sinon.SinonStub;
    let findOneStub: sinon.SinonStub;
    let findOneAndUpdateStub: sinon.SinonStub;
    let findOneAndDeleteStub: sinon.SinonStub;

    beforeEach(() => {
        gameService = new GameService();
        findStub = sinon.stub(game, 'find');
        findOneStub = sinon.stub(game, 'findOne');
        findOneAndUpdateStub = sinon.stub(game, 'findOneAndUpdate');
        findOneAndDeleteStub = sinon.stub(game, 'findOneAndDelete');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should create a new game with a generated ID', async () => {
        const gameDataWithoutId = {
            name: 'Test Game',
            description: 'Test Description',
            mode: 'Survival',
            mapSize: 'Large',
            isVisible: true,
            board: [[0, 1], [1, 0]],
        };
    
        // Exécuter la méthode
        const result = await gameService.createGame(gameDataWithoutId);
    
        // Vérifier que `uuidv4` a bien été appelé
        expect(result).to.deep.equal(mockGameData);
    });
    

    it('should get all games', async () => {
        findStub.resolves([mockGameData]);

        const result = await gameService.getAllGames();

        expect(result).to.deep.equal([mockGameData]);
        expect(findStub.calledOnce).to.be.true;
    });



    it('should edit a game', async () => {
        findOneAndUpdateStub.resolves(mockGameData);

        const result = await gameService.editGame('1234', { name: 'Updated Game' });

        expect(result).to.deep.equal(mockGameData);
        expect(findOneAndUpdateStub.calledOnceWith({ id: '1234' }, { name: 'Updated Game' }, { new: true })).to.be.true;
    });

    it('should return null when trying to edit a non-existent game', async () => {
        findOneAndUpdateStub.resolves(null);

        const result = await gameService.editGame('9999', { name: 'Updated Game' });

        expect(result).to.be.null;
    });

    it('should delete a game', async () => {
        findOneAndDeleteStub.resolves(mockGameData);

        const result = await gameService.deleteGame('1234');

        expect(result).to.deep.equal(mockGameData);
        expect(findOneAndDeleteStub.calledOnceWith({ id: '1234' })).to.be.true;
    });

    it('should return null when trying to delete a non-existent game', async () => {
        findOneAndDeleteStub.resolves(null);

        const result = await gameService.deleteGame('9999');

        expect(result).to.be.null;
    });

    it('should get only visible games', async () => {
        findStub.resolves([mockGameData]);

        const result = await gameService.getVisibleGames();

        expect(result).to.deep.equal([mockGameData]);
        expect(findStub.calledOnceWith({ isVisible: true })).to.be.true;
    });
});
