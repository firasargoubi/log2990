import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChatComponent } from '@app/components/chat/chat.component';
import { GameControlsComponent } from '@app/components/game-controls/game-controls.component';
import { PlayerListComponent } from '@app/components/player-list/player-list.component';
import { LobbyService } from '@app/services/lobby.service';
import { GameLobby } from '@common/game-lobby';
import { Player } from '@common/player';

@Component({
    selector: 'app-waiting-page',
    imports: [RouterLink, GameControlsComponent, ChatComponent, PlayerListComponent],
    templateUrl: './waiting-page.component.html',
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingPageComponent implements OnInit {
    lobby: GameLobby | null = null;
    currentPlayer: Player = {
        id: '1234',
        name: 'hamido',
        avatar: '',
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
            name: 'rapido',
            avatar: '',
            isHost: false,
        });
    }
    removePlayer(playerId: string) {
        if (this.lobby) {
            this.lobby.players = this.lobby.players.filter((player) => player.id !== playerId);
        }
    }
}
