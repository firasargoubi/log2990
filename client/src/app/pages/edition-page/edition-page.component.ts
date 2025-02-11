import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { ImageService } from '@app/services/image.service';
import { Game } from '@app/interfaces/game.model';
import { MapSize } from '@app/interfaces/mapsize';
import { SaveMessage } from '@app/interfaces/saveMessage';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
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
export class EditionPageComponent {
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
        this.errorService.message$.pipe(takeUntilDestroyed()).subscribe((message: string) => {
            this.errorMessage += message;
            this.showErrorPopup = true;
        });
        this.gameLoaded = false;
        this.game.id = this.route.snapshot.params['id'];
        this.game.mode = this.route.snapshot.queryParams['mode'] || 'normal';
        this.game.mapSize = this.route.snapshot.queryParams['size'] || 'large';
        this.loadGame();
    }

    get mapSize(): number {
        switch (this.game.mapSize) {
            case 'small':
                return MapSize.SMALL;
            case 'medium':
                return MapSize.MEDIUM;
            case 'large':
                return MapSize.LARGE;
            default:
                return MapSize.SMALL;
        }
    }

    get objectNumber(): number {
        switch (this.game.mapSize) {
            case 'small':
                return 2;
            case 'medium':
                return 4;
            case 'large':
                return 6;
            default:
                return 2;
        }
    }

    async saveBoard() {
        if (!this.game.name) {
            this.errorService.addMessage('Error: Game name is required.\n');
        }
        if (!this.game.description) {
            this.errorService.addMessage('Error: Game description is required.\n');
        }

        this.saveService.alertBoardForVerification(true);
        const saveStatus = this.saveService.currentStatus;

        let key: keyof SaveMessage;
        for (key in saveStatus) {
            if (!saveStatus[key]) {
                this.errorService.addMessage(`Error: ${key} name is not respected.\n`);
            }
        }

        if (!this.showErrorPopup) {
            this.game.previewImage = await this.imageService.captureComponent(this.boardElement.nativeElement);
            this.saveService.saveGame(this.game);
            this.saveState = true;
            this.errorService.addMessage('Game saved successfully.\n');
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
                        this.notificationService.showSuccess('Jeu chargé avec succès.');
                        this.counterService.initializeCounter(this.objectNumber);
                        setTimeout(() => {
                            this.boardElement?.nativeElement?.dispatchEvent(new Event('updateBoard'));
                        }, 0); // Forcer une mise à jour de l'affichage
                    }),
                    catchError(() => {
                        this.notificationService.showError('Impossible de charger le jeu.');
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
