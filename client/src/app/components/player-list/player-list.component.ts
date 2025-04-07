import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { LobbyService } from '@app/services/lobby.service';
import { Player } from '@common/player';
import { PlayerCardComponent } from '@app/components/player-card/player-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VirtualPlayerDialogComponent } from '@app/components/virtual-player-dialog/virtual-player-dialog.component';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
    imports: [PlayerCardComponent, MatCardModule, MatDialogModule],
})
export class PlayerListComponent {
    @Input() players: Player[];
    @Input() currentPlayer: Player;
    @Input() lobbyId: string = '';
    @Input() hostId: string = '';
    @Output() removePlayer = new EventEmitter<string>();
    lobbyService = inject(LobbyService);

    constructor(private dialog: MatDialog) {}

    isHost(player: Player): boolean {
        return player.id === this.hostId;
    }

    remove(playerId: string) {
        this.removePlayer.emit(playerId);
    }

    openVirtualPlayerDialog() {
        const dialogRef = this.dialog.open(VirtualPlayerDialogComponent, {});
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.lobbyService.joinLobby(this.lobbyId, result);
            }
        });
    }
}
