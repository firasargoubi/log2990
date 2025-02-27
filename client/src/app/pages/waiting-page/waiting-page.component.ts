import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
export class WaitingPageComponent implements OnInit {
    lobby: GameLobby | null = null;
    currentPlayer: Player = {
        id: '1234',
        name: 'foo',
        avatar: GAME_IMAGES.fawn,
        isHost: true,
    };
    hostId: string = '1234';

    constructor(private lobbyService: LobbyService) {}

    ngOnInit() {
        const lobbyId = this.lobbyService.createLobby(this.currentPlayer, 4);
        this.lobbyService.getLobby(lobbyId)?.subscribe((lobby) => {
            this.lobby = lobby;
        });
        this.lobbyService.addPlayerToLobby(lobbyId, {
            id: '5678',
            name: 'bar',
            avatar: GAME_IMAGES.bear,
            isHost: false,
        });
    }
    removePlayer(playerId: string) {
        if (this.lobby) {
            this.lobby.players = this.lobby.players.filter((player) => player.id !== playerId);
        }
    }
}
