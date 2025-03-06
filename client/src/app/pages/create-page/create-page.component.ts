import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { CREATE_PAGE_CONSTANTS, GAME_MODES, GAME_SIZE } from '@app/Consts/app.constants';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Observable } from 'rxjs';
@Component({
    selector: 'app-create-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, GameCreationCardComponent, MatCardModule, RouterLink],
    templateUrl: './create-page.component.html',
    styleUrls: ['./create-page.component.scss'],
})
export class CreatePageComponent implements OnInit {
    @Input() games$: Observable<Game[]> = new Observable<Game[]>();
    games: Game[] = [];
    notificationService = inject(NotificationService);
    lobbyService = inject(LobbyService);
    lobbyId: string = '';
    private modeTranslation: Record<string, string> = GAME_MODES;
    private sizeTranslation: Record<string, string> = GAME_SIZE;

    constructor(
        private dialog: MatDialog,
        private gameService: GameService,
    ) {}

    ngOnInit(): void {
        this.loadGames();
    }

    translateMode(mode: string): string {
        return this.modeTranslation[mode] || mode;
    }

    translateSize(size: string): string {
        return this.sizeTranslation[size] || size;
    }

    onBoxClick(game: Game): void {
        this.gameService.verifyGameAccessible(game.id).subscribe({
            next: (isAccessible) => {
                if (isAccessible) {
                    if (!this.lobbyId) {
                        this.lobbyId = this.lobbyService.createLobby(4, game.id);
                    }
                    this.openBoxFormDialog(game);
                } else {
                    this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorGameDeleted);
                    this.loadGames();
                }
            },
            error: () => {
                this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorGameDeleted);
                this.loadGames();
            },
        });
    }

    openBoxFormDialog(game: Game): void {
        const translatedGame = {
            ...game,
            mode: this.translateMode(game.mode),
            mapSize: this.translateSize(game.mapSize),
        };

        const dialogRef = this.dialog.open(BoxFormDialogComponent, {
            data: { boxId: game.id, game: translatedGame, gameList: this.games, lobbyId: this.lobbyId },
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    this.loadGames();
                }
            },
        });
    }

    private loadGames(): void {
        this.gameService.fetchVisibleGames().subscribe({
            next: (allGames) => {
                this.games = allGames.map((game) => ({
                    ...game,
                    mode: this.translateMode(game.mode),
                    mapSize: this.translateSize(game.mapSize),
                }));
            },
            error: () => this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorLoadingGames),
        });
    }
}
