import { DragDropModule } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { SaveMessage } from '@app/interfaces/saveMessage';
import { ErrorService } from '@app/services/error.service';
import { SaveService } from '@app/services/save.service';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './edition-page.component.html',
    styleUrls: ['./edition-page.component.scss'],
    imports: [FormsModule, BoardComponent, TileOptionsComponent, ObjectsComponent, RouterLink, DragDropModule],
})
export class EditionPageComponent {
    gameMode: string = 'normal';
    gameMapSize: string = 'small';
    id: string = '';
    saveService = inject(SaveService);
    gameName: string = '';
    gameDescription: string = '';
    showErrorPopup: boolean = false;
    errorMessage: string = '';
    errorService = inject(ErrorService);
    gameService = inject(GameService);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
    ) {
        this.errorService.message$.pipe(takeUntilDestroyed()).subscribe((message: string) => {
            this.errorMessage += message;
            this.showErrorPopup = true;
        });
        this.id = this.route.snapshot.params['id'];
        this.loadGame();
    }

    get mapSize(): number {
        switch (this.gameMapSize) {
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
        if (!this.gameName) {
            this.errorService.addMessage('Error: Game name is required.\n');
        }
        if (!this.gameDescription) {
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
            this.saveService.saveGame(this.gameName, this.gameDescription, this.gameMode, this.gameMapSize, this.id);
            this.errorService.addMessage('Game saved successfully.\n');
        }
    }

    resetBoard() {
        this.saveService.alertBoardForReset(true);
    }

    loadGame() {
        this.gameService.fetchGameById(this.id).subscribe({
            next: (gameSearched) => {
                this.id = gameSearched.id;
                this.gameName = gameSearched.name;
                this.gameDescription = gameSearched.description;
                this.gameMode = gameSearched.mode;
                this.gameMapSize = gameSearched.mapSize;
            },
        });
    }

    closePopup() {
        this.errorMessage = '';
        this.showErrorPopup = false;
        if (this.errorMessage === 'Game saved successfully.\n') {
            this.router.navigate(['/admin']);
        }
    }
}
