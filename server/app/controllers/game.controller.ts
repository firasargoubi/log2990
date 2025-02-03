import { Router, Request, Response } from 'express';
import { Service } from 'typedi';
import { GameService } from '@app/services/game.service';

const CREATED_STATUS = 201;
const NO_CONTENT_STATUS = 204;
const OK_STATUS = 200;
const NOT_FOUND_STATUS = 404;
const BAD_REQUEST_STATUS = 400;

@Service()
export class GameController {
    router: Router;
    constructor(private gameService: GameService) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.post('/create', async (req: Request, res: Response) => {
            try {
                const newGame = await this.gameService.createGame(req.body);
                res.status(CREATED_STATUS).json(newGame);
            } catch (error) {
                res.status(BAD_REQUEST_STATUS).json({ error: error.message });
            }
        });

        this.router.get('/all', async (req: Request, res: Response) => {
            try {
                const games = await this.gameService.getAllGames();
                res.status(OK_STATUS).json(games);
            } catch (error) {
                res.status(BAD_REQUEST_STATUS).json({ error: error.message });
            }
        });

        this.router.patch('/:id', async (req: Request, res: Response) => {
            try {
                const updatedGame = await this.gameService.editGame(req.params.id, req.body);
                if (updatedGame) {
                    res.status(OK_STATUS).json(updatedGame);
                } else {
                    res.status(NOT_FOUND_STATUS).json({ error: 'Game not found' });
                }
            } catch (error) {
                res.status(BAD_REQUEST_STATUS).json({ error: error.message });
            }
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            try {
                const deleted = await this.gameService.deleteGame(req.params.id);
                if (deleted) {
                    res.sendStatus(NO_CONTENT_STATUS);
                } else {
                    res.status(NOT_FOUND_STATUS).json({ error: 'Game not found' });
                }
            } catch (error) {
                res.status(BAD_REQUEST_STATUS).json({ error: error.message });
            }
        });

        this.router.get('/visible', async (req: Request, res: Response) => {
            try {
                const visibleGames = await this.gameService.getVisibleGames();
                res.status(OK_STATUS).json(visibleGames);
            } catch (error) {
                res.status(BAD_REQUEST_STATUS).json({ error: error.message });
            }
        });

        this.router.use((req: Request, res: Response) => {
            res.status(NOT_FOUND_STATUS).json({ error: 'Route not found' });
        });
    }
}
