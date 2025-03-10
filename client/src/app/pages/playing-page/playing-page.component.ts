import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BoardComponent } from 'src/app/components/board/board.component';
import { CountdownComponent } from 'src/app/components/countdown-timer/countdown-timer.component';
import { GameInfoComponent } from 'src/app/components/game-info/game-info.component';
import { InventoryComponent } from 'src/app/components/inventory/inventory.component';
import { PlayerInfoComponent } from 'src/app/components/player-info/player-info.component';

@Component({
    selector: 'app-playing-page',
    imports: [CountdownComponent, PlayerInfoComponent, InventoryComponent, GameInfoComponent, BoardComponent],
    templateUrl: './playing-page.component.html',
    styleUrls: ['./playing-page.component.scss'],
})
export class PlayingPageComponent implements OnInit, OnDestroy {
    showErrorPopup: boolean = false;
    saveState: boolean = false;
    gameLoaded: boolean = false;
    errorMessage: string = '';
    objectNumber: number = 0;
    lobby: GameLobby | null = null;
    currentPlayer: Player | null = null;
    players: Player[] = [];
    game: Game = {
        id: '',
        name: '',
        mapSize: 'small',
        mode: 'normal',
        previewImage: '',
        description: '',
        lastModified: new Date(),
        isVisible: true,
        board: [], // The board will be initialized when the game is fetched
        objects: [],
    };
    activePlayer: string = ''; // Active player name
    private destroy$ = new Subject<void>(); // For handling unsubscriptions
    private subscriptions: Subscription[] = [];

    private lobbyService = inject(LobbyService);
    private gameService = inject(GameService);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        const lobbyId = this.route.snapshot.paramMap.get('id');
        const playerId = this.route.snapshot.paramMap.get('playerId');

        if (lobbyId && playerId) {
            // Récupérer le lobby à partir du service
            this.subscriptions.push(
                this.lobbyService.getLobby(lobbyId).subscribe((lobby) => {
                    if (lobby) {
                        this.lobby = lobby;
                        this.currentPlayer = lobby.players.find((p) => p.id === playerId) || null;
                    } else {
                        this.notificationService.showError('Lobby not found!');
                    }
                }),
            );

            // Écoute des mises à jour du lobby
            this.subscriptions.push(
                this.lobbyService.onLobbyUpdated().subscribe((data) => {
                    if (data.lobbyId === lobbyId) {
                        this.lobby = data.lobby;
                        this.currentPlayer = data.lobby.players.find((p) => p.id === playerId) || null;
                    }
                }),
            );

            // Écouter la sortie des joueurs du lobby
            this.subscriptions.push(
                this.lobbyService.onPlayerLeft().subscribe((data) => {
                    if (this.lobby && data.playerName === this.currentPlayer?.name) {
                        this.notificationService.showError("Vous avez été expulsé par l'administrateur");
                        this.router.navigate(['/main'], { replaceUrl: true });
                    }
                }),
            );
        } else {
            this.notificationService.showError('Lobby ID or Player ID is missing.');
        }
    }

    ngOnDestroy(): void {
        // Annuler tous les abonnements pour éviter les fuites de mémoire
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    loadLobby(lobbyId: string, playerId: string): void {
        const lobbyObservable = this.lobbyService.getLobby(lobbyId);

        if (lobbyObservable) {
            lobbyObservable
                .pipe(takeUntil(this.destroy$)) // Automatically unsubscribes on destroy
                .subscribe({
                    next: (lobby) => {
                        if (lobby) {
                            this.lobby = lobby; // Store the fetched lobby data
                            this.currentPlayer = lobby.players.find((player) => player.id === playerId) || null;

                            this.loadGame(lobby.gameId); // Load the game using the game ID from the lobby
                        } else {
                            this.handleError('Lobby not found!');
                        }
                    },
                    error: () => this.handleError('Error loading lobby data'),
                });
        } else {
            this.handleError('Lobby not available!');
        }
    }

    loadGame(gameId: string): void {
        this.gameService
            .fetchGameById(gameId)
            .pipe(takeUntil(this.destroy$)) // Automatically unsubscribes on destroy
            .subscribe({
                next: (game: Game) => {
                    this.game = game;
                    if (!this.game?.board || this.game.board.length === 0) {
                        this.handleError('No board available for this game');
                    }
                    this.gameLoaded = true;
                    this.notificationService.showSuccess('Game loaded successfully');
                },
                error: () => this.handleError('Error loading game data'),
            });
    }

    resetBoard() {
        window.location.reload();
    }

    closePopup() {
        this.errorMessage = '';
        this.showErrorPopup = false;
        if (this.saveState) {
            this.router.navigate(['/admin']);
        }
        this.saveState = false;
    }

    endTurn() {
        // Logic to end the turn
    }

    abandon() {
        this.router.navigate(['/home']);
    }

    attack() {
        // Attack logic
    }

    defend() {
        // Defend logic
    }

    private handleError(message: string): void {
        this.notificationService.showError(message);
        this.errorMessage = message;
        this.showErrorPopup = true;
    }
}
