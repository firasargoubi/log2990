import { Injectable } from '@angular/core';
import { EDITION_PAGE_CONSTANTS } from '@app/consts/app-constants';
import { SaveMessage } from '@app/interfaces/save-message';
import { ErrorService } from '@app/services/error.service';
import { SaveService } from '@app/services/save.service';
import { Game, GameType } from '@common/game.interface';

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

        if (game.mode === GameType.capture && !saveStatus.ctfPlaced) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.missingFlag);
            isValid = false;
        }

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
