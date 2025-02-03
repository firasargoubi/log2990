import { GameService, GameData} from '@app/services/game.service';
import { Request, Response, Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { Service } from 'typedi';

const CREATED_STATUS = 201;
const NO_CONTENT_STATUS = 204;
@Service()
export class GameController {
    router: Router;
    constructor(
        private gameService: GameService,
        private io: SocketIOServer,
    ) {
        this.router = Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.post('/create', async (req: Request, res: Response) => {
            const newGame = await this.gameService.createGame(req.body);
            this.io.emit('gameCreated', newGame);
            res.status(CREATED_STATUS).json(newGame);
        });

        this.router.get('/all', async (req: Request, res: Response) => {
            const games = await this.gameService.getAllGames();
            res.json(games);
        });

        this.router.patch('/:id', async (req: Request, res: Response) => {
            const updatedGame = await this.gameService.editGame(req.params.id, req.body);
            if (updatedGame) {
                this.io.emit('gameUpdated', updatedGame);
            }
            res.json(updatedGame);
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            const deletedGame = this.gameService.deleteGame(req.params.id);
            if (deletedGame) {
                this.io.emit('gameDeleted', deletedGame);
            }
            res.sendStatus(NO_CONTENT_STATUS);
        });

        this.router.get('/visible', async (req: Request, res: Response) => {
            const visibleGames = await this.gameService.getVisibleGames();
            res.json(visibleGames);
        });
    }
}
