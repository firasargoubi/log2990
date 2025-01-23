import { Router, Request, Response } from 'express';
import { Service } from 'typedi';
import { GameService } from '@app/services/game.service';

const CREATED_STATUS = 201;
const NO_CONTENT_STATUS = 204;
@Service()
export class GameController {
    router: Router;
    constructor(private gameService: GameService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.post('/create', async (req: Request, res: Response) => {
            const newGame = await this.gameService.createGame(req.body);
            res.status(CREATED_STATUS).json(newGame);
        });

        this.router.get('/all', async (req: Request, res: Response) => {
            const games = await this.gameService.getAllGames();
            res.json(games);
        });

        this.router.put('/:id', async (req: Request, res: Response) => {
            const updatedGame = await this.gameService.editGame(req.params.id, req.body);
            res.json(updatedGame);
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            await this.gameService.deleteGame(req.params.id);
            res.sendStatus(NO_CONTENT_STATUS);
        });

        this.router.get('/visible', async (req: Request, res: Response) => {
            const visibleGames = await this.gameService.getVisibleGames();
            res.json(visibleGames);
        });
    }
}
