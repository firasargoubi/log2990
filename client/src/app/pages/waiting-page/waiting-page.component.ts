import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameControlsComponent } from '@app/components/game-controls/game-controls.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { GAME_IMAGES } from '@app/Consts/app.constants';
import { LobbyService } from '@app/services/lobby.service';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';
import { CurrentPlayerService } from '@app/services/current-player.service';

@Component({
    selector: 'app-waiting-page',
    imports: [RouterLink, GameControlsComponent, PlayerListComponent],
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingPageComponent implements OnInit, OnDestroy {
    lobby: GameLobby | null = null;
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
    private currentPlayerService = inject(CurrentPlayerService);

    constructor() {
        const storedData = this.currentPlayerService.getCurrentPlayer();
        if (storedData && storedData.player) {
            this.currentPlayer = storedData.player;
            this.hostId = storedData.player.id;
        }
    }

    ngOnInit(): void {
        const lobbyId = this.route.snapshot.paramMap.get('id');
        if (lobbyId) {
            this.subscriptions.push(
                this.lobbyService.getLobby(lobbyId).subscribe((lobby) => {
                    this.lobby = lobby;
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onLobbyUpdated().subscribe((data) => {
                    if (data.lobbyId === lobbyId) {
                        this.lobby = data.lobby;
                    }
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onPlayerJoined().subscribe((data) => {
                    if (data.lobbyId === lobbyId) {
                        this.lobby?.players.push(data.player);
                    }
                }),
            );

            this.subscriptions.push(
                this.lobbyService.onPlayerLeft().subscribe((data) => {
                    if (this.lobby) {
                        this.lobby.players = this.lobby.players.filter((player) => player.name !== data.playerName);
                    }
                }),
            );
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    removePlayer(playerId: string): void {
        if (this.lobby) {
            const player = this.lobby.players.find((p) => p.id === playerId);
            if (player) {
                this.lobbyService.leaveLobby(this.lobby.id, player.name);
            }
        }
    }
}
