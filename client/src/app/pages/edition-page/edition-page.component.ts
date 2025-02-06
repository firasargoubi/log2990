import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { Game } from '@app/interfaces/game.model';
import { SaveMessage } from '@app/interfaces/saveMessage';
import { ErrorService } from '@app/services/error.service';
import { GameService } from '@app/services/game.service';
import { SaveService } from '@app/services/save.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './edition-page.component.html',
    styleUrls: ['./edition-page.component.scss'],
    imports: [FormsModule, BoardComponent, TileOptionsComponent, ObjectsComponent, RouterLink, DragDropModule],
})
export class EditionPageComponent {
    game: Game;
    showErrorPopup: boolean = false;
    saveSuccessful: boolean = false;
    errorMessage: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private gameService: GameService,
        private saveService: SaveService,
        private errorService: ErrorService,
    ) {
        this.errorService.message$.pipe(takeUntilDestroyed()).subscribe((message: string) => {
            this.errorMessage += message;
            this.showErrorPopup = true;
        });
        this.game.id = this.route.snapshot.params['id'];
        this.game.mode = this.route.snapshot.queryParams['mode'] || 'normal';
        this.game.mapSize = this.route.snapshot.queryParams['size'] || 'large';
        this.loadGame();
    }

    get mapSize(): number {
        switch (this.game.mapSize) {
            case 'small':
                return 10;
            case 'medium':
                return 15;
            case 'large':
                return 20;
            default:
                return 10;
        }
    }
    saveBoard() {
        if (!this.game.name) {
            this.errorService.addMessage('Error: Game name is required.\n');
        }
        if (!this.game.description) {
            this.errorService.addMessage('Error: Game description is required.\n');
        }
        this.saveService.alertBoardForVerification(true);
        const saveStatus = this.saveService.currentStatus;
        this.saveSuccessful = true;
        let key: keyof SaveMessage;
        for (key in saveStatus) {
            if (!saveStatus[key]) {
                this.errorService.addMessage(`Error: ${key} name is not respected.\n`);
                this.saveSuccessful = false;
            }
        }
        if (this.saveSuccessful) {
            this.saveService.saveGame(this.game);
            this.errorService.addMessage('Game saved successfully.\n');
        }
    }

    resetBoard() {
        this.saveService.alertBoardForReset(true);
    }

    loadGame() {
        if (this.game.id) {
            this.gameService.fetchGameById(this.game.id).subscribe({
                next: (gameSearched) => {
                    this.game = gameSearched;
                },
            });
        } else {
            this.game.name = '';
            this.game.description = '';
        }
    }

    closePopup() {
        this.errorMessage = '';
        this.showErrorPopup = false;
        if (this.saveSuccessful) {
            this.router.navigate(['/admin']);
        }
        this.saveSuccessful = false;
    }
}
