import { Injectable } from '@angular/core';
import { EDITION_PAGE_CONSTANTS } from '@app/Consts/app.constants';
import { Game } from '@common/game.interface';
import { SaveMessage } from '@app/interfaces/save-message';
import { ErrorService } from '@app/services/error.service';
import { SaveService } from '@app/services/save.service';

@Injectable({
    providedIn: 'root',
})
export class ValidationService {
    constructor(
        private errorService: ErrorService,
        private saveService: SaveService,
    ) {}

    validateGame(game: Game, gameNames: string[]): boolean {
        let isValid = true;

        if (!game.name || !game.name.trim()) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorGameNameRequired);
            isValid = false;
        }

        if (!game.description || !game.description.trim()) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorGameDescriptionRequired);
            isValid = false;
        }

        if (game.name && game.name.trim() && gameNames.includes(game.name.trim())) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorGameNameExists);
            isValid = false;
        }

        this.saveService.alertBoardForVerification(true);
        const saveStatus: Partial<SaveMessage> = this.saveService.currentStatus;

        if (!saveStatus.doors) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidDoors);
            isValid = false;
        }

        if (!saveStatus.allSpawnPoints) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidSpawns);
            isValid = false;
        }

        if (!saveStatus.accessible) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidAccess);
            isValid = false;
        }

        if (!saveStatus.minTerrain) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorInvalidMinTiles);
            isValid = false;
        }

        return isValid;
    }
}
