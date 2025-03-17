import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameControlsComponent } from '@app/components/game-controls/game-controls.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { GAME_IMAGES, WAITING_PAGE_CONSTANTS } from '@app/Consts/app.constants';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';
import { PageUrl } from '@app/Consts/route-constants';
import { MessagesComponent } from '@app/components/messages/messages.component';

@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterLink, GameControlsComponent, PlayerListComponent, MessagesComponent],
})
export class WaitingPageComponent implements OnInit, OnDestroy {
    lobby: GameLobby | null;
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
    private subscriptions: Subscription[] = [];

    private route = inject(ActivatedRoute);
    private lobbyService = inject(LobbyService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    ngOnInit(): void {
        const lobbyId = this.route.snapshot.paramMap.get('id');
        const player = this.route.snapshot.paramMap.get('playerId');

        if (lobbyId && player) {
            this.lobbyService.getLobby(lobbyId).subscribe((lobby) => {
                this.lobby = { ...lobby, players: [...lobby.players] };
                this.currentPlayer = lobby.players.find((p) => p.id === player) || this.currentPlayer;
                this.hostId = lobby.players.find((p) => p.isHost)?.id || '';
            });

            this.subscriptions.push(
                this.lobbyService.onLobbyUpdated().subscribe((data) => {
                    if (data.lobbyId === lobbyId) {
                        this.lobby = { ...data.lobby, players: [...data.lobby.players], isLocked: data.lobby.isLocked, gameId: data.lobby.gameId };
                        this.currentPlayer = data.lobby.players.find((p) => p.id === player) || this.currentPlayer;
                        this.hostId = data.lobby.players.find((p) => p.isHost)?.id || '';
                    }
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onPlayerLeft().subscribe((data) => {
                    if (this.lobby) {
                        if (data.playerName === this.currentPlayer.name) {
                            this.notificationService.showError(WAITING_PAGE_CONSTANTS.errorPlayerKicked);
                            this.router.navigate([PageUrl.Home], { replaceUrl: true });
                        }
                    }
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onHostDisconnected().subscribe(() => {
                    this.notificationService.showError(WAITING_PAGE_CONSTANTS.lobbyCancelled);
                    this.router.navigate([PageUrl.Home], { replaceUrl: true });
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onError().subscribe({
                    next: (error) => {
                        this.notificationService.showError(error);
                    },
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onGameStarted().subscribe(() => {
                    console.log('Game started');
                    this.lobbyService.setCurrentPlayer(this.currentPlayer);
                    this.router.navigate([`${PageUrl.Play}/${lobbyId}`]);
                }),
            );
            this.subscriptions.push(
                this.lobbyService.onPlayerJoined().subscribe(() => {
                    if (this.lobby && this.lobby.players.length === this.lobby.maxPlayers) {
                        this.lobbyService.lockLobby(lobbyId);
                    }
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
            this.notificationService.showSuccess(WAITING_PAGE_CONSTANTS.gameLocked);
        }
    }

    startGame(): void {
        if (this.lobby && this.currentPlayer) {
            this.lobbyService.requestStartGame(this.lobby.id);
        } else {
            this.notificationService.showError(WAITING_PAGE_CONSTANTS.errorStartGame);
        }
    }
}
