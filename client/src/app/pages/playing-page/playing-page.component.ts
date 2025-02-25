import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MAP_SIZES } from '@app/Consts/app.constants';
import { Game } from '@app/interfaces/game.model';
import { SaveMessage } from '@app/interfaces/save-message';
import { GameService } from '@app/services/game.service';
import { NotificationService } from '@app/services/notification.service';
import { ObjectCounterService } from '@app/services/objects-counter.service';
import { SaveService } from '@app/services/save.service';
import { catchError, EMPTY, tap } from 'rxjs';
import { BoardComponent } from 'src/app/components/board/board.component';
import { CountdownComponent } from 'src/app/components/countdown-timer/countdown-timer.component';
import { GameInfoComponent } from 'src/app/components/game-info/game-info.component';
import { InventoryComponent } from 'src/app/components/inventory/inventory.component';
import { MessagesComponent } from 'src/app/components/messages/messages.component';
import { PlayerInfoComponent } from 'src/app/components/player-info/player-info.component';

const DIX = 10;
const QUINZE = 15;
const VINGT = 20;
@Component({
    selector: 'app-playing-page',
    imports: [CountdownComponent, PlayerInfoComponent, InventoryComponent, GameInfoComponent, BoardComponent, MessagesComponent],
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit {
    @ViewChild('board', { static: false }) boardElement: ElementRef;

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
    objectNumber: number = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private gameService: GameService,
        private saveService: SaveService,
        private notificationService: NotificationService,
        private counterService: ObjectCounterService,
    ) {
        this.game.id = this.route.snapshot.params['id'];
        this.game.mapSize = this.route.snapshot.queryParams['size'] || 'large';
        this.game.mode = this.route.snapshot.queryParams['mode'] || 'normal';
        this.loadGame();
    }

    get mapSize(): number {
        switch (this.game.mapSize) {
            case MAP_SIZES.small:
                return DIX;
            case MAP_SIZES.medium:
                return QUINZE;
            case MAP_SIZES.large:
                return VINGT;
            default:
                return DIX;
        }
    }

    ngOnInit() {
        this.initializeGame();
    }

    // Charger le jeu à partir de l'ID
    loadGame() {
        if (this.game.id) {
            this.gameService
                .fetchGameById(this.game.id)
                .pipe(
                    tap((gameSearched) => {
                        this.game = gameSearched;
                        this.gameLoaded = true;
                        this.notificationService.showSuccess('Jeu chargé avec succès');
                        this.counterService.initializeCounter(this.objectNumber);
                        setTimeout(() => {
                            this.boardElement?.nativeElement?.dispatchEvent(new Event('updateBoard'));
                        }, 0); // Forcer une mise à jour de l'affichage
                    }),
                    catchError(() => {
                        this.notificationService.showError('Erreur lors du chargement du jeu');
                        this.gameLoaded = true;
                        return EMPTY;
                    }),
                )
                .subscribe();
        }
    }

    // Sauvegarder le jeu
    async saveBoard() {
        if (!this.game.name) {
            this.notificationService.showError('Le nom du jeu est requis');
        }
        if (!this.game.description) {
            this.notificationService.showError('La description du jeu est requise');
        }

        this.saveService.alertBoardForVerification(true);
        const saveStatus: Partial<SaveMessage> = this.saveService.currentStatus;

        if (!saveStatus.doors) {
            this.notificationService.showError('Les portes doivent être validées');
        }
        if (!saveStatus.allSpawnPoints) {
            this.notificationService.showError('Tous les points de spawn doivent être validés');
        }
        if (!saveStatus.accessible) {
            this.notificationService.showError('Le terrain doit être accessible');
        }
        if (!saveStatus.minTerrain) {
            this.notificationService.showError('Le terrain doit être suffisant');
        }

        if (!this.showErrorPopup) {
            //  this.game.previewImage = await this.imageService.captureComponent(this.boardElement.nativeElement);
            this.saveService.saveGame(this.game);
            this.saveState = true;
            this.notificationService.showError('Jeu sauvegardé avec succès');
        }
    }

    // Réinitialiser la partie
    resetBoard() {
        window.location.reload();
    }

    // Fermer la popup d'erreur
    closePopup() {
        this.errorMessage = '';
        this.showErrorPopup = false;
        if (this.saveState) {
            this.router.navigate(['/admin']);
        }
        this.saveState = false;
    }

    // Actions pour terminer un tour, abandonner, attaquer et défendre
    endTurn() {
        // miaw
    }

    abandon() {
        // Logic to redirect or notify about abandonment
    }

    attack() {
        // miaw
    }

    defend() {
        // miaw
    }

    private initializeGame() {
        // Add logic to initialize the game
    }
}
