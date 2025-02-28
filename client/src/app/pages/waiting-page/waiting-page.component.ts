import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameControlsComponent } from '@app/components/game-controls/game-controls.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { GAME_IMAGES } from '@app/Consts/app.constants';
import { LobbyService } from '@app/services/lobby.service';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';

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
        isHost: true,
    };
    hostId: string = '0000';
    private lobbySubscription!: Subscription;

    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private lobbyService = inject(LobbyService);

    constructor() {
        // Extract navigation state for player data (if available)
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras?.state) {
            const state = nav.extras.state as { playerData: Player; gameId: string };
            if (state.playerData) {
                this.currentPlayer = {
                    id: crypto.randomUUID(),
                    name: state.playerData.name,
                    avatar: state.playerData.avatar,
                    isHost: true,
                };
                this.hostId = this.currentPlayer.id;
            }
        } else {
            // Optionally redirect if no state was passed
            this.router.navigate(['/create'], { replaceUrl: true });
        }
    }

    ngOnInit(): void {
        const lobbyId = this.route.snapshot.paramMap.get('id');
        if (lobbyId) {
            const lobbyObservable = this.lobbyService.getLobby(lobbyId);
            if (lobbyObservable) {
                this.lobbySubscription = lobbyObservable.subscribe((lobby) => {
                    this.lobby = lobby;
                });
            }
        }
    }

    ngOnDestroy(): void {
        if (this.lobbySubscription) {
            this.lobbySubscription.unsubscribe();
        }
    }

    removePlayer(playerId: string): void {
        if (this.lobby) {
            this.lobby.players = this.lobby.players.filter((player) => player.id !== playerId);
        }
    }
}
