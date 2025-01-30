/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { GameController } from '@app/controllers/game.controller';
import { GameService } from '@app/services/game.service';
import { expect } from 'chai';
import * as express from 'express';
import * as sinon from 'sinon'; // Créer des mocks et stubs
import * as request from 'supertest'; // Tester les routes HTTP

const OK = 200;
const CREATED_STATUS = 201;
const NO_CONTENT_STATUS = 204;

describe('GameController', () => {
    const baseMockGame = {
        _id: '1234567890abcdef',
        id: '1',
        name: 'Test Game',
        description: 'A test game description',
        mode: 'Survival',
        mapSize: 'Large',
        lastModified: new Date().toISOString(),
        isVisible: true,
        board: [
            [0, 1],
            [1, 0],
        ],
    };

    let mockGame: typeof baseMockGame;
    let gameServiceStub: sinon.SinonStubbedInstance<GameService>;
    let gameController: GameController;
    let app: express.Application;

    beforeEach(() => {
        mockGame = { ...baseMockGame };
        gameServiceStub = sinon.createStubInstance(GameService);
        gameController = new GameController(gameServiceStub as GameService);
        app = express();
        app.use(express.json());
        app.use('/game', gameController.router);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('POST /game/create should create a new game', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gameServiceStub.createGame.resolves(mockGame as any);
        const response = await request(app).post('/game/create').send(mockGame);
        expect(response.status).to.equal(CREATED_STATUS);
        expect(response.body).to.deep.equal(mockGame);
        expect(gameServiceStub.createGame.calledOnce).to.be.true;
    });

    it('GET /game/all should return all games', async () => {
        const mockGames = [mockGame, { ...mockGame, id: '2', name: 'Another Game' }];
        const mockGamesWithISODate = mockGames.map((game) => ({
            ...game,
            lastModified: new Date(game.lastModified).toISOString(),
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gameServiceStub.getAllGames.resolves(mockGames as any);
        const response = await request(app).get('/game/all');

        expect(response.status).to.equal(OK);
        expect(response.body).to.deep.equal(mockGamesWithISODate);
        expect(gameServiceStub.getAllGames.calledOnce).to.be.true;
    });

    it('PATCH /game/:id should update a game', async () => {
        const updatedGame = {
            ...mockGame,
            name: 'Another Game',
            lastModified: new Date().toISOString(),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gameServiceStub.editGame.resolves(updatedGame as any);
        const response = await request(app).patch(`/game/${mockGame.id}`).send({ name: 'Updated Game' });
        expect(response.status).to.equal(OK);
        expect(response.body).to.deep.equal(updatedGame);
        expect(gameServiceStub.editGame.calledOnceWith(mockGame.id, { name: 'Updated Game' })).to.be.true;
    });

    it('DELETE /game/:id should delete a game', async () => {
        gameServiceStub.deleteGame.resolves();
        const response = await request(app).delete(`/game/${mockGame.id}`);
        expect(response.status).to.equal(NO_CONTENT_STATUS);
        expect(gameServiceStub.deleteGame.calledOnceWith(mockGame.id)).to.be.true;
    });
});
