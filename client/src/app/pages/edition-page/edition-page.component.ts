import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, ElementRef, inject, ViewChild, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { EDITION_PAGE_CONSTANTS, MAP_SIZES, OBJECT_COUNT } from '@app/Consts/app.constants';
import { Game } from '@app/interfaces/game.model';
import { MapSize } from '@app/interfaces/map-size';
import { SaveMessage } from '@app/interfaces/save-message';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { ImageService } from '@app/services/image.service';
import { NotificationService } from '@app/services/notification.service';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { SaveService } from '@app/services/save.service';
import { catchError, EMPTY, tap } from 'rxjs';

@Component({
    selector: 'app-game-page',
    templateUrl: './edition-page.component.html',
    styleUrls: ['./edition-page.component.scss'],
    imports: [FormsModule, BoardComponent, TileOptionsComponent, ObjectsComponent, RouterLink, DragDropModule],
})
export class EditionPageComponent implements OnInit {
    @ViewChild('board', { static: false }) boardElement: ElementRef;
    notificationService = inject(NotificationService);
    game: Game = {
        id: '',
        name: '',
        mapSize: 'small',
        mode: 'normal',
        previewImage: '',
        description: '',
        lastModified: new Date(),
        isVisible: true,
        board: [],
        objects: [],
    };

    showErrorPopup: boolean = false;
    saveState: boolean = false;
    gameLoaded: boolean = false;
    errorMessage: string = '';

    saveService = inject(SaveService);
    errorService = inject(ErrorService);
    gameService = inject(GameService);
    imageService = inject(ImageService);
    counterService = inject(ObjectCounterService);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
    ) {
        this.gameLoaded = false;
        this.game.id = this.route.snapshot.params['id'];
        this.game.mode = this.route.snapshot.queryParams['mode'] || 'normal';
        this.game.mapSize = this.route.snapshot.queryParams['size'] || 'large';
        this.loadGame();
    }

    get mapSize(): number {
        switch (this.game.mapSize) {
            case MAP_SIZES.small:
                return MapSize.SMALL;
            case MAP_SIZES.medium:
                return MapSize.MEDIUM;
            case MAP_SIZES.large:
                return MapSize.LARGE;
            default:
                return MapSize.SMALL;
        }
    }

    get objectNumber(): number {
        switch (this.game.mapSize) {
            case MAP_SIZES.small:
                return OBJECT_COUNT.small;
            case MAP_SIZES.medium:
                return OBJECT_COUNT.medium;
            case MAP_SIZES.large:
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
        if (!this.game.name) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorGameNameRequired);
        }
        if (!this.game.description) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorGameDescriptionRequired);
        }

        this.saveService.alertBoardForVerification(true);
        const saveStatus: Partial<SaveMessage> = this.saveService.currentStatus;

        if (!saveStatus.doors) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidDoors);
        }
        if (!saveStatus.allSpawnPoints) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidSpawns);
        }
        if (!saveStatus.accessible) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidAccess);
        }
        if (!saveStatus.minTerrain) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidMinTiles);
        }

        if (!this.showErrorPopup) {
            this.game.previewImage = await this.imageService.captureComponent(this.boardElement.nativeElement);
            this.saveService.saveGame(this.game);
            this.saveState = true;
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.successGameLoaded);
        }
    }

    resetBoard() {
        window.location.reload();
    }

    loadGame() {
        if (this.game.id) {
            this.gameService
                .fetchGameById(this.game.id)
                .pipe(
                    tap((gameSearched) => {
                        this.game = gameSearched;
                        this.gameLoaded = true;
                        this.notificationService.showSuccess(EDITION_PAGE_CONSTANTS.successGameLoaded);
                        this.counterService.initializeCounter(this.objectNumber);
                        setTimeout(() => {
                            this.boardElement?.nativeElement?.dispatchEvent(new Event('updateBoard'));
                        }, 0); // Forcer une mise à jour de l'affichage
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
}
