import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Player } from '@common/player';
import { PlayerCardComponent } from '@app/components/player-card/player-card.component';

@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
    imports: [PlayerCardComponent],
})
export class PlayerListComponent {
    @Input() players: Player[];
    @Input() currentPlayer: Player;
    @Input() hostId: string = '';
    @Output() removePlayer = new EventEmitter<string>();

    isHost(player: Player): boolean {
        return player.id === this.hostId;
    }

    remove(playerId: string) {
        this.removePlayer.emit(playerId);
    }
}
