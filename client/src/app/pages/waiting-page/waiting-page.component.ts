import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameControlsComponent } from '@app/components/game-controls/game-controls.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { GAME_IMAGES } from '@app/Consts/app.constants';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterLink, GameControlsComponent, PlayerListComponent],
})
export class WaitingPageComponent implements OnInit, OnDestroy {
    lobby: GameLobby;
    currentPlayer: Player = {
        id: '0000',
        name: 'Unknown',
        avatar: GAME_IMAGES.fawn,
        isHost: false,
        life: 0,
        speed: 0,
        attack: 0,
        defense: 0,
    };
    hostId: string = '0000';
    randomNumber: number = 1000;
    private subscriptions: Subscription[] = [];

    private route = inject(ActivatedRoute);
    private lobbyService = inject(LobbyService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    ngOnInit(): void {
        this.generateRandomNumber();

        const lobbyId = this.route.snapshot.paramMap.get('id');
        const playerId = this.route.snapshot.paramMap.get('playerId');

        if (lobbyId && playerId) {
            this.subscriptions.push(
                this.lobbyService.getLobby(lobbyId).subscribe((lobby) => {
                    this.lobby = lobby;
                    this.currentPlayer = lobby.players.find((p) => p.id === playerId) || this.currentPlayer;
                    this.hostId = lobby.players.find((p) => p.isHost)?.id || '';
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onLobbyUpdated().subscribe((data) => {
                    if (data.lobbyId === lobbyId) {
                        this.lobby = data.lobby;
                        this.currentPlayer = data.lobby.players.find((p) => p.id === playerId) || this.currentPlayer;
                        this.hostId = data.lobby.players.find((p) => p.isHost)?.id || '';
                    }
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onPlayerLeft().subscribe((data) => {
                    if (this.lobby) {
                        if (data.playerName === this.currentPlayer.name) {
                            this.notificationService.showError("Vous avez été expulsé par l'administrateur");
                            this.router.navigate(['/main'], { replaceUrl: true });
                        }
                    }
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onGameStarted().subscribe(() => {
                    console.log('Game started event received in waiting page, navigating to play page');
                    this.lobbyService.setCurrentPlayer(this.currentPlayer);
                    this.router.navigate(['/play', lobbyId]);
                }),
            );
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    isHost() {
        return this.currentPlayer.id === this.hostId;
    }

    removePlayer(playerId: string): void {
        if (this.lobby) {
            const player = this.lobby.players.find((p) => p.id === playerId);
            if (player) {
                this.lobbyService.leaveLobby(this.lobby.id, player.name);
            }
        }
    }

    lockRoom(): void {
        if (this.lobby?.id) {
            this.lobbyService.lockLobby(this.lobby.id);
            this.notificationService.showSuccess('Cette partie est verrouillée');
        }
    }

    startGame() {
        if (!this.isHost() || !this.lobby.id) {
            this.notificationService.showError('Only the host can start the game');
            return;
        }

        console.log(`Requesting game start for lobby ${this.lobby.id}`);
        this.lobbyService.requestStartGame(this.lobby.id);
    }

    generateRandomNumber(): void {
        this.randomNumber = Math.floor(Math.random() * 9000) + 1000;
    }
}
