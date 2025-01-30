import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BoardComponent } from '@app/components/board/board.component';
import { ObjectsComponent } from '@app/components/objects/objects.component';
import { TileOptionsComponent } from '@app/components/tile-options/tile-options.component';
import { SaveMessage } from '@app/interfaces/saveMessage';
import { ErrorService } from '@app/services/error.service';
import { SaveService } from '@app/services/save.service';

@Component({
    selector: 'app-game-page',
    templateUrl: './edition-page.component.html',
    styleUrls: ['./edition-page.component.scss'],
    imports: [FormsModule, BoardComponent, TileOptionsComponent, ObjectsComponent, RouterLink],
})
export class EditionPageComponent {
    saveService = inject(SaveService);
    gameName: string = '';
    gameDescription: string = '';
    showErrorPopup: boolean = false;
    errorMessage: string = '';
    errorService = inject(ErrorService);

    constructor() {
        this.errorService.message$.pipe(takeUntilDestroyed()).subscribe((message: string) => {
            this.errorMessage += message;
            this.showErrorPopup = true;
        });
    }

    saveBoard() {
        if (!this.gameName) {
            this.errorService.addMessage('Error: Game name is required.\n');
        }
        if (!this.gameDescription) {
            this.errorService.addMessage('Error: Game description is required.\n');
        }
        this.saveService.setSaveActive(true);
        const saveStatus = this.saveService.currentStatus;
        let key: keyof SaveMessage;
        for (key in saveStatus) {
            if (!saveStatus[key]) {
                this.errorService.addMessage(`Error: ${key} name is not respected.\n`);
            }
        }
    }

    resetBoard() {
        this.saveService.setResetActive(true);
    }

    closePopup() {
        this.errorMessage = '';
        this.showErrorPopup = false;
    }
}
