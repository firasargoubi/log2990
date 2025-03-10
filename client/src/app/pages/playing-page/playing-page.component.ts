import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/game.model';
import { GameService } from '@app/services/game.service';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';
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
    lobby: GameLobby | null = null;
    currentPlayer: Player | null = null;
    players: Player[] = [];
    gameLoaded: boolean = false;
    game: Game = {
        id: '',
        name: '',
        mapSize: 'small',
        mode: 'normal',
        previewImage: '',
        description: '',
        lastModified: new Date(),
        isVisible: true,
        board: [],
        objects: [],
    };
    activePlayer: string = ''; // Active player name
    private subscriptions: Subscription[] = [];

    private route = inject(ActivatedRoute);
    private lobbyService = inject(LobbyService);
    private gameService = inject(GameService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    ngOnInit(): void {
        // Récupération de l'ID du lobby et du joueur à partir des paramètres de l'URL
        const lobbyId = this.route.snapshot.paramMap.get('id');
        const playerId = this.route.snapshot.paramMap.get('playerId');

        console.log('Lobby ID:', lobbyId); // Debug
        console.log('Player ID:', playerId); // Debug
        if (lobbyId && playerId) {
            this.loadLobby(lobbyId, playerId); // Charger le lobby et le joueur
        } else {
            this.notificationService.showError('Lobby ID or Player ID is missing!');
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe()); // Se désabonner des abonnements
    }

    // Méthode pour charger le lobby et le joueur à partir du service
    loadLobby(lobbyId: string, playerId: string): void {
        this.subscriptions.push(
            this.lobbyService.getLobby(lobbyId).subscribe({
                next: (lobby) => {
                    if (lobby) {
                        this.lobby = lobby; // Récupérer les informations du lobby
                        this.currentPlayer = lobby.players.find((player) => player.id === playerId) || null; // Trouver le joueur dans le lobby

                        if (this.currentPlayer) {
                            console.log('Player found:', this.currentPlayer);
                            this.loadGame(lobby.gameId); // Charger le jeu avec l'ID du jeu du lobby
                            // Vous pouvez charger d'autres informations du jeu si nécessaire
                        } else {
                            this.notificationService.showError('Player not found in the lobby');
                        }
                    } else {
                        this.notificationService.showError('Lobby not found!');
                    }
                },
                error: (err) => {
                    this.notificationService.showError('Error loading lobby: ' + err);
                },
            }),
        );
    }

    loadGame(gameId: string): void {
        this.gameService.fetchGameById(gameId).subscribe({
            next: (game: Game) => {
                this.game = game;
                console.log('Game loaded:', game); // Debug
                if (!this.game?.board || this.game.board.length === 0) {
                    this.notificationService.showError('No board available for this game');
                }
                this.gameLoaded = true; // Marquer que le jeu est chargé
            },
            error: (err) => {
                this.notificationService.showError('Error loading game: ' + err);
            },
        });
    }

    resetBoard() {
        window.location.reload();
    }

    endTurn() {
        // Logique pour terminer le tour
    }

    abandon() {
        this.router.navigate(['/home']);
    }

    attack() {
        // Logique pour attaquer
    }

    defend() {
        // Logique pour se défendre
    }
}
