import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameControlsComponent } from '@app/components/game-controls/game-controls.component';
import { MessagesComponent } from '@app/components/messages/messages.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { WAITING_PAGE, WAITING_PAGE_CONSTANTS } from '@app/Consts/app-constants';
import { PageUrl } from '@app/Consts/route-constants';
import { LobbyService } from '@app/services/lobby.service';
import { NotificationService } from '@app/services/notification.service';
import { AVATARS } from '@common/avatars';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
    standalone: true,
    imports: [CommonModule, RouterLink, GameControlsComponent, PlayerListComponent, MessagesComponent],
})
export class WaitingPageComponent implements OnInit, OnDestroy {
    lobby: GameLobby;
    messages: string[] = [];

    currentPlayer: Player = {
        id: WAITING_PAGE.defaultPlayerId,
        name: WAITING_PAGE.defaultPlayerName,
        avatar: AVATARS.fawn,
        isHost: false,
        life: 0,
        maxLife: 0,
        speed: 0,
        attack: 0,
        defense: 0,
        winCount: 0,
        pendingItem: 0,
    };
    hostId: string = WAITING_PAGE.defaultPlayerId;
    private subscriptions: Subscription[] = [];

    private route = inject(ActivatedRoute);
    private lobbyService = inject(LobbyService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    ngOnInit(): void {
        const lobbyId = this.route.snapshot.paramMap.get(WAITING_PAGE.lobbyIdParam);
        const player = this.route.snapshot.paramMap.get(WAITING_PAGE.playerIdParam);

        if (lobbyId && player) {
            this.lobbyService.joinLobbyMessage(lobbyId);
            this.lobbyService.getLobby(lobbyId).subscribe((lobby) => {
                this.lobby = lobby;
                this.currentPlayer = lobby.players.find((p) => p.id === player) || this.currentPlayer;
                if (this.currentPlayer.id === WAITING_PAGE.defaultHostId) {
                    this.router.navigate([PageUrl.Home], { replaceUrl: true });
                    return;
                }
                this.hostId = lobby.players.find((p) => p.isHost)?.id || '';
            });

            this.subscriptions.push(
                this.lobbyService.onLobbyUpdated().subscribe((data) => {
                    if (data.lobby.id === lobbyId) {
                        this.lobby = data.lobby;
                        const currentPlayer = data.lobby.players.find((p) => p.id === player);
                        if (!currentPlayer) {
                            this.lobbyService.disconnectFromRoom(lobbyId);
                            this.router.navigate([PageUrl.Home], { replaceUrl: true });
                            return;
                        }
                        this.currentPlayer = currentPlayer;
                        this.hostId = data.lobby.players.find((p) => p.isHost)?.id || '';
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
                    this.lobbyService.setCurrentPlayer(this.currentPlayer);
                    this.router.navigate([`${PageUrl.Play}/${lobbyId}`]);
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
            const message = this.lobby.isLocked ? WAITING_PAGE_CONSTANTS.gameUnlocked : WAITING_PAGE_CONSTANTS.gameLocked;
            this.notificationService.showSuccess(message);
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
