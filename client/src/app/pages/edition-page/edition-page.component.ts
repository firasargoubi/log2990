import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BoardComponent } from '@app/components/board/board.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { SaveService } from '@app/services/save.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './edition-page.component.html',
    styleUrls: ['./edition-page.component.scss'],
    imports: [FormsModule, BoardComponent, TileOptionsComponent, ObjectsComponent],
})
export class GamePageComponent {
    saveService = inject(SaveService);
    gameName: string = '';
    gameDescription: string = '';
    showErrorPopup: boolean = false;
    errorMessage: string = '';

    saveBoard() {
        if (this.gameName && this.gameDescription) {
            this.saveService.setActive(true);
        } else {
            this.errorMessage = 'An error occurred while saving the game.';
            this.showErrorPopup = true;
        }
    }

    closePopup() {
        this.showErrorPopup = false;
    }
}
