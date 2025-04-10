import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { BoxFormDialogComponent } from '@app/components/box-form-dialog/box-form-dialog.component';
import { GameCreationCardComponent } from '@app/components/game-creation-card/game-creation-card.component';
import { CREATE_PAGE_CONSTANTS, GameSize, GameType } from '@app/consts/app-constants';
import { GameService } from '@app/services/game.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { Game } from '@common/game.interface';
import { Observable, Subscription } from 'rxjs';

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
    currentGame: Game;
    lobbyId: string = '';

    private notificationService = inject(NotificationService);
    private dialog = inject(MatDialog);
    private gameService = inject(GameService);
    private subscriptions: Subscription[] = [];
    private lobbyService = inject(LobbyService);

    ngOnInit(): void {
        this.loadGames();
    }

    onBoxClick(game: Game): void {
        this.currentGame = game;
        this.gameService.verifyGameAccessible(this.currentGame.id).subscribe({
            next: (isAccessible) => {
                if (!isAccessible) {
                    this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorGameDeleted);
                    this.loadGames();
                    return;
                }

                if (!this.lobbyId) {
                    this.lobbyService.createLobby(this.currentGame);
                    this.subscriptions.push(
                        this.lobbyService.onLobbyCreated().subscribe({
                            next: (data) => {
                                this.lobbyId = data.lobby.id;
                                this.openBoxFormDialog(this.currentGame);
                            },
                            error: (err) => {
                                this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorLobbyCreation + ' ' + err);
                            },
                        }),
                    );
                } else {
                    this.openBoxFormDialog(this.currentGame);
                }
            },
            error: () => {
                this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorGameDeleted);
                this.loadGames();
            },
        });
    }

    private translateMode(mode: string): GameType {
        return mode as GameType;
    }

    private translateSize(size: string): GameSize {
        return size as GameSize;
    }

    private openBoxFormDialog(game: Game): void {
        const dialogRef = this.dialog.open(BoxFormDialogComponent, {
            data: { boxId: game.id, game, gameList: this.games, lobbyId: this.lobbyId, isJoining: false },
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

                if (this.games.length > 0) {
                    this.currentGame = this.games[0];
                }
            },
            error: () => this.notificationService.showError(CREATE_PAGE_CONSTANTS.errorLoadingGames),
        });
    }
}
