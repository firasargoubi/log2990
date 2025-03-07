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

    /**
     * Validates a game before saving
     * @param game The game to validate
     * @param gameNames List of existing game names to check for duplicates
     * @returns True if valid, false otherwise
     */
    validateGame(game: Game, gameNames: string[]): boolean {
        let isValid = true;

        // Validate required fields - ensuring strings aren't just whitespace
        if (!game.name || !game.name.trim()) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorGameNameRequired);
            isValid = false;
        }

        if (!game.description || !game.description.trim()) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorGameDescriptionRequired);
            isValid = false;
        }

        // Check for duplicate names
        if (game.name && game.name.trim() && gameNames.includes(game.name.trim())) {
            this.errorService.addMessage(EDITION_PAGE_CONSTANTS.errorGameNameExists);
            isValid = false;
        }

        // Trigger board verification
        this.saveService.alertBoardForVerification(true);
        const saveStatus: Partial<SaveMessage> = this.saveService.currentStatus;

        // Validate board structure
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
