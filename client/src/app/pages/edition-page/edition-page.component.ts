import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, ElementRef, inject, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { EDITION_PAGE_CONSTANTS, OBJECT_COUNT, GameSize, GameType } from '@app/Consts/app.constants';
import { Game } from '@common/game.interface';
import { MapSize } from '@app/interfaces/map-size';
import { BoardService } from '@app/services/board.service';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { ImageService } from '@app/services/image.service';
import { NotificationService } from '@app/services/notification.service';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { SaveService } from '@app/services/save.service';
import { ValidationService } from '@app/services/validation.service';
import { catchError, EMPTY, tap } from 'rxjs';

@Component({
    selector: 'app-game-page',
    templateUrl: './edition-page.component.html',
    styleUrls: ['./edition-page.component.scss'],
    imports: [FormsModule, BoardComponent, TileOptionsComponent, ObjectsComponent, RouterLink, DragDropModule],
})
export class EditionPageComponent implements OnInit {
    @ViewChild('board', { static: false }) boardElement: ElementRef;

    game: Game = this.createEmptyGame();
    gameReference: Game = this.createEmptyGame();
    showErrorPopup: boolean = false;
    saveState: boolean = false;
    gameLoaded: boolean = false;
    gameNames: string[] = [];
    errorMessage: string = '';
    private notificationService = inject(NotificationService);
    private saveService = inject(SaveService);
    private errorService = inject(ErrorService);
    private gameService = inject(GameService);
    private imageService = inject(ImageService);
    private counterService = inject(ObjectCounterService);
    private boardService = inject(BoardService);
    private validationService = inject(ValidationService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    constructor() {
        this.gameLoaded = false;
        this.game.id = this.route.snapshot.params['id'];
        this.game.mode = this.route.snapshot.queryParams['mode'] ? GameType.classic : GameType.capture;
        this.game.mapSize = this.route.snapshot.queryParams['size'] ? GameSize.large : GameSize.small;
        this.gameNames = this.saveService.getGameNames(this.game.id);
        this.loadGame();
    }

    get mapSize(): number {
        switch (this.game.mapSize) {
            case GameSize.small:
                return MapSize.SMALL;
            case GameSize.medium:
                return MapSize.MEDIUM;
            case GameSize.large:
                return MapSize.LARGE;
            default:
                return MapSize.SMALL;
        }
    }

    get objectNumber(): number {
        switch (this.game.mapSize) {
            case GameSize.small:
                return OBJECT_COUNT.small;
            case GameSize.medium:
                return OBJECT_COUNT.medium;
            case GameSize.large:
                return OBJECT_COUNT.large;
            default:
                return OBJECT_COUNT.small;
        }
    }

    ngOnInit() {
        this.errorService.message$.pipe().subscribe((message: string) => {
            this.errorMessage += message;
            this.showErrorPopup = true;
        });
    }

    async saveBoard() {
        try {
            const isValid = this.validationService.validateGame(this.game, this.gameNames);

            if (isValid && !this.showErrorPopup) {
                await this.prepareGameData();

                this.saveService.saveGame(this.game);

                this.saveState = true;
                this.errorService.addMessage(EDITION_PAGE_CONSTANTS.successGameLoaded);
            }
        } catch (err) {
            this.notificationService.showError('Error saving game: ' + (err as Error).message);
        }
    }

    resetBoard() {
        this.game = { ...this.gameReference };
        this.boardService.initializeBoard(this.game, this.mapSize);
        this.saveService.alertBoardForReset(true);
    }

    loadGame() {
        if (this.game.id) {
            this.gameService
                .fetchGameById(this.game.id)
                .pipe(
                    tap((gameSearched) => {
                        this.game = gameSearched;
                        this.gameReference = gameSearched;
                        this.gameLoaded = true;
                        this.notificationService.showSuccess(EDITION_PAGE_CONSTANTS.successGameLoaded);
                        this.counterService.initializeCounter(this.objectNumber);
                    }),
                    catchError(() => {
                        this.notificationService.showError(EDITION_PAGE_CONSTANTS.errorGameLoad);
                        this.gameLoaded = true;
                        return EMPTY;
                    }),
                )
                .subscribe();
        } else {
            this.game.name = '';
            this.game.description = '';
            this.gameLoaded = true;
            this.counterService.initializeCounter(this.objectNumber);
        }
    }

    closePopup() {
        this.errorMessage = '';
        this.showErrorPopup = false;
        if (this.saveState) {
            this.router.navigate(['/admin']);
        }
        this.saveState = false;
    }

    private createEmptyGame(): Game {
        return {
            id: '',
            name: '',
            mapSize: GameSize.small,
            mode: GameType.classic,
            previewImage: '',
            description: '',
            lastModified: new Date(),
            isVisible: true,
            board: [],
            objects: [],
        };
    }

    private async prepareGameData(): Promise<void> {
        this.game.board = this.saveService.intBoard;
        this.game.name = this.game.name.trim();
        this.game.description = this.game.description.trim();

        this.game.previewImage = await this.imageService.captureBoardFromTiles(this.boardService.board);
    }
}
