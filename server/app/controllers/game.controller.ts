import { GameService } from '@app/services/game.service';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';

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
                res.status(StatusCodes.CREATED).json(newGame);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
            }
        });

        this.router.get('/all', async (req: Request, res: Response) => {
            try {
                const games = await this.gameService.getAllGames();
                res.status(StatusCodes.OK).json(games);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
            }
        });
        this.router.get('/visible', async (req: Request, res: Response) => {
            try {
                const visibleGames = await this.gameService.getVisibleGames();
                res.status(StatusCodes.OK).json(visibleGames);
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
            }
        });
        this.router.get('/:id', async (req: Request, res: Response) => {
            try {
                const game = await this.gameService.getGameById(req.params.id);
                if (game) {
                    res.status(StatusCodes.OK).json(game);
                } else {
                    res.status(StatusCodes.NOT_FOUND).json({ error: 'Game not found' });
                }
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
            }
        });

        this.router.patch('/:id', async (req: Request, res: Response) => {
            try {
                const updatedGame = await this.gameService.editGame(req.params.id, req.body);
                if (updatedGame) {
                    res.status(StatusCodes.OK).json(updatedGame);
                } else {
                    res.status(StatusCodes.NOT_FOUND).json({ error: 'Game not found' });
                }
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
            }
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            try {
                const deleted = await this.gameService.deleteGame(req.params.id);
                if (deleted) {
                    res.sendStatus(StatusCodes.NO_CONTENT);
                } else {
                    res.status(StatusCodes.NOT_FOUND).json({ error: 'Game not found' });
                }
            } catch (error) {
                res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
            }
        });

        this.router.use((req: Request, res: Response) => {
            res.status(StatusCodes.NOT_FOUND).json({ error: 'Route not found' });
        });
    }
}
