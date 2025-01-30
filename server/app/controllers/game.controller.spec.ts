import { Router, Request, Response } from 'express';
import { Service } from 'typedi';
import { GameService } from '@app/services/game.service';

const CREATED_STATUS = 201;
const NO_CONTENT_STATUS = 204;
const NOT_FOUND_STATUS = 404;
const BAD_REQUEST_STATUS = 400;
const SERVER_ERROR_STATUS = 500;

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
                if (!req.body.name || !req.body.board) {
                    return res.status(BAD_REQUEST_STATUS).json({ error: 'Name and board are required' });
                }
                const newGame = await this.gameService.createGame(req.body);
                return res.status(CREATED_STATUS).json(newGame);
            } catch (error) {
                return res.status(SERVER_ERROR_STATUS).json({ error: error.message });
            }
        });

        this.router.get('/all', async (_req: Request, res: Response) => {
            try {
                const games = await this.gameService.getAllGames();
                return res.json(games);
            } catch (error) {
                return res.status(SERVER_ERROR_STATUS).json({ error: error.message });
            }
        });


        this.router.put('/:id', async (req: Request, res: Response) => {
            try {
                const updatedGame = await this.gameService.editGame(req.params.id, req.body);
                if (!updatedGame) {
                    return res.status(NOT_FOUND_STATUS).json({ error: 'Game not found' });
                }
                return res.json(updatedGame);
            } catch (error) {
                return res.status(SERVER_ERROR_STATUS).json({ error: error.message });
            }
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            try {
                const deletedGame = await this.gameService.deleteGame(req.params.id);
                if (!deletedGame) {
                    return res.status(NOT_FOUND_STATUS).json({ error: 'Game not found' });
                }
                return res.sendStatus(NO_CONTENT_STATUS);
            } catch (error) {
                return res.status(SERVER_ERROR_STATUS).json({ error: error.message });
            }
        });

        this.router.get('/visible', async (_req: Request, res: Response) => {
            try {
                const visibleGames = await this.gameService.getVisibleGames();
                return res.json(visibleGames);
            } catch (error) {
                return res.status(SERVER_ERROR_STATUS).json({ error: error.message });
            }
        });
    }
}
